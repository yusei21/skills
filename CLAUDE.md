# Claude Code

Follow the shared instructions in `AGENTS.md`.

Use resources directly from:

- `skills/`
- `agents/`
- `commands/`
- `rules/`
- `mcp-configs/`

These directories are the canonical sources. Do not duplicate them under `.claude/`.

## Automatic skill routing

Claude Code exposes three project skills through `.claude/skills/`:

- `project-orchestrator` inspects the repository and selects only the relevant canonical skills and agents.
- `skill-builder` searches for an existing capability before creating or extending a skill.
- `subagent-builder` searches existing agents before creating or registering a specialist subagent.

Specialized skills remain in `skills/` and are loaded on demand to avoid exceeding the skills context budget. Users should not need to name each skill explicitly for substantial repository tasks.
