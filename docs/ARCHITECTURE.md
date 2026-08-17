# Repository Architecture

**English** | [Português](./ARQUITETURA.md) | [简体中文](./ARCHITECTURE.zh-CN.md)

This document describes the current repository layout and the boundary between canonical resources, generated discovery data, tool-specific adapters, and automation.

The central rule is simple: shared behavior has one canonical implementation. Tool integrations should expose or reference that implementation instead of maintaining independent copies.

## Architecture layers

The repository is organized into four layers.

### 1. Canonical resources

These directories contain the reusable source material shared across integrations:

| Path | Responsibility |
|---|---|
| `skills/` | Reusable workflows, procedures, and domain knowledge. Each canonical skill is defined by its own `SKILL.md`. |
| `agents/` | Reusable specialist agent role definitions. |
| `commands/` | Shared command entry points for repeatable workflows. |
| `rules/` | Cross-cutting behavioral and coding constraints. |
| `hooks/` | Event-driven automation and enforcement. |
| `scripts/` | Deterministic support tooling, generators, installers, and runtimes. |
| `mcp-configs/` | Shared MCP server catalog and related configuration. |

Changes that affect shared behavior should normally happen here first.

### 2. Discovery and generated metadata

`.skill-index/` contains repository-level discovery data used to avoid loading the entire skill catalog into context.

Current files include:

- `.skill-index/skills.json` — generated catalog built from `skills/*/SKILL.md`;
- `.skill-index/project-profile.json` — project profile describing detected languages, frameworks, tooling, important directories, and recommended default skills.

The canonical index is generated with:

```bash
node scripts/build-skill-index.js
```

`.skill-index/skills.json` is generated data and should not become a second manually curated catalog.

### 3. Tool adapters and native configuration

Tool-specific directories are integration surfaces, not alternate sources of truth:

| Path | Role |
|---|---|
| `.agents/` | Native/Codex-compatible skill discovery links. |
| `.claude/` | Claude Code project integration and lightweight routing skill links. |
| `.codex/` | Codex configuration and native agent definitions. |
| `.agy/` | Antigravity integration. |
| `.mimocode/` | MiMo Code integration. |
| `.opencode/` | OpenCode plugin and integration files. |
| `.kimi/` | Kimi integration. |
| `.gemini/` | Legacy compatibility and migration-history content. |

Where a tool supports links or references, adapters should point back to canonical resources. They should not contain independent physical copies of the same shared skill or agent.

The lightweight project-routing skills currently exposed by several integrations are:

- `project-orchestrator`;
- `skill-builder`;
- `subagent-builder`.

Specialized skills remain in `skills/` and are discovered and loaded on demand.

### 4. Packaging, automation, and documentation

The remaining top-level support surfaces are:

| Path | Role |
|---|---|
| `.claude-plugin/` | Claude Code plugin and marketplace metadata. |
| `.github/` | Repository automation, including the skill-index synchronization workflow. |
| `docs/` | Multilingual guides, architecture documentation, and ecosystem research. |
| `AGENTS.md` | Shared automatic-routing instructions for compatible agents/tools. |
| `CLAUDE.md` | Claude-specific entry point layered on top of `AGENTS.md`. |
| `NOTICE*.md` | Attribution, licensing, and adaptation notices. |

## Data flow

The intended flow is:

```text
skills/*/SKILL.md and other canonical resources
                  │
                  ├── scripts/build-skill-index.js
                  │           │
                  │           └── .skill-index/skills.json
                  │
                  ├── project-orchestrator / builders
                  │           │
                  │           └── selective skill and agent loading
                  │
                  └── tool adapters
                              │
                              ├── .claude/
                              ├── .agents/
                              ├── .agy/
                              ├── .mimocode/
                              ├── .opencode/
                              └── other native integrations
```

The adapters expose access; the canonical directories define behavior.

## Ownership rules

Use these rules when deciding where a change belongs:

1. If the behavior should be shared by multiple tools, change the canonical root resource.
2. If the change is specific to one tool's native configuration or loading mechanism, change that tool's adapter directory.
3. If the change affects skill discovery, update the canonical skill and regenerate `.skill-index/skills.json` rather than editing the generated index manually.
4. If the change affects plugin packaging or marketplace metadata, update `.claude-plugin/`.
5. If the change affects repository automation, update `.github/` and the relevant deterministic script together when applicable.
6. If the change is user-facing and material, update English, Portuguese, and Simplified Chinese documentation in the same change set.

## Adding a skill

A new reusable skill belongs under:

```text
skills/<skill-name>/SKILL.md
```

Before adding it:

1. search `.skill-index/skills.json` for overlapping intent;
2. prefer extending an existing skill when the workflow substantially overlaps;
3. validate frontmatter, boundaries, safety, dependencies, and licensing;
4. regenerate the skill index;
5. add tool-specific exposure only when the integration actually requires it.

Do not register every specialized skill in every adapter. The repository is intentionally designed around selective discovery.

## Adding or changing an agent

Reusable role definitions belong in `agents/` or, when intentionally scoped to a skill, under that skill's own agent resources. Native tool-specific agent configuration belongs in the corresponding adapter, such as `.codex/agents/`.

Keep reusable domain knowledge in skills rather than copying it into every agent prompt.

## Symlink and duplication policy

Several integration directories use links to canonical routing skills. This is deliberate: links preserve a single implementation while satisfying native discovery conventions.

When adding another integration, prefer this order:

1. direct reference to the canonical resource;
2. symlink or lightweight adapter;
3. generated representation when the tool requires a different format;
4. physical duplication only when the target tool makes every other option impossible, with an explicit synchronization strategy.

## Validation checklist

For structural changes, verify that:

- canonical resources remain under the root shared directories;
- adapters do not introduce silent duplicate sources of truth;
- routing links resolve correctly;
- `node scripts/build-skill-index.js` completes successfully when skills changed;
- `.skill-index/skills.json` matches the canonical skill tree;
- documentation structure examples match the actual repository tree;
- all three user-facing documentation languages are updated for material changes.

## Current top-level structure

```text
skills/
├── skills/              # canonical skills
├── agents/              # canonical reusable agents
├── commands/            # shared commands
├── rules/               # shared rules
├── hooks/               # event-driven automation
├── scripts/             # generators, installers, and support runtimes
├── mcp-configs/         # shared MCP catalog
├── .skill-index/        # generated discovery data + project profile
├── .agents/             # native/Codex-compatible skill links
├── .claude/             # Claude Code adapter
├── .claude-plugin/      # Claude plugin/marketplace metadata
├── .codex/              # Codex native configuration and agents
├── .agy/                # Antigravity adapter
├── .mimocode/           # MiMo Code adapter
├── .opencode/           # OpenCode plugin/integration
├── .kimi/               # Kimi adapter
├── .gemini/             # legacy compatibility content
├── .github/             # CI and repository automation
├── docs/                # multilingual project documentation
├── AGENTS.md            # shared routing instructions
├── CLAUDE.md            # Claude-specific entry point
├── README*.md           # multilingual project overview
├── NOTICE*.md           # attribution and licensing notices
└── LICENSE
```
