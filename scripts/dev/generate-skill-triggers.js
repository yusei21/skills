#!/usr/bin/env node
'use strict';

// Dev-time generator for manifests/context-packs/skill-triggers@1.json.
//
// For every canonical skill, asks the pinned provider for short trigger
// phrasings a user would type when that skill applies (synonyms, task
// wordings, related technology names), grounded STRICTLY in the skill's own
// description. The manifest is checked in, digest-stable, and read by the
// retrieval index at runtime, so runtime behavior stays deterministic and
// offline. Rerun this script after adding or re-describing skills.
//
// Usage:
//   node scripts/dev/generate-skill-triggers.js --auth-home ~/.yus-eval/auth \
//     [--model gpt-5.6-sol] [--executable /path/to/codex] [--batch 25] [--dry-run]
//   node scripts/dev/generate-skill-triggers.js --provider claude \
//     [--model claude-sonnet-5-5] [--executable /path/to/claude] [--batch 40] [--dry-run]
//   node scripts/dev/generate-skill-triggers.js --keep-triggers
//   node scripts/dev/generate-skill-triggers.js --provider claude --missing
//
// --missing only calls the provider for skills that have no triggers yet and
// keeps every other skill's phrases, so an interrupted run can be resumed.
//
// --keep-triggers makes no provider calls: it keeps the existing phrases,
// drops those of removed skills, and re-stamps registryDigest. Use it after
// edits that leave skill descriptions alone (scripts, examples, moves); the
// digest covers skill content, so any such edit marks the manifest stale.
// New or re-described skills still need a full run.
//
// Codex requires an isolated executable and a dedicated subscription login
// home (the same lease rules as the outcome evaluator: never the user's own
// Codex home). Claude authenticates through CLAUDE_CODE_OAUTH_TOKEN,
// ANTHROPIC_API_KEY, or the macOS Keychain login, with an isolated
// CLAUDE_CONFIG_DIR per call. Provider calls: ceil(skills / batch).

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadContextRegistry } = require('../lib/context-pack-registry');
const { createAuthLease, parseCodexJsonl, parseClaudeJson, providerFamily, readClaudeKeychainToken } = require('../../docker/context-profiles/ai-eval-lib');
const { digestObject, stableStringify } = require('../lib/context-profile-support');

const MANIFEST_PATH = 'manifests/context-packs/skill-triggers@1.json';
const MAX_TRIGGERS_PER_SKILL = 12;
const MAX_TRIGGER_CHARS = 80;
const DEFAULT_MODEL = { codex: 'gpt-5.6-sol', claude: 'claude-sonnet-5-5' };

function parseFlags(argv) {
  const flags = { batch: 25 };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') flags.dryRun = true;
    else if (arg === '--keep-triggers') flags.keepTriggers = true;
    else if (arg === '--missing') flags.missing = true;
    else if (['--auth-home', '--model', '--executable', '--batch', '--provider'].includes(arg)) {
      flags[arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = argv[index += 1];
    } else throw new Error(`Unknown flag: ${arg}`);
  }
  if (!/^[1-9][0-9]*$/.test(String(flags.batch)) || !Number.isSafeInteger(Number(flags.batch))) {
    throw new Error('--batch must be a positive integer');
  }
  flags.batch = Number(flags.batch);
  return flags;
}

function promptFor(batch) {
  const lines = batch.map(entry => ({ id: entry.id, name: entry.name, description: entry.description }));
  return `You generate retrieval triggers for a skills library. For EACH skill below, output a JSON object mapping its id to an array of ${MAX_TRIGGERS_PER_SKILL} short trigger phrases (each under ${MAX_TRIGGER_CHARS} characters): realistic task wordings, synonyms, and related technology names a developer would type when this skill applies. Ground every trigger ONLY in the skill description; never invent capabilities the description does not claim. Prefer concrete task phrasings over category words. Output ONE JSON object and nothing else.\n\n${JSON.stringify(lines, null, 1)}`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Provider returned no JSON object');
  return JSON.parse(trimmed.slice(start, end + 1));
}

