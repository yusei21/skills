//! `yus skills suggest "<task>"`: recommend skills and department plugins.
//!
//! Reads three sources from an yus checkout and needs no session state:
//! - `manifests/skill-departments.json` (department -> groups -> skills),
//! - `manifests/context-packs/skill-triggers@1.json` (optional trigger phrases),
//! - the `description` in each `skills/<department>/<skill>/SKILL.md`.
//!
//! Scoring is lexical and deterministic, so the same task always gets the same
//! answer. The core department ships in the `yus` plugin; every other
//! department ships as `yus-<department>`.

use anyhow::{Context, Result, bail};
use serde::Serialize;
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

const DEPARTMENTS_MANIFEST: &str = "manifests/skill-departments.json";
const TRIGGERS_MANIFEST: &str = "manifests/context-packs/skill-triggers@1.json";
const MARKETPLACE: &str = "yus";
const CORE_DEPARTMENT: &str = "core";
const SKILLS_PER_DEPARTMENT: usize = 3;
const MAX_DESCRIPTION_POINTS: u32 = 6;
const MIN_SKILL_SCORE: u32 = 2;
const MAX_MANIFEST_BYTES: u64 = 4 * 1024 * 1024;
const MAX_SKILL_MD_BYTES: u64 = 256 * 1024;

const STOPWORDS: &[&str] = &[
    "a", "an", "and", "any", "are", "as", "at", "be", "by", "can", "do", "for", "from", "how", "i",
    "in", "into", "is", "it", "its", "me", "my", "need", "of", "on", "or", "our", "should", "so",
    "that", "the", "their", "this", "to", "up", "use", "using", "want", "we", "when", "with",
    "without", "you", "your", "new", "make", "help", "add", "get", "set", "use", "uses", "used",
    "skill", "skills", "task", "work", "what", "which", "who", "will", "via",
];

#[derive(Debug, Clone)]
struct Skill {
    name: String,
    department: String,
    triggers: Vec<String>,
    name_tokens: BTreeSet<String>,
    description_tokens: BTreeSet<String>,
}

#[derive(Debug, Clone)]
struct Department {
    id: String,
    title: String,
}

#[derive(Debug)]
pub struct Catalog {
    departments: Vec<Department>,
    skills: Vec<Skill>,
    triggers_coverage: (usize, usize),
    /// How many skills use each token in their name / description. Rare
    /// tokens ("stripe") identify a skill; common ones ("js", "app") do not.
    name_df: BTreeMap<String, usize>,
    description_df: BTreeMap<String, usize>,
}

#[derive(Debug, Serialize, PartialEq)]
pub struct SkillMatch {
    pub skill: String,
    pub score: u32,
    pub reasons: Vec<String>,
}

#[derive(Debug, Serialize, PartialEq)]
pub struct DepartmentSuggestion {
    pub department: String,
    pub title: String,
    pub plugin: String,
    pub install: String,
    pub score: u32,
    pub skills: Vec<SkillMatch>,
}

#[derive(Debug, Serialize)]
pub struct Suggestion {
    pub task: String,
    pub departments: Vec<DepartmentSuggestion>,
}

/// Entry point for the CLI subcommand.
pub fn run_suggest(task: &str, root: Option<PathBuf>, limit: usize, json: bool) -> Result<()> {
    if task.trim().is_empty() {
        bail!("Describe the task, for example: yus skills suggest \"add a Stripe webhook\"");
    }
    let root = resolve_root(root)?;
    let catalog = Catalog::load(&root)?;
    let suggestion = catalog.suggest(task, limit.max(1));
    if json {
        println!("{}", serde_json::to_string_pretty(&suggestion)?);
    } else {
        print!("{}", render_text(&suggestion, catalog.triggers_coverage));
    }
    Ok(())
}

