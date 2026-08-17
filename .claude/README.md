# Claude Code

Claude-specific integration files belong here. Shared skills, agents, commands, rules, hooks, scripts, and MCP configurations remain in the repository root as canonical resources.

See `../CLAUDE.md`, `../AGENTS.md`, and `../docs/ARCHITECTURE.md` for repository-wide behavior and ownership rules. Claude plugin and marketplace metadata is maintained separately in `../.claude-plugin/`.

## Registered project skills

This integration exposes three lightweight routing skills through `.claude/skills/`:

- `project-orchestrator`
- `skill-builder`
- `subagent-builder`

They point to the canonical implementations in `../skills/`. Specialized skills are discovered through `../.skill-index/skills.json` and loaded on demand instead of being duplicated or registered all at once.
