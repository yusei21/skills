# Claude Code

Claude-specific files belong here.

Shared skills, agents, commands, rules, and MCP configurations remain in the repository root.
See `../CLAUDE.md` and `../AGENTS.md`.

## Registered project skills

This integration exposes three lightweight routing skills through `.claude/skills/`:

- `project-orchestrator`
- `skill-builder`
- `subagent-builder`

They point to the canonical implementations in `../skills/`. Specialized skills are discovered and loaded on demand instead of being duplicated or registered all at once.
