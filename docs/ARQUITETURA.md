# Arquitetura do Repositório

[English](./ARCHITECTURE.md) | **Português** | [简体中文](./ARCHITECTURE.zh-CN.md)

Este documento descreve a estrutura atual do repositório e a separação entre recursos canônicos, dados gerados de descoberta, adaptadores específicos de ferramentas e automação.

A regra central é simples: comportamento compartilhado deve ter uma única implementação canônica. As integrações de ferramentas devem expor ou referenciar essa implementação, em vez de manter cópias independentes.

## Camadas da arquitetura

O repositório é organizado em quatro camadas.

### 1. Recursos canônicos

Estes diretórios contêm o material reutilizável compartilhado entre integrações:

| Caminho | Responsabilidade |
|---|---|
| `skills/` | Workflows, procedimentos e conhecimento de domínio reutilizáveis. Cada skill canônica é definida por seu próprio `SKILL.md`. |
| `agents/` | Definições reutilizáveis de papéis de agentes especialistas. |
| `commands/` | Entradas de comandos compartilhadas para workflows recorrentes. |
| `rules/` | Restrições transversais de comportamento e código. |
| `hooks/` | Automação e enforcement orientados a eventos. |
| `scripts/` | Ferramentas determinísticas de apoio, geradores, instaladores e runtimes. |
| `mcp-configs/` | Catálogo compartilhado de servidores MCP e configurações relacionadas. |

Mudanças que afetam comportamento compartilhado normalmente devem acontecer primeiro aqui.

### 2. Descoberta e metadados gerados

`.skill-index/` contém dados de descoberta em nível de repositório usados para evitar carregar todo o catálogo de skills no contexto.

Os arquivos atuais incluem:

- `.skill-index/skills.json` — catálogo gerado a partir de `skills/*/SKILL.md`;
- `.skill-index/project-profile.json` — perfil do projeto com linguagens, frameworks, ferramentas, diretórios importantes e skills padrão recomendadas detectadas.

O índice canônico é gerado com:

```bash
node scripts/build-skill-index.js
```

`.skill-index/skills.json` é dado gerado e não deve virar um segundo catálogo mantido manualmente.

### 3. Adaptadores e configuração nativa de ferramentas

Diretórios específicos de ferramentas são superfícies de integração, não fontes alternativas de verdade:

| Caminho | Papel |
|---|---|
| `.agents/` | Links de descoberta de skills compatíveis com Codex/nativo. |
| `.claude/` | Integração do Claude Code e links leves para skills de roteamento. |
| `.codex/` | Configuração do Codex e definições de agentes nativos. |
| `.agy/` | Integração do Antigravity. |
| `.mimocode/` | Integração do MiMo Code. |
| `.opencode/` | Plugin e arquivos de integração do OpenCode. |
| `.kimi/` | Integração do Kimi. |
| `.gemini/` | Conteúdo legado de compatibilidade e histórico de migração. |

Quando uma ferramenta suporta links ou referências, os adaptadores devem apontar para os recursos canônicos. Eles não devem manter cópias físicas independentes da mesma skill ou agente compartilhado.

As skills leves de roteamento de projeto atualmente expostas por várias integrações são:

- `project-orchestrator`;
- `skill-builder`;
- `subagent-builder`.

Skills especializadas permanecem em `skills/` e são descobertas e carregadas sob demanda.

### 4. Empacotamento, automação e documentação

As demais superfícies de apoio de nível superior são:

| Caminho | Papel |
|---|---|
| `.claude-plugin/` | Metadados de plugin e marketplace do Claude Code. |
| `.github/` | Automação do repositório, incluindo o workflow de sincronização do índice de skills. |
| `docs/` | Guias multilíngues, documentação de arquitetura e pesquisa de ecossistema. |
| `AGENTS.md` | Instruções compartilhadas de roteamento automático para agentes/ferramentas compatíveis. |
| `CLAUDE.md` | Entrada específica do Claude sobreposta a `AGENTS.md`. |
| `NOTICE*.md` | Avisos de atribuição, licenciamento e adaptação. |

## Fluxo de dados

O fluxo pretendido é:

```text
skills/*/SKILL.md e outros recursos canônicos
                  │
                  ├── scripts/build-skill-index.js
                  │           │
                  │           └── .skill-index/skills.json
                  │
                  ├── project-orchestrator / builders
                  │           │
                  │           └── carregamento seletivo de skills e agentes
                  │
                  └── adaptadores de ferramentas
                              │
                              ├── .claude/
                              ├── .agents/
                              ├── .agy/
                              ├── .mimocode/
                              ├── .opencode/
                              └── outras integrações nativas
```