/// `--root`, then `YUS_ROOT`, then the nearest ancestor of the working
/// directory or of the executable that holds the departments manifest.
fn resolve_root(explicit: Option<PathBuf>) -> Result<PathBuf> {
    if let Some(root) = explicit.or_else(|| std::env::var_os("YUS_ROOT").map(PathBuf::from)) {
        if root.join(DEPARTMENTS_MANIFEST).is_file() {
            return Ok(root);
        }
        bail!(
            "{} not found under {}",
            DEPARTMENTS_MANIFEST,
            root.display()
        );
    }
    let starts = [
        std::env::current_dir().ok(),
        std::env::current_exe()
            .ok()
            .and_then(|exe| exe.parent().map(Path::to_path_buf)),
    ];
    for start in starts.into_iter().flatten() {
        if let Some(found) = start
            .ancestors()
            .find(|dir| dir.join(DEPARTMENTS_MANIFEST).is_file())
        {
            return Ok(found.to_path_buf());
        }
    }
    bail!("Could not find an yus checkout. Run inside one, or pass --root <dir> or set YUS_ROOT.")
}

fn read_bounded(path: &Path, max_bytes: u64) -> Result<String> {
    let size = fs::metadata(path)
        .with_context(|| format!("Failed to stat {}", path.display()))?
        .len();
    if size > max_bytes {
        bail!("{} exceeds the {max_bytes}-byte limit", path.display());
    }
    fs::read_to_string(path).with_context(|| format!("Failed to read {}", path.display()))
}

impl Catalog {
    pub fn load(root: &Path) -> Result<Self> {
        let manifest: serde_json::Value = serde_json::from_str(&read_bounded(
            &root.join(DEPARTMENTS_MANIFEST),
            MAX_MANIFEST_BYTES,
        )?)
        .context("Invalid skill-departments.json")?;

        let triggers_path = root.join(TRIGGERS_MANIFEST);
        let triggers: BTreeMap<String, Vec<String>> = if triggers_path.is_file() {
            let value: serde_json::Value =
                serde_json::from_str(&read_bounded(&triggers_path, MAX_MANIFEST_BYTES)?)
                    .context("Invalid skill-triggers@1.json")?;
            serde_json::from_value(value.get("triggers").cloned().unwrap_or_default())
                .context("skill-triggers@1.json: `triggers` must map skill ids to string lists")?
        } else {
            BTreeMap::new()
        };

        let mut departments = Vec::new();
        let mut entries = Vec::new();
        for department in manifest["departments"].as_array().into_iter().flatten() {
            let id = department["id"].as_str().unwrap_or_default().to_string();
            if id.is_empty() {
                continue;
            }
            departments.push(Department {
                id: id.clone(),
                title: department["title"].as_str().unwrap_or(&id).to_string(),
            });
            for group in department["groups"].as_array().into_iter().flatten() {
                for name in group["skills"].as_array().into_iter().flatten() {
                    if let Some(name) = name.as_str() {
                        entries.push((id.clone(), name.to_string()));
                    }
                }
            }
        }
        if departments.is_empty() {
            bail!("skill-departments.json lists no departments");
        }

        let mut skills = Vec::with_capacity(entries.len());
        let mut with_triggers = 0;
        for (department, name) in entries {
            let description = read_description(root, &department, &name);
            let skill_triggers = triggers
                .get(&format!("skill:{name}"))
                .cloned()
                .unwrap_or_default();
            if !skill_triggers.is_empty() {
                with_triggers += 1;
            }
            skills.push(Skill {
                name_tokens: tokens(&normalize(&name)),
                description_tokens: tokens(&normalize(&description)),
                name,
                department,
                triggers: skill_triggers,
            });
        }
        let mut name_df = BTreeMap::new();
        let mut description_df = BTreeMap::new();
        for skill in &skills {
            for token in &skill.name_tokens {
                *name_df.entry(token.clone()).or_insert(0) += 1;
            }
            for token in &skill.description_tokens {
                *description_df.entry(token.clone()).or_insert(0) += 1;
            }
        }
        let total = skills.len();
        Ok(Self {
            departments,
            skills,
            triggers_coverage: (with_triggers, total),
            name_df,
            description_df,
        })
    }