function cleanTriggers(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.map(item => String(item).trim().toLowerCase()).filter(item => {
    if (!item || item.length > MAX_TRIGGER_CHARS || seen.has(item)) return false;
    if (!/^[a-z0-9][a-z0-9 +/#.:-]*$/.test(item)) return false;
    seen.add(item);
    return true;
  }).slice(0, MAX_TRIGGERS_PER_SKILL);
}

function keepTriggers(repoRoot, registry, entries) {
  const target = path.join(repoRoot, MANIFEST_PATH);
  const previous = JSON.parse(fs.readFileSync(target, 'utf8'));
  const known = new Set(entries.map(entry => entry.id));
  const triggers = {};
  const dropped = [];
  for (const [id, list] of Object.entries(previous.triggers || {})) {
    if (known.has(id)) triggers[id] = list;
    else dropped.push(id);
  }
  const manifest = { ...previous, registryDigest: registry.registryDigest,
    coverage: { skills: entries.length, withTriggers: Object.keys(triggers).length },
    triggers, triggersDigest: digestObject(triggers) };
  // Same layout as the checked-in file: sorted keys, two-space indent.
  fs.writeFileSync(target, `${JSON.stringify(JSON.parse(stableStringify(manifest)), null, 2)}\n`);
  console.log(`re-stamped ${MANIFEST_PATH}: ${manifest.coverage.withTriggers}/${manifest.coverage.skills} skills keep triggers`
    + (dropped.length ? `; dropped removed skills: ${dropped.join(', ')}` : ''));
}

/**
 * The reason `claude --print --output-format json` gives for a failed run, such as
 * an invalid token, without echoing credentials. Empty when there is none.
 */
function claudeFailureReason(stdout) {
  try {
    const result = JSON.parse(String(stdout).trim().split('\n').pop());
    if (result && result.is_error && typeof result.result === 'string') {
      return `: ${result.result.replace(/sk-ant-[\w-]+/g, '[redacted]').slice(0, 200)}`;
    }
  } catch { /* not JSON */ }
  return '';
}

/**
 * Refuse to write when nothing succeeded, and let each skill whose call failed keep
 * the phrases it already had instead of losing them.
 */
function keepPreviousOnFailure(triggers, failed, previous, newlyGenerated) {
  const generated = newlyGenerated === null ? Object.keys(triggers).length : newlyGenerated;
  if (!generated && failed.length) {
    throw new Error(`every provider call failed; ${MANIFEST_PATH} was left unchanged (first failure: ${failed[0]})`);
  }
  for (const id of failed) {
    if (Array.isArray(previous[id]) && previous[id].length) triggers[id] = previous[id];
  }
}

/** The phrases already recorded for the given skills, by id. */
function existingTriggers(entries, previous) {
  const kept = {};
  for (const entry of entries) {
    if ((previous[entry.id] || []).length) kept[entry.id] = previous[entry.id];
  }
  return kept;
}

function readPreviousTriggers(repoRoot) {
  const previousPath = path.join(repoRoot, MANIFEST_PATH);
  if (!fs.existsSync(previousPath)) return {};
  return JSON.parse(fs.readFileSync(previousPath, 'utf8')).triggers || {};
}

function main() {
  const flags = parseFlags(process.argv);
  const repoRoot = path.join(__dirname, '..', '..');
  const registry = loadContextRegistry({ repoRoot });
  const allEntries = registry.entries.filter(entry => entry.id.startsWith('skill:'));
  const previousTriggers = readPreviousTriggers(repoRoot);
  const entries = flags.missing && !flags.keepTriggers
    ? allEntries.filter(entry => !(previousTriggers[entry.id] || []).length)
    : allEntries;
  if (flags.keepTriggers) {
    keepTriggers(repoRoot, registry, allEntries);
    return;
  }
  const executable = flags.executable || (flags.provider === 'claude' ? 'claude' : `${process.env.HOME}/.yus-eval/codex/node_modules/.bin/codex`);
  const family = flags.provider || providerFamily(executable);
  const model = flags.model || DEFAULT_MODEL[family];
  if (flags.dryRun) {
    console.log(`would generate triggers for ${entries.length} skills via ${family} (${model}) in ${Math.ceil(entries.length / flags.batch)} provider calls`);
    return;
  }
  if (family === 'codex' && (!flags.authHome || !path.isAbsolute(flags.authHome))) throw new Error('--auth-home with an absolute dedicated login home is required for Codex');
  const lease = family === 'codex' ? createAuthLease(flags.authHome) : null;
  const claudeToken = () => process.env.CLAUDE_CODE_OAUTH_TOKEN || readClaudeKeychainToken();
  const triggers = flags.missing ? existingTriggers(allEntries, previousTriggers) : {};
  const failed = [];
  const callProvider = batch => {
    const home = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'yus-trigger-gen-'));
    try {
      if (family === 'codex') {
        let parsed = null;
        lease.run(home, () => {
          const env = { PATH: process.env.PATH, HOME: home, CODEX_HOME: home, LANG: 'C.UTF-8' };
          const result = require('node:child_process').spawnSync(executable,
            ['exec', '--json', '--ephemeral', '--skip-git-repo-check', '--sandbox', 'read-only',
              '--disable', 'apps', '--disable', 'remote_plugin', '-c', 'approval_policy="never"',
              '-c', 'model_reasoning_effort="low"', '--model', model, '-'],
            { input: promptFor(batch), cwd: home, env, encoding: 'utf8', shell: false,
              timeout: 240000, killSignal: 'SIGKILL', maxBuffer: 1024 * 1024 });
          if (result.status !== 0) throw new Error(`provider exited ${result.status}`);
          parsed = extractJson(parseCodexJsonl(result.stdout).text);
        });
        return parsed;
      }
      const env = { PATH: process.env.PATH, HOME: home, CLAUDE_CONFIG_DIR: home, LANG: 'C.UTF-8',
        DISABLE_NON_ESSENTIAL_MODEL_CALLS: '1', CLAUDE_CODE_OAUTH_TOKEN: claudeToken() };
      const result = require('node:child_process').spawnSync(executable,
        ['--print', '--output-format', 'json', '--tools', '', '--no-session-persistence', '--model', model],
        { input: promptFor(batch), cwd: home, env, encoding: 'utf8', shell: false,
          timeout: 240000, killSignal: 'SIGKILL', maxBuffer: 1024 * 1024 });
      if (result.status !== 0) throw new Error(`provider exited ${result.status}${claudeFailureReason(result.stdout)}`);
      return extractJson(parseClaudeJson(result.stdout).text);
    } finally { fs.rmSync(home, { recursive: true, force: true, maxRetries: 5 }); }
  };
  // Model-generated JSON degrades at batch scale: retry each batch once, then halve until singles.
  const processBatch = batch => {
    try {
      const parsed = callProvider(batch);
      let ok = 0;
      for (const entry of batch) {
        const cleaned = cleanTriggers(parsed[entry.id]);
        if (cleaned.length) { triggers[entry.id] = cleaned; ok += 1; }
      }
      if (!ok) throw new Error('provider returned no usable triggers');
    } catch (error) {
      if (batch.length === 1) { failed.push(batch[0].id); console.error(`skill ${batch[0].id}: ${error.message}`); return; }
      const half = Math.ceil(batch.length / 2);
      processBatch(batch.slice(0, half));
      processBatch(batch.slice(half));
    }
  };
  for (let index = 0; index < entries.length; index += flags.batch) {
    processBatch(entries.slice(index, index + flags.batch));
    console.log(`progress: ${Object.keys(triggers).length}/${allEntries.length} skills have triggers`);
  }
  keepPreviousOnFailure(triggers, failed, previousTriggers, flags.missing ? entries.length - failed.length : null);
  const manifest = { schemaVersion: 1, id: 'skill-triggers@1', registryDigest: registry.registryDigest,
    model: { id: model, ...(family === 'codex' ? { effort: 'low' } : {}),
      source: family === 'codex' ? 'codex-subscription-lease' : 'claude-subscription-login' },
    generatedAt: new Date().toISOString(),
    coverage: { skills: allEntries.length, withTriggers: Object.keys(triggers).length },
    triggers, triggersDigest: digestObject(triggers) };
  const target = path.join(repoRoot, MANIFEST_PATH);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  // Same layout as --keep-triggers and the checked-in file: sorted keys, two-space indent.
  fs.writeFileSync(target, `${JSON.stringify(JSON.parse(stableStringify(manifest)), null, 2)}\n`);
  console.log(`wrote ${MANIFEST_PATH}: ${manifest.coverage.withTriggers}/${manifest.coverage.skills} skills, ${Object.values(triggers).reduce((n, t) => n + t.length, 0)} triggers`);
  if (failed.length) { console.error(`skills with no usable triggers: ${failed.join(', ')}`); process.exitCode = 1; }
}

main();
