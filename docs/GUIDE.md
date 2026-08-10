# Advanced Usage Guide

**English** | [Português](./GUIA.md) | [简体中文](./GUIDE.zh-CN.md)

This guide assumes the repository is already installed. See [`README.md`](../README.md) for installation and integration instructions.

The repository is designed around canonical reusable resources, automatic skill discovery, and selective loading. The goal is not to load the largest possible catalog into every session; it is to make the smallest useful set of capabilities easy to discover and reuse.

For the external ecosystem review and the criteria used to add or reject skills, see [`ECOSYSTEM.md`](./ECOSYSTEM.md).

## 1. Canonical architecture

Shared implementations live at the repository root:

| Resource | Canonical location | Purpose |
|---|---|---|
| Agents | `agents/` | Specialist role definitions for delegated work |
| Skills | `skills/` | Reusable workflows, procedures, and domain knowledge |
| Rules | `rules/` | Cross-cutting behavioral and coding constraints |
| Hooks | `hooks/` | Event-driven enforcement and automation |
| Commands | `commands/` | Fast entry points for repeatable workflows |
| MCP configs | `mcp-configs/` | Shared MCP server catalog |
| Scripts | `scripts/` | Deterministic support tooling and integrations |

Tool-specific directories such as `.claude/`, `.codex/`, `.agents/`, `.agy/`, `.mimocode/`, and `.opencode/` should contain integration files, native configuration, and links to canonical resources rather than independent copies.

## 2. Automatic skill discovery

`project-orchestrator` is the repository-level router for substantial tasks. It should:

1. inspect the current repository and task;
2. read `.skill-index/skills.json` as the discovery catalog;
3. select only the smallest useful group of skills;
4. load specialist agent prompts only when they add value;
5. avoid loading the entire catalog into context.

The canonical skill index is generated from `skills/*/SKILL.md` by:

```bash
node scripts/build-skill-index.js
```

The generated file is:

```text
.skill-index/skills.json
```

GitHub Actions keeps the index synchronized when canonical skill definitions or the index generator change. Pull requests that modify skills should leave the generated index clean.

Do not hand-maintain a second list of skills in tool-specific directories.

## 3. Choosing the right skill

Prefer intent matching over name matching. Before creating a new skill:

1. search `.skill-index/skills.json`;
2. compare the candidate against existing skills with similar outcomes;
3. extend an existing canonical skill when the intent substantially overlaps;
4. create a new skill only when it adds a distinct reusable workflow;
5. use `skill-scout`, `skill-builder`, `skill-stocktake`, and `skill-comply` when appropriate.

A useful skill should have a clear trigger, an actionable procedure, a verifiable outcome, and boundaries that distinguish it from neighboring skills.

## 4. Current high-value workflow skills

### Systematic debugging

Use `systematic-debugging` when the cause of a failure is unclear, intermittent, cross-layer, or has resisted previous fixes.

The workflow is evidence-first:

```text
reproduce
  ↓
collect evidence
  ↓
state a falsifiable hypothesis
  ↓
isolate the fault domain
  ↓
test the hypothesis
  ↓
fix the root cause
  ↓
verify the regression
```

Do not modify code merely because a change looks plausible. The skill requires a concrete hypothesis and a disproof test before treating a patch as a root-cause fix.

### Verification before completion

Use `verification-before-completion` before claiming that implementation, debugging, migration, refactoring, or automation work is finished.

Completion claims should be backed by current evidence such as:

- expected artifacts exist and contain the intended change;
- the requested behavior was exercised directly;
- focused tests pass;
- broader tests, static checks, or builds pass when relevant;
- remaining risks and unverified areas are stated explicitly.

This skill complements `verification-loop`: the loop defines broad project checks, while `verification-before-completion` governs what evidence is required before making a completion claim.

### Component composition patterns

Use `composition-patterns` when a UI component is accumulating interacting boolean props or needs flexible extension points.

Prefer:

- `children` and explicit slots for structure;
- controlled/uncontrolled state contracts;
- compound components when subparts belong to one conceptual API;
- narrow context boundaries;
- explicit extension points over prop explosions.

Use it alongside `react-patterns` and `react-performance` for React work rather than creating another broad React best-practices skill.

## 5. Common workflows

### Starting a new feature

```text
project-orchestrator
  ↓
intent / planning skill
  ↓
implementation + relevant framework skills
  ↓
tests
  ↓
code/security review when needed
  ↓
verification-before-completion
```

For larger work, use the `orch-*` family or other orchestration skills already present in the catalog instead of inventing an independent pipeline.

### Fixing a bug

```text
systematic-debugging
  ↓
reproduce the failure
  ↓
add a regression test when practical
  ↓
implement the root-cause fix
  ↓
run focused and broader checks
  ↓
verification-before-completion
```

### Preparing for production

Combine only what the project needs, for example:

```text
security-review / security-scan
production-audit
E2E or framework-specific verification
canary-watch when deployment verification is required
verification-before-completion
```

## 6. Combining agents and skills

Agents are role definitions; skills are reusable capabilities. Keep those concerns separate.

A reviewer agent may load security or framework-review skills. A developer agent may load implementation, testing, and verification skills. Do not copy the same domain knowledge into every agent prompt.

For multi-agent execution, prefer explicit ownership, artifacts, verification gates, and bounded handoffs over open-ended agent conversations.

## 7. Context and cost discipline

- Load only the skills required for the current task.
- Prefer index metadata before opening full `SKILL.md` files.
- Use project-specific rules only for technologies actually present.
- Keep unrelated MCP servers disabled to reduce context and attack surface.
- Compact context at logical phase boundaries, not during active debugging or implementation.
- Reuse project profiles and durable memory where available rather than rediscovering stable facts every turn.

## 8. Adding content from external repositories

Before importing or adapting an external capability:

1. inspect the local catalog first;
2. compare intent rather than names;
3. inspect the source repository's current license;
4. review scripts, hooks, dependencies, MCP configuration, and data-access behavior;
5. prefer an original implementation when licensing is absent or uncertain;
6. preserve required attribution when copyrighted material is actually copied or adapted;
7. update the appropriate NOTICE files when required;
8. regenerate the skill index after adding canonical skills.

The research methodology and reviewed ecosystems are documented in [`ECOSYSTEM.md`](./ECOSYSTEM.md).

## 9. Documentation language policy

User-facing repository documentation must remain available in three languages:

1. English — canonical source;
2. Portuguese (`pt-BR`);
3. Simplified Chinese (`zh-CN`).

When a user-facing document changes materially, update the three language variants in the same change set. Keep code identifiers, command names, file paths, API names, and configuration keys in English unless localization is required by the underlying tool.

Use language links near the top of equivalent documents so readers can switch directly between versions.

## 10. Maintaining the catalog

Periodically review the catalog for:

- duplicate or near-duplicate intents;
- stale framework/version guidance;
- truncated or weak frontmatter descriptions;
- skills that require unsafe or unnecessary permissions;
- skills whose workflows are no longer actionable;
- external references whose licensing or maintenance status changed.

Popularity is a discovery signal, not an automatic import criterion. A smaller, well-routed catalog is more useful than a larger catalog filled with overlapping prompts.
