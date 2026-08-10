# skills (test)

**English** | [Português](./README.pt-BR.md) | [简体中文](./README.zh-CN.md)

A shared collection of skills, agents, commands, rules, hooks, scripts, and MCP
configurations for multiple AI coding tools.

The repository uses canonical sources at the root:

- `skills/` for reusable workflows and domain knowledge;
- `agents/` for reusable agent role definitions;
- `commands/`, `rules/`, `hooks/`, `scripts/`, and `mcp-configs/` for shared support resources.

Tool-specific directories such as `.claude/`, `.codex/`, `.agents/`, `.agy/`,
`.mimocode/`, and `.opencode/` should contain only integration files, native
configuration, and links to canonical resources. They should not contain
independent physical copies of shared skills or agents.

This repository originated from the open source project
[Everything Claude Code](https://github.com/affaan-m/everything-claude-code)
(MIT license) and may incorporate content from other sources over time. See
[`NOTICE.en.md`](./NOTICE.en.md) for credits and adaptation notes.

For advanced usage, orchestration, and context-budget guidance, see
[`docs/GUIDE.md`](./docs/GUIDE.md).

## Automatic routing

Three project-level skills coordinate discovery and creation:

- `project-orchestrator` inspects the repository and selects only the skills and
  specialist prompts needed for the current task;
- `skill-builder` searches for an existing capability before creating,
  extending, validating, and registering a skill;
- `subagent-builder` searches existing roles before creating or registering a
  specialist subagent.

Specialized skills remain in `skills/` and are loaded on demand. This avoids
registering the entire catalog in every tool and exceeding context budgets.

## Supported integrations

The repository includes integration surfaces for:

- Claude Code: `.claude/` and `CLAUDE.md`;
- OpenAI Codex CLI: `.codex/` and `.agents/skills/`;
- Antigravity CLI: `.agy/`;
- MiMo Code: `.mimocode/`;
- OpenCode: `.opencode/`;
- Kimi: `.kimi/`.

Legacy `.gemini/` content is retained for compatibility and migration history,
but the active Antigravity integration is documented under `.agy/`.

## Installation

Clone the repository and start the tool from the repository root so it can load
project-local instructions and links:

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

For Claude Code plugin installation, when supported by the current Claude Code
version and this repository's plugin metadata:

```text
/plugin marketplace add git@github.com:yusei21/skills.git
/plugin install skills@skills
```

Do not copy all skills into a global tool directory by default. Use the
project-local routing skills or install only the specific resources needed for
another repository.

## MCP servers

The shared catalog is in
[`mcp-configs/mcp-servers.json`](./mcp-configs/mcp-servers.json). Credentials
must remain in environment variables or user-level configuration, never in the
repository. Enable only the servers needed for a task to preserve context and
reduce attack surface.

## Structure

```text
skills/
├── skills/          # canonical skills
├── agents/          # canonical agent prompts
├── commands/        # shared commands
├── rules/           # shared rules
├── hooks/           # event-driven automations
├── scripts/         # supporting scripts and runtimes
├── mcp-configs/     # shared MCP catalog
├── .agents/         # Codex/native skill discovery links
├── .claude/         # Claude-specific integration
├── .codex/          # Codex-specific configuration and native roles
├── .agy/            # Antigravity-specific integration
├── .mimocode/       # MiMo Code-specific integration
├── .opencode/       # OpenCode plugin and integration
├── .kimi/           # Kimi-specific integration
├── .gemini/         # legacy compatibility content
├── docs/            # guides and supporting documentation
├── AGENTS.md        # shared automatic routing instructions
├── CLAUDE.md        # Claude-specific entry point
├── NOTICE.md        # Portuguese source and license notices
├── NOTICE.en.md     # English source and license notices
└── NOTICE.zh-CN.md  # Simplified Chinese source and license notices
```

## Contributing

Keep shared implementations in the canonical root directories. Integration
folders should reference those resources rather than duplicate them. New skills
should be searched, validated, and inventoried before being added.

## License

MIT — see [`LICENSE`](./LICENSE) and [`NOTICE.en.md`](./NOTICE.en.md).