    pub fn suggest(&self, task: &str, limit: usize) -> Suggestion {
        let task_text = normalize(task);
        let task_tokens = tokens(&task_text);

        let mut by_department: BTreeMap<&str, Vec<SkillMatch>> = BTreeMap::new();
        for skill in &self.skills {
            if let Some(found) = self.score_skill(skill, &task_text, &task_tokens) {
                by_department
                    .entry(&skill.department)
                    .or_default()
                    .push(found);
            }
        }

        let mut departments: Vec<DepartmentSuggestion> = self
            .departments
            .iter()
            .filter_map(|department| {
                let mut matches = by_department.remove(department.id.as_str())?;
                matches.sort_by(|a, b| b.score.cmp(&a.score).then_with(|| a.skill.cmp(&b.skill)));
                matches.truncate(SKILLS_PER_DEPARTMENT);
                // Best match counts in full, the next ones at half: one exact skill
                // beats a big department full of weak description hits.
                let score = matches
                    .iter()
                    .enumerate()
                    .map(|(i, m)| if i == 0 { m.score } else { m.score / 2 })
                    .sum();
                let plugin = plugin_for(&department.id);
                Some(DepartmentSuggestion {
                    department: department.id.clone(),
                    title: department.title.clone(),
                    install: format!("/plugin install {plugin}@{MARKETPLACE}"),
                    plugin,
                    score,
                    skills: matches,
                })
            })
            .collect();
        departments.sort_by(|a, b| {
            b.score
                .cmp(&a.score)
                .then_with(|| a.department.cmp(&b.department))
        });
        departments.truncate(limit);

        Suggestion {
            task: task.trim().to_string(),
            departments,
        }
    }

    /// Points for a name token: rare words in skill names are strong signals.
    fn name_weight(&self, token: &str) -> u32 {
        match self.name_df.get(token).copied().unwrap_or(0) {
            0..=3 => 6,
            4..=10 => 3,
            _ => 1,
        }
    }

    /// Points for a description token; words in more than a tenth of all
    /// descriptions score nothing.
    fn description_weight(&self, token: &str) -> u32 {
        let df = self.description_df.get(token).copied().unwrap_or(0);
        if df > 3 && df * 10 > self.skills.len() {
            0
        } else if df <= 3 {
            3
        } else if df <= 12 {
            2
        } else {
            1
        }
    }

    fn score_skill(
        &self,
        skill: &Skill,
        task_text: &str,
        task_tokens: &BTreeSet<String>,
    ) -> Option<SkillMatch> {
        let mut score = 0;
        let mut reasons = Vec::new();

        for trigger in &skill.triggers {
            let phrase = normalize(trigger);
            let phrase_tokens = tokens(&phrase);
            if contains_phrase(task_text, &phrase) {
                score += 6;
                reasons.push(format!("trigger \"{trigger}\""));
            } else if phrase_tokens.len() >= 2 {
                let hits = phrase_tokens.intersection(task_tokens).count();
                if hits * 3 >= phrase_tokens.len() * 2 {
                    score += 2 * hits as u32;
                    reasons.push(format!("trigger ~\"{trigger}\""));
                }
            }
        }

        let name_hits: Vec<_> = skill.name_tokens.intersection(task_tokens).collect();
        if !name_hits.is_empty() {
            score += name_hits.iter().map(|t| self.name_weight(t)).sum::<u32>();
            reasons.push(format!("name: {}", join(&name_hits)));
        }

        let description_hits: Vec<_> = skill
            .description_tokens
            .intersection(task_tokens)
            .filter(|token| !skill.name_tokens.contains(*token))
            .filter(|token| self.description_weight(token) > 0)
            .collect();
        if !description_hits.is_empty() {
            let points: u32 = description_hits
                .iter()
                .map(|t| self.description_weight(t))
                .sum();
            score += points.min(MAX_DESCRIPTION_POINTS);
            reasons.push(format!("description: {}", join(&description_hits)));
        }

        (score >= MIN_SKILL_SCORE).then(|| SkillMatch {
            skill: skill.name.clone(),
            score,
            reasons,
        })
    }
}

fn join(tokens: &[&String]) -> String {
    tokens
        .iter()
        .map(|t| t.as_str())
        .collect::<Vec<_>>()
        .join(", ")
}

fn plugin_for(department: &str) -> String {
    if department == CORE_DEPARTMENT {
        MARKETPLACE.to_string()
    } else {
        format!("yus-{department}")
    }
}

