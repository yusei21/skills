# Antigravity

Antigravity-specific configuration belongs here.

Use the shared resources from `../skills/`, `../agents/`, `../commands/`,
`../rules/`, and `../mcp-configs/`.

## Registered project skills

The Antigravity integration exposes three routing skills through `.agy/skills/`:

- `project-orchestrator`
- `skill-builder`
- `subagent-builder`

Each entry points to the canonical implementation in `../skills/`. The orchestrator inspects the project and loads specialized skills or agent prompts only when they are relevant.
