# Skills

**English** | [Português](./README.pt-BR.md) | [简体中文](./README.zh-CN.md)

A maintained and expanded collection of skills, agents, commands, rules, hooks, scripts, and MCP configurations for multiple AI coding tools.

The repository follows a canonical-source architecture: shared behavior lives once at the root, generated metadata supports discovery, and tool-specific directories act as adapters rather than independent copies.

For a complete description of the current layout, ownership rules, data flow, symlink policy, and structural validation, see [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Architecture at a glance

The repository is split into four layers:

1. **Canonical resources** — `skills/`, `agents/`, `commands/`, `rules/`, `hooks/`, `scripts/`, and `mcp-configs/`.
2. **Discovery metadata** — `.skill-index/skills.json` and `.skill-index/project-profile.json`.
3. **Tool adapters** — `.claude/`, `.codex/`, `.agents/`, `.agy/`, `.mimocode/`, `.opencode/`, `.kimi/`, plus legacy `.gemini/` compatibility content.
4. **Packaging and automation** — `.claude-plugin/`, `.github/`, `docs/`, and the repository-level instruction files.

Tool-specific directories should contain integration files, native configuration, links, or generated representations. They should not become independent physical copies of shared skills or agents.

## Automatic routing

Three lightweight project skills coordinate discovery and creation:

- `project-orchestrator` inspects the repository and selects only the skills and specialist prompts needed for the current task;
- `skill-builder` searches for an existing capability before creating, extending, validating, and registering a skill;
- `subagent-builder` searches existing roles before creating or registering a specialist subagent.

Specialized skills remain in `skills/` and are loaded on demand instead of being registered everywhere.

The canonical skill index is generated from `skills/*/SKILL.md` with:

```bash
node scripts/build-skill-index.js
```

Discovery data lives in `.skill-index/`:

- `skills.json` — generated skill catalog;
- `project-profile.json` — repository profile used to describe detected languages, frameworks, tooling, important directories, and recommended defaults.

Do not maintain a second manual catalog in tool-specific directories.

## Supported integrations

The repository currently includes integration surfaces for:

- Claude Code: `.claude/`, `CLAUDE.md`, and plugin metadata in `.claude-plugin/`;
- OpenAI Codex CLI: `.codex/` and `.agents/skills/`;
- Antigravity CLI: `.agy/`;
- MiMo Code: `.mimocode/`;
- OpenCode: `.opencode/`;
- Kimi: `.kimi/`.

Legacy `.gemini/` content is retained for compatibility and migration history, but the active Antigravity integration is under `.agy/`.

## Installation

Clone the repository and start the tool from the repository root so it can load project-local instructions and links:

```bash
git clone git@github.com:yusei21/skills.git
cd skills
```

Examples:

```bash
claude
codex
agy
opencode
```

For Claude Code plugin installation, when supported by the current Claude Code version and this repository's plugin metadata:

```text
/plugin marketplace add git@github.com:yusei21/skills.git
/plugin install skills@skills
```

Do not copy every skill into a global tool directory by default. Prefer project-local routing or install only the specific resources needed elsewhere.

## MCP servers

The shared catalog is in [`mcp-configs/mcp-servers.json`](./mcp-configs/mcp-servers.json). Credentials must remain in environment variables or user-level configuration, never in the repository. Enable only the servers needed for a task to preserve context and reduce attack surface.

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — repository structure, ownership boundaries, data flow, and adapter policy;
- [`docs/GUIDE.md`](./docs/GUIDE.md) — advanced usage, orchestration, skill routing, contribution guidance, and context discipline;
- [`docs/ECOSYSTEM.md`](./docs/ECOSYSTEM.md) — external skill-ecosystem review, selection criteria, deduplication decisions, and implementation notes.

User-facing documentation is maintained in English, Portuguese (`pt-BR`), and Simplified Chinese (`zh-CN`). Material documentation changes should update all three variants in the same change set.

## Structure

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

## Contributing

Keep shared implementations in the canonical root directories. Integration folders should reference those resources rather than duplicate them.

Before adding a new skill:

1. search the current index and compare intent with existing skills;
2. prefer extending an existing canonical skill over adding a near-duplicate;
3. validate frontmatter, workflow boundaries, safety, dependencies, and licensing;
4. regenerate the skill index;
5. add tool-specific exposure only when required by the integration;
6. update English, Portuguese, and Simplified Chinese documentation when the change is material.

For structural changes, follow the ownership and validation checklist in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Attribution and license

This project incorporates and adapts open-source work from multiple sources. Attribution, licensing, and adaptation details are maintained in [`NOTICE.en.md`](./NOTICE.en.md).

MIT — see [`LICENSE`](./LICENSE) and [`NOTICE.en.md`](./NOTICE.en.md).
