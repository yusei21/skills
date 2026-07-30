---
name: subagent-builder
description: Cria, amplia, valida e registra subagentes especializados. Use automaticamente quando uma tarefa precisar de delegação ou revisão especializada e nenhum agente existente for adequado.
metadata:
  origin: local
---

# Criador de Subagentes

## Objetivo

Criar subagentes focados, reutilizáveis e sem duplicar papéis existentes.

## Quando usar

- Quando a tarefa precisar de um especialista.
- Quando for útil delegar trabalho independente.
- Quando nenhum agente existente cobrir adequadamente a responsabilidade.

## Fluxo

1. Procurar agentes em `agents/`.
2. Procurar subagentes em `skills/*/agents/`.
3. Verificar agentes nativos registrados em `.codex/config.toml`.
4. Reutilizar ou ampliar um agente existente quando possível.
5. Criar um novo agente somente quando não houver alternativa adequada.
6. Criar o prompt canônico em `agents/<nome>.md`.
7. Criar `.codex/agents/<nome>.toml` somente quando o registro nativo for útil.
8. Registrar em `.codex/config.toml` somente agentes frequentes e bem definidos.
9. Validar responsabilidade, entradas, saídas, limites e critérios de conclusão.
10. Informar todos os arquivos criados ou alterados.

## Estrutura recomendada

```text
agents/<nome-do-agente>.md
```

## Regras

- Um agente deve ter uma responsabilidade principal.
- Usar nomes em kebab-case para arquivos Markdown.
- Usar snake_case para chaves nativas do Codex.
- Não criar agentes vagos como helper, worker ou assistant.
- Não inserir tokens, senhas ou segredos.
- Não registrar todos os agentes como nativos.
