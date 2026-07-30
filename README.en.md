# skills

*[Leia em português](./README.md)*

Personal collection of agents, skills, rules and hooks for use with Claude Code.

This repository originated from the open source project
[Everything Claude Code](https://github.com/affaan-m/everything-claude-code)
(MIT license) and may incorporate content from other sources over time.
See [`NOTICE.en.md`](./NOTICE.en.md) for full credits and what was kept,
adapted, or removed compared to the original.

To get the most out of what's in here (when to use each agent, how to
combine skills, token/cost tips), see the
[advanced usage guide](./docs/GUIDE.md).

## Requirements

- Claude Code CLI installed (version 2.1.0 or later)
```bash
claude --version
```

## Installation

### Option A — Install as a plugin (recommended)

```bash
/plugin marketplace add git@github.com:yusei21/skills.git
/plugin install skills@skills
```

> Adjust `skills@skills` according to the identifier defined in this
> repository's `.claude-plugin/plugin.json`, if different.

### Option B — Manual installation

```bash
git clone git@github.com:yusei21/skills.git
cd skills

# Agents
cp agents/*.md ~/.claude/agents/

# Skills (primary workflow surface)
mkdir -p ~/.claude/skills/my-repo
cp -r skills/* ~/.claude/skills/my-repo/

# Rules (common + your stack)
mkdir -p ~/.claude/rules/my-repo
cp -r rules/common ~/.claude/rules/my-repo/
cp -r rules/typescript ~/.claude/rules/my-repo/   # swap for your stack
```

### Hooks

Don't copy `hooks/hooks.json` directly into `~/.claude/settings.json`.
Copy each hook's content manually, adjusting script paths, or use the
repository's installer if one exists.

### MCP servers

The full catalog lives in [`mcp-configs/mcp-servers.json`](./mcp-configs/mcp-servers.json).
Nothing is enabled by default — copy the servers you want into your
`~/.claude.json` `mcpServers` section and replace the `YOUR_*_HERE`
placeholders with real keys. A good starting pair is **GitHub** and
**Context7**. Keep under ~10 enabled to preserve the context window.

### Antigravity CLI (`agy`) support

The `.gemini/` folder targets **Antigravity CLI (`agy`)**, Google's
successor to the discontinued Gemini CLI (individual accounts were cut off
on 2026-06-18). `agy` still reads from `~/.gemini/`, but with a new layout:

- General config / instructions: [`.gemini/antigravity-cli/`](./.gemini/antigravity-cli/)
- Centralized MCP config: [`.gemini/config/mcp_config.json`](./.gemini/config/mcp_config.json)
  (replaces the old `~/.gemini/settings.json`)

Migrate legacy Gemini CLI plugins with `agy plugin import gemini`.

### Verify installation

```bash
/plugin list skills@skills
```

## Structure

```
skills/
├── agents/       # specialized subagents (planner, reviewer, etc.)
├── skills/       # workflows and domain knowledge
├── rules/        # always-follow rules (common + per language)
├── hooks/        # event-triggered automations
├── scripts/      # supporting installer/runtime scripts
├── commands/     # compatibility /slash commands
├── mcp-configs/  # shared MCP server catalog (not enabled by default)
├── .codex/       # Codex CLI target
├── .opencode/    # OpenCode target
├── .gemini/      # Antigravity CLI (agy) target
├── docs/         # advanced usage guide
├── NOTICE.md / NOTICE.en.md  # source notices, licenses, and adaptations
└── README.md / README.en.md  # this file
```

## License

MIT — see [`LICENSE`](./LICENSE) and [`NOTICE.en.md`](./NOTICE.en.md).
