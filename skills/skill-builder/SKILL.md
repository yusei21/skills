---
name: skill-builder
description: Cria, amplia, corrige, valida e registra skills do repositório. Use automaticamente quando não existir uma skill adequada para o fluxo solicitado.
metadata:
  origin: local
---

# Criador de Skills

## Objetivo

Criar skills reutilizáveis sem duplicar capacidades existentes.

## Quando usar

- Quando o usuário pedir uma nova skill.
- Quando nenhuma skill existente cobrir adequadamente a tarefa.
- Quando uma skill precisar ser ampliada ou corrigida.

## Fluxo

1. Ler `skills/skill-scout/SKILL.md`.
2. Procurar skills existentes em `skills/`.
3. Reutilizar ou ampliar uma skill existente quando possível.
4. Criar uma nova skill somente quando não houver alternativa adequada.
5. Criar a implementação canônica em `skills/<nome>/`.
6. Validar nome, frontmatter, descrição, referências e scripts.
7. Consultar `skills/skill-comply/SKILL.md` quando aplicável.
8. Consultar `skills/skill-stocktake/SKILL.md` para verificar duplicações.
9. Registrar por link simbólico apenas quando a descoberta automática for útil.
10. Informar todos os arquivos criados ou alterados.

## Estrutura mínima

```text
skills/<nome-da-skill>/
└── SKILL.md
```

## Regras

- Usar nomes em kebab-case.
- Não criar diretórios vazios.
- Não duplicar arquivos em pastas específicas de ferramentas.
- Não inserir tokens, senhas ou segredos.
- Não instalar dependências silenciosamente.
- Não registrar centenas de skills especializadas.
