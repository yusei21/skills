---
name: project-orchestrator
description: Automatically inspect the current repository, identify its technologies, instruction hierarchy, and task type, select relevant canonical skills from skills/, and load specialized agent prompts from agents/ when useful. Use this automatically for every substantial repository task.
---

# Project Orchestrator

Act as the automatic router for this repository.

## Mandatory behavior

At the beginning of every substantial task:

1. Inspect the repository before proposing or changing code.
2. Determine the languages, frameworks, build systems, testing tools, deployment environment, and project conventions.
3. Read the root `AGENTS.md` and any closer scoped `AGENTS.md` files.
4. Identify runtime-specific instruction entry points that apply to the task, such as `CLAUDE.md`, `.claude/`, `.codex/`, `.agy/`, `.mimocode/`, `.opencode/`, `.kimi/`, or legacy `.gemini/` content.
5. Consult `.skill-index/skills.json` to discover relevant canonical skills.
6. Select only the smallest useful set of skills for the current task.
7. Read the selected skills from `skills/<skill-name>/SKILL.md`.
8. When specialist review is useful, read the relevant prompt from `agents/<agent-name>.md`.
9. Follow selected skills and agent prompts without requiring the user to name them.
10. Do not load every skill or agent into context.
11. Explain briefly which skills and agents were selected.

## Initial repository inspection

Prefer lightweight inspection first:

- repository root files;
- directory structure up to depth 2;
- package and dependency manifests;
- build configuration;
- test configuration;
- CI configuration;
- README and project instructions;
- current Git status and diff.

Do not recursively read the entire repository unless the task requires it.

## Skill selection

Use `.skill-index/skills.json` as the discovery catalog.

Select skills according to:

- language and framework;
- task type;
- files being changed;
- requested outcome;
- security, testing, performance, documentation, and deployment implications.

Open the full `SKILL.md` only for selected skills.

Typical mappings:

- implementation work: coding standards, language patterns, testing, verification;
- bug fixing: repo scan, error handling, testing, verification loop;
- security work: security review, security scan, framework security;
- instruction, agent, adapter, plugin, or marketplace changes: `skill-security-audit` plus the relevant builder or integration skill;
- frontend work: frontend patterns, accessibility, framework patterns, browser QA;
- backend work: backend patterns, API design, database patterns;
- refactoring: architecture, coding standards, tests, verification;
- research: search first, documentation lookup, deep research;
- deployment: deployment patterns, Docker or Kubernetes patterns.

## Instruction integrity

Instruction files are part of the repository control plane. Changes to them require a consistency pass, not just prose review.

When the task changes `AGENTS.md`, `CLAUDE.md`, an adapter directory, agent prompts, skills, hooks, plugin metadata, or other files that influence model/tool behavior:

1. Establish the effective instruction order for the affected runtime, including root and closer-scoped files.
2. Separate shared policy from runtime-specific behavior. Shared rules belong in canonical resources; native syntax and loading behavior belong in adapters.
3. Compare sibling integrations for accidental drift, stale references, contradictory requirements, duplicated canonical behavior, or tool-specific instructions leaking into shared policy.
4. Use `skill-security-audit` to inspect prompt-injection risk, permission expansion, hidden persistence, unsafe tool configuration, and externally sourced instructions.
5. Do not propagate a Claude-, Codex-, Gemini-, OpenCode-, or other runtime-specific directive to every adapter unless its semantics are actually portable.
6. When adapting ideas from an external plugin or skill ecosystem, preserve licensing and provenance requirements. Prefer re-implementing the pattern in the repository's canonical architecture over copying tool-specific content.
7. Record any intentional divergence between runtimes in the relevant documentation or adapter comments.

See `docs/REVIEW-INTEGRITY.md` for the repository-wide review and instruction-integrity policy.

## Agent selection

Agent prompts in `agents/` are canonical role definitions, not native Codex roles.

Read them automatically when their expertise is useful. Examples:

- `agents/security-reviewer.md`
- `agents/code-reviewer.md`
- `agents/architect.md`
- `agents/planner.md`
- `agents/test-runner.md`
- `agents/docs-lookup.md`

Use no more specialist prompts than necessary.

## Context discipline

Never load all canonical skills.

Prefer:

1. index metadata;
2. project inspection;
3. two to six relevant skills;
4. one or two specialist agent prompts;
5. deeper repository reading only where required.

## First-run project profile

When `.skill-index/project-profile.json` does not exist, create it after inspecting the project.

The profile should contain:

- detected languages;
- frameworks;
- package managers;
- build tools;
- test tools;
- deployment tools;
- important directories;
- recommended default skills;
- timestamp and current Git commit.

Reuse the profile on later tasks, but refresh it when dependency manifests, build files, or the Git commit change materially.
