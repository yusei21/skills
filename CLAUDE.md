# Claude Code

Follow the shared instructions in `AGENTS.md`.

Use shared behavior directly from the canonical root directories:

- `skills/`
- `agents/`
- `commands/`
- `rules/`
- `hooks/`
- `scripts/`
- `mcp-configs/`

These directories are the source of truth. Do not duplicate shared implementations under `.claude/`.

Claude-specific loading and project integration belong in `.claude/`. Plugin and marketplace metadata belong in `.claude-plugin/`. Repository automation belongs in `.github/`.

Use `.skill-index/skills.json` for skill discovery and `.skill-index/project-profile.json` for project metadata. See `docs/ARCHITECTURE.md` for the complete repository layout and ownership rules.

## Automatic skill routing

Claude Code exposes three lightweight project skills through `.claude/skills/`:

- `project-orchestrator` inspects the repository and selects only the relevant canonical skills and agents;
- `skill-builder` searches for an existing capability before creating or extending a skill;
- `subagent-builder` searches existing agents before creating or registering a specialist subagent.

These entries point back to canonical implementations in `skills/`. Specialized skills remain in `skills/` and are loaded on demand to avoid exceeding the skills context budget. Users should not need to name each skill explicitly for substantial repository tasks.
