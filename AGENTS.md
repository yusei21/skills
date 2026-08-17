# Shared AI Resources

Use the shared repository resources directly from their canonical root locations:

- `skills/` — canonical skills
- `agents/` — canonical reusable agents
- `commands/` — canonical commands
- `rules/` — shared rules
- `hooks/` — shared event-driven automation
- `scripts/` — deterministic support tooling and generators
- `mcp-configs/` — shared MCP server configurations

Do not create duplicate copies inside tool-specific directories. Tool adapters such as `.claude/`, `.codex/`, `.agents/`, `.agy/`, `.mimocode/`, `.opencode/`, and `.kimi/` should expose, link to, or adapt canonical resources rather than redefine them.

Use `.skill-index/skills.json` for skill discovery and `.skill-index/project-profile.json` for repository profile metadata. Treat generated discovery data as derived state, not a second source of truth.

For repository ownership boundaries and the current layout, see `docs/ARCHITECTURE.md`.

Load only the files relevant to the current task.

## Criação automática de skills e subagentes

Para tarefas relevantes do repositório, use automaticamente a skill `project-orchestrator`.

Quando não existir uma skill adequada:

1. use `skill-scout` para procurar uma alternativa;
2. use `skill-builder` para criar ou ampliar a skill necessária;
3. valide com `skill-comply` quando aplicável;
4. verifique duplicações com `skill-stocktake`;
5. regenere `.skill-index/skills.json` quando uma skill canônica for adicionada ou alterada.

Quando a tarefa precisar de um especialista e não existir um agente adequado:

1. procure em `agents/`;
2. procure em `skills/*/agents/`;
3. verifique os agentes nativos em `.codex/config.toml` e `.codex/agents/`;
4. use `subagent-builder` para criar ou ampliar o agente necessário;
5. registre como agente nativo somente quando isso for realmente útil para a integração.

Não exija que o usuário informe o nome dessas skills. Não carregue todas as skills ou agentes ao mesmo tempo.