Os adaptadores fornecem acesso; os diretórios canônicos definem o comportamento.

## Regras de propriedade

Use estas regras para decidir onde uma mudança pertence:

1. Se o comportamento deve ser compartilhado por várias ferramentas, altere o recurso canônico da raiz.
2. Se a mudança for específica da configuração nativa ou do mecanismo de carregamento de uma ferramenta, altere o diretório adaptador dessa ferramenta.
3. Se a mudança afetar descoberta de skills, atualize a skill canônica e regenere `.skill-index/skills.json`, em vez de editar o índice gerado manualmente.
4. Se a mudança afetar empacotamento de plugin ou metadados de marketplace, atualize `.claude-plugin/`.
5. Se a mudança afetar automação do repositório, atualize `.github/` e o script determinístico relacionado quando aplicável.
6. Se a mudança for material e voltada ao usuário, atualize a documentação em inglês, português e chinês simplificado no mesmo conjunto de mudanças.

## Adicionando uma skill

Uma nova skill reutilizável pertence em:

```text
skills/<skill-name>/SKILL.md
```

Antes de adicioná-la:

1. pesquise `.skill-index/skills.json` por intenção sobreposta;
2. prefira ampliar uma skill existente quando o workflow se sobrepuser de forma substancial;
3. valide frontmatter, fronteiras, segurança, dependências e licenciamento;
4. regenere o índice de skills;
5. adicione exposição específica de ferramenta somente quando a integração realmente exigir.

Não registre toda skill especializada em todos os adaptadores. O repositório foi intencionalmente desenhado em torno de descoberta seletiva.

## Adicionando ou alterando um agente

Definições de papéis reutilizáveis pertencem em `agents/` ou, quando deliberadamente restritas a uma skill, nos recursos de agente dessa própria skill. Configuração de agente nativa e específica de ferramenta pertence ao adaptador correspondente, como `.codex/agents/`.

Mantenha conhecimento de domínio reutilizável em skills, em vez de copiá-lo para cada prompt de agente.

## Política de symlinks e duplicação

Vários diretórios de integração usam links para as skills canônicas de roteamento. Isso é intencional: links preservam uma única implementação enquanto atendem às convenções nativas de descoberta.

Ao adicionar outra integração, prefira nesta ordem:

1. referência direta ao recurso canônico;
2. symlink ou adaptador leve;
3. representação gerada quando a ferramenta exigir outro formato;
4. duplicação física somente quando a ferramenta de destino impossibilitar todas as outras opções, com uma estratégia explícita de sincronização.

## Checklist de validação

Para mudanças estruturais, verifique que:

- recursos canônicos continuam nos diretórios compartilhados da raiz;
- adaptadores não introduzem fontes de verdade duplicadas silenciosamente;
- links de roteamento resolvem corretamente;
- `node scripts/build-skill-index.js` conclui com sucesso quando skills foram alteradas;
- `.skill-index/skills.json` corresponde à árvore canônica de skills;
- exemplos de estrutura na documentação correspondem à árvore real do repositório;
- os três idiomas da documentação voltada ao usuário são atualizados em mudanças materiais.

## Estrutura atual de nível superior

```text
skills/
├── skills/              # skills canônicas
├── agents/              # agentes reutilizáveis canônicos
├── commands/            # comandos compartilhados
├── rules/               # regras compartilhadas
├── hooks/               # automação orientada a eventos
├── scripts/             # geradores, instaladores e runtimes de apoio
├── mcp-configs/         # catálogo MCP compartilhado
├── .skill-index/        # dados de descoberta gerados + perfil do projeto
├── .agents/             # links de skills compatíveis com Codex/nativo
├── .claude/             # adaptador do Claude Code
├── .claude-plugin/      # metadados de plugin/marketplace do Claude
├── .codex/              # configuração e agentes nativos do Codex
├── .agy/                # adaptador do Antigravity
├── .mimocode/           # adaptador do MiMo Code
├── .opencode/           # plugin/integração do OpenCode
├── .kimi/               # adaptador do Kimi
├── .gemini/             # conteúdo legado de compatibilidade
├── .github/             # CI e automação do repositório
├── docs/                # documentação multilíngue do projeto
├── AGENTS.md            # instruções compartilhadas de roteamento
├── CLAUDE.md            # entrada específica do Claude
├── README*.md           # visão geral multilíngue do projeto
├── NOTICE*.md           # avisos de atribuição e licenciamento
└── LICENSE
```
