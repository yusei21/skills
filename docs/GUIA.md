# Guia de Uso Avançado

*[Read this in English](./GUIDE.md)*

Este guia parte do princípio de que o repositório já está instalado (veja
o [`README.md`](../README.md) para instruções de instalação). O foco aqui
é como usar cada peça do repositório com o máximo de eficiência.

## 1. Quando usar cada tipo de recurso

| Recurso | Para que serve | Quando acionar |
|---|---|---|
| **Agentes** (`agents/`) | Tarefa delegada, com escopo limitado (ex: revisão de código, resolução de build) | Quando a tarefa é bem definida e isolada — deixe o agente rodar sem poluir o contexto principal |
| **Skills** (`skills/`) | Fluxos de trabalho e conhecimento de domínio reutilizável | Superfície principal do dia a dia — chame direto ou deixe o Claude Code sugerir automaticamente |
| **Regras** (`rules/`) | Diretrizes sempre ativas (estilo de código, testes, segurança) | Ficam carregadas o tempo todo — use para padronizar sem precisar repetir instruções |
| **Hooks** (`hooks/`) | Automação disparada por eventos (ex: bloquear commit com secret exposto) | Configure uma vez, roda sozinho a partir daí |
| **Comandos** (`commands/`) | Atalhos `/slash` para skills/fluxos específicos | Quando quiser disparar algo rapidamente sem descrever a tarefa por extenso |

## 2. Fluxos de trabalho comuns

### Começar uma feature nova
```
/plan "descrição da feature"     → agente de planejamento gera um blueprint
skill de TDD                      → escreve teste antes da implementação
/code-review                      → revisão de qualidade e segurança
```

### Corrigir um bug
```
skill de TDD  → escreve um teste que reproduz o bug (falha primeiro)
                → implementa a correção, confirma que o teste passa
/code-review  → checa se não quebrou nada
```

### Preparar para produção
```
/security-scan   → checklist de segurança
skill de e2e     → testa os fluxos críticos
/test-coverage   → confirma cobertura de testes
```

Adapte os nomes de comando/skill acima conforme o que efetivamente existir
neste repositório — use `/plugin list skills@skills` para ver a lista real.

## 3. Combinando agentes e skills

Um agente pode invocar uma skill como parte do seu processo. Por exemplo,
um agente de revisão de código pode consultar a skill de padrões de
segurança antes de dar o parecer final. Ao criar seus próprios agentes,
referencie skills existentes em vez de duplicar conhecimento — mantém o
repositório mais fácil de manter.

## 4. Regras: comuns vs. específicas de linguagem

Instale sempre a pasta `rules/common/` (universal) e some **apenas** a
pasta da(s) linguagem(ns) que você realmente usa. Isso evita:
- Contexto desnecessário consumindo tokens
- Conflito de convenções entre linguagens que você não usa

## 5. Otimização de custo/token

- Prefira o modelo padrão (`sonnet`) para a maioria das tarefas; suba pra
  um modelo mais caro só quando precisar de raciocínio mais profundo.
- Use `/clear` entre tarefas não relacionadas — é instantâneo e gratuito.
- Use `/compact` em pontos de parada lógicos (depois de pesquisar, antes
  de implementar; depois de um marco concluído) — não no meio de uma
  implementação, senão você perde nomes de variáveis e estado parcial.
- Não ative muitos servidores MCP ao mesmo tempo — cada um consome tokens
  da janela de contexto só de existir na lista de ferramentas.

## 6. Adicionando conteúdo de outros repositórios

Sempre que você trouxer código, skills ou configs de outro repositório:

1. Confira a licença da fonte antes de copiar:
   - **MIT / Apache-2.0 / BSD:** tranquilo, pode misturar livremente
   - **GPL / AGPL:** cuidado — pode exigir que este repositório inteiro
     vire GPL também
   - **Sem licença declarada:** não copie sem autorização explícita
2. Copie o conteúdo para a pasta correspondente aqui dentro
   (`agents/`, `skills/`, `rules/`, etc.)
3. Adicione uma nova seção em [`NOTICE.md`](../NOTICE.md) e
   [`NOTICE.en.md`](../NOTICE.en.md), preenchendo origem, copyright,
   licença e o que foi mantido/adaptado/removido

## 7. Customizando o que já existe

O conteúdo herdado é um ponto de partida, não um destino final:

1. Comece pelo que já faz sentido pro seu fluxo
2. Adapte regras e skills pra sua stack real
3. Remova o que você nunca usa (menos contexto carregado = mais eficiência)
4. Documente seus próprios padrões como novas skills conforme for aprendendo
