# MiMo Code

MiMo Code-specific configuration belongs here.

Use the shared resources from `../skills/`, `../agents/`, `../commands/`,
`../rules/`, and `../mcp-configs/`.

## Registered project skills

The MiMo Code integration exposes three routing skills through `.mimocode/skills/`:

- `project-orchestrator`
- `skill-builder`
- `subagent-builder`

Each entry points to the canonical implementation in `../skills/`. Specialized skills and agent prompts remain centralized and are loaded only when needed.
