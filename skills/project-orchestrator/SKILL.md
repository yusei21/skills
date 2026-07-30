---
name: project-orchestrator
description: Automatically inspect the current repository, identify its technologies and task type, select relevant canonical skills from skills/, and load specialized agent prompts from agents/ when useful. Use this automatically for every substantial repository task.
---

# Project Orchestrator

Act as the automatic router for this repository.

## Mandatory behavior

At the beginning of every substantial task:

1. Inspect the repository before proposing or changing code.
2. Determine the languages, frameworks, build systems, testing tools, deployment environment, and project conventions.
3. Read the root `AGENTS.md` and any closer scoped `AGENTS.md` files.
4. Consult `.skill-index/skills.json` to discover relevant canonical skills.
5. Select only the smallest useful set of skills for the current task.
6. Read the selected skills from `skills/<skill-name>/SKILL.md`.
7. When specialist review is useful, read the relevant prompt from `agents/<agent-name>.md`.
8. Follow selected skills and agent prompts without requiring the user to name them.
9. Do not load every skill or agent into context.
10. Explain briefly which skills and agents were selected.

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
- frontend work: frontend patterns, accessibility, framework patterns, browser QA;
- backend work: backend patterns, API design, database patterns;
- refactoring: architecture, coding standards, tests, verification;
- research: search first, documentation lookup, deep research;
- deployment: deployment patterns, Docker or Kubernetes patterns.

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
