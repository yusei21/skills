# Shared AI Resources

Use the shared repository resources directly:

- `skills/` — canonical skills
- `agents/` — canonical agents
- `commands/` — canonical commands
- `rules/` — shared rules
- `mcp-configs/` — shared MCP server configurations

Do not create duplicate copies inside tool-specific directories.
Load only the files relevant to the current task.

## Criação automática de skills e subagentes

Para tarefas relevantes do repositório, use automaticamente a skill
`project-orchestrator`.

Quando não existir uma skill adequada:

1. use `skill-scout` para procurar uma alternativa;
2. use `skill-builder` para criar ou ampliar a skill necessária;
3. valide com `skill-comply` quando aplicável;
4. verifique duplicações com `skill-stocktake`.

Quando a tarefa precisar de um especialista e não existir um agente adequado:

1. procure em `agents/`;
2. procure em `skills/*/agents/`;
3. verifique os agentes nativos em `.codex/config.toml`;
4. use `subagent-builder` para criar ou ampliar o agente necessário;
5. registre como agente nativo somente quando isso for realmente útil.

Não exija que o usuário informe o nome dessas skills.
Não carregue todas as skills ou agentes ao mesmo tempo.