/// Reads `description:` from the SKILL.md frontmatter. Accepts the department
/// layout and the flat installed layout; a missing file scores on name only.
fn read_description(root: &Path, department: &str, name: &str) -> String {
    let candidates = [
        root.join("skills")
            .join(department)
            .join(name)
            .join("SKILL.md"),
        root.join("skills").join(name).join("SKILL.md"),
    ];
    candidates
        .iter()
        .find_map(|path| read_bounded(path, MAX_SKILL_MD_BYTES).ok())
        .map(|text| frontmatter_description(&text))
        .unwrap_or_default()
}

fn frontmatter_description(text: &str) -> String {
    let mut lines = text.lines();
    if lines.next().map(str::trim) != Some("---") {
        return String::new();
    }
    for line in lines {
        if line.trim() == "---" {
            break;
        }
        if let Some(value) = line.strip_prefix("description:") {
            let value = value.trim();
            let unquoted = value
                .strip_prefix('"')
                .and_then(|v| v.strip_suffix('"'))
                .or_else(|| value.strip_prefix('\'').and_then(|v| v.strip_suffix('\'')))
                .unwrap_or(value);
            return unquoted.replace("\\\"", "\"");
        }
    }
    String::new()
}

/// Lowercase, keep letters, digits, `+` and `#` (c++, c#), collapse the rest.
/// A dot between letters joins them, so "Next.js" and "nextjs" meet.
fn normalize(text: &str) -> String {
    let lower: Vec<char> = text.to_lowercase().chars().collect();
    let mapped: String = lower
        .iter()
        .enumerate()
        .filter_map(|(i, &c)| {
            if c.is_alphanumeric() || c == '+' || c == '#' {
                Some(c)
            } else if c == '.'
                && i > 0
                && lower[i - 1].is_alphanumeric()
                && lower.get(i + 1).is_some_and(|n| n.is_alphabetic())
            {
                None
            } else {
                Some(' ')
            }
        })
        .collect();
    mapped.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// Content words with a light suffix strip, so "tests"/"testing" meet "test".
fn tokens(normalized: &str) -> BTreeSet<String> {
    normalized
        .split(' ')
        .filter(|word| word.chars().count() >= 2 && !STOPWORDS.contains(word))
        .map(stem)
        .collect()
}

fn stem(word: &str) -> String {
    // Leave words where a trailing "s" is not a plural: nextjs, kubernetes, redis.
    if ["ss", "us", "is", "js", "tes"]
        .iter()
        .any(|end| word.ends_with(end))
    {
        return word.to_string();
    }
    for suffix in ["ing", "ed", "es", "s"] {
        if word.len() > suffix.len() + 3 {
            if let Some(base) = word.strip_suffix(suffix) {
                return base.to_string();
            }
        }
    }
    word.to_string()
}

fn contains_phrase(haystack: &str, phrase: &str) -> bool {
    !phrase.is_empty() && format!(" {haystack} ").contains(&format!(" {phrase} "))
}

fn render_text(suggestion: &Suggestion, (with_triggers, total): (usize, usize)) -> String {
    let mut out = String::new();
    if suggestion.departments.is_empty() {
        out.push_str(&format!(
            "No skill matched \"{}\". Try naming the technology or the kind of change.\n",
            suggestion.task
        ));
        return out;
    }
    out.push_str(&format!("Suggested for: {}\n\n", suggestion.task));
    for (rank, department) in suggestion.departments.iter().enumerate() {
        out.push_str(&format!(
            "{}. {} ({}) - score {}\n   install: {}\n",
            rank + 1,
            department.title,
            department.plugin,
            department.score,
            department.install
        ));
        for found in &department.skills {
            out.push_str(&format!(
                "   - {} [{}] {}\n",
                found.skill,
                found.score,
                found.reasons.join("; ")
            ));
        }
        out.push('\n');
    }
    if total > 0 && with_triggers < total {
        out.push_str(&format!(
            "Trigger phrases cover {with_triggers}/{total} skills; the rest match on name and description.\n"
        ));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture() -> (PathBuf, Catalog) {
        let root = std::env::temp_dir().join(format!("yus2-skills-{}", uuid::Uuid::new_v4()));
        let write = |rel: &str, text: &str| {
            let path = root.join(rel);
            fs::create_dir_all(path.parent().unwrap()).unwrap();
            fs::write(path, text).unwrap();
        };
        write(
            DEPARTMENTS_MANIFEST,
            r#"{"departments":[
              {"id":"core","title":"Core engineering","groups":[{"id":"w","skills":["tdd-workflow"]}]},
              {"id":"backend","title":"Backend","groups":[{"id":"b","skills":["stripe-payments","postgres-patterns"]}]},
              {"id":"frontend","title":"Frontend","groups":[{"id":"f","skills":["react-patterns"]}]}
            ]}"#,
        );
        write(
            TRIGGERS_MANIFEST,
            r#"{"triggers":{"skill:stripe-payments":["stripe webhook","checkout session"]}}"#,
        );
        write(
            "skills/core/tdd-workflow/SKILL.md",
            "---\nname: tdd-workflow\ndescription: \"Write a failing test first, then implement.\"\n---\n",
        );
        write(
            "skills/backend/stripe-payments/SKILL.md",
            "---\nname: stripe-payments\ndescription: Payments, subscriptions and webhooks with Stripe.\n---\n",
        );
        write(
            "skills/backend/postgres-patterns/SKILL.md",
            "---\nname: postgres-patterns\ndescription: 'Schema design, indexes and queries for PostgreSQL.'\n---\n",
        );
        // react-patterns has no SKILL.md on purpose: it still scores on its name.
        let catalog = Catalog::load(&root).unwrap();
        (root, catalog)
    }

    #[test]
    fn trigger_phrase_ranks_its_department_first() {
        let (root, catalog) = fixture();
        let result = catalog.suggest("Add a Stripe webhook for refunds", 3);
        let first = &result.departments[0];
        assert_eq!(first.department, "backend");
        assert_eq!(first.plugin, "yus-backend");
        assert_eq!(first.install, "/plugin install yus-backend@yus");
        assert_eq!(first.skills[0].skill, "stripe-payments");
        assert!(first.skills[0].reasons[0].starts_with("trigger \"stripe webhook\""));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn core_department_maps_to_the_base_plugin() {
        let (root, catalog) = fixture();
        let result = catalog.suggest("write failing tests before the fix", 1);
        assert_eq!(result.departments.len(), 1);
        assert_eq!(result.departments[0].department, "core");
        assert_eq!(result.departments[0].plugin, "yus");
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn missing_skill_md_still_matches_by_name() {
        let (root, catalog) = fixture();
        let result = catalog.suggest("react component", 3);
        assert_eq!(result.departments[0].skills[0].skill, "react-patterns");
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn unrelated_task_returns_nothing() {
        let (root, catalog) = fixture();
        assert!(
            catalog
                .suggest("plan a wedding menu", 3)
                .departments
                .is_empty()
        );
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn same_task_gives_the_same_order() {
        let (root, catalog) = fixture();
        let a = catalog.suggest("postgres index for stripe checkout session", 3);
        let b = catalog.suggest("postgres index for stripe checkout session", 3);
        assert_eq!(a.departments, b.departments);
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn frontmatter_description_handles_quotes_and_missing_fences() {
        assert_eq!(
            frontmatter_description("---\ndescription: \"a \\\"b\\\"\"\n---"),
            "a \"b\""
        );
        assert_eq!(frontmatter_description("---\ndescription: 'x'\n---"), "x");
        assert_eq!(frontmatter_description("description: no fence"), "");
    }

    #[test]
    fn stem_and_normalize_keep_language_names() {
        assert_eq!(
            normalize("C++ and C#, Next.js! v1.2"),
            "c++ and c# nextjs v1 2"
        );
        assert_eq!(stem("testing"), "test");
        assert_eq!(stem("tests"), "test");
        assert_eq!(stem("api"), "api");
        assert_eq!(stem("nextjs"), "nextjs");
        assert_eq!(stem("kubernetes"), "kubernetes");
    }

    #[test]
    fn explicit_root_without_manifest_is_rejected() {
        let empty = std::env::temp_dir().join(format!("yus2-empty-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&empty).unwrap();
        let error = resolve_root(Some(empty.clone())).unwrap_err().to_string();
        assert!(error.contains("not found under"));
        fs::remove_dir_all(empty).unwrap();
    }
}
