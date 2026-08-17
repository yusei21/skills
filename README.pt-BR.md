# Skills

[English](./README.md) | **Português** | [简体中文](./README.zh-CN.md)

Uma coleção mantida e expandida de skills, agentes, comandos, regras, hooks, scripts e configurações MCP para várias ferramentas de programação com IA.

O repositório segue uma arquitetura de fonte canônica: comportamento compartilhado vive uma única vez na raiz, metadados gerados apoiam a descoberta e diretórios específicos de ferramentas funcionam como adaptadores, não como cópias independentes.

Para a descrição completa da estrutura atual, regras de propriedade, fluxo de dados, política de symlinks e validação estrutural, veja [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md).

## Arquitetura em resumo

O repositório é dividido em quatro camadas:

1. **Recursos canônicos** — `skills/`, `agents/`, `commands/`, `rules/`, `hooks/`, `scripts/` e `mcp-configs/`.
2. **Metadados de descoberta** — `.skill-index/skills.json` e `.skill-index/project-profile.json`.
3. **Adaptadores de ferramentas** — `.claude/`, `.codex/`, `.agents/`, `.agy/`, `.mimocode/`, `.opencode/`, `.kimi/`, além do conteúdo legado de compatibilidade em `.gemini/`.
4. **Empacotamento e automação** — `.claude-plugin/`, `.github/`, `docs/` e os arquivos de instruções no nível do repositório.

Diretórios específicos de ferramentas devem conter arquivos de integração, configuração nativa, links ou representações geradas. Eles não devem se tornar cópias físicas independentes de skills ou agentes compartilhados.

## Roteamento automático

Três skills leves de projeto coordenam descoberta e criação:

- `project-orchestrator` inspeciona o repositório e seleciona somente as skills e os prompts especialistas necessários para a tarefa atual;
- `skill-builder` procura uma capacidade existente antes de criar, ampliar, validar e registrar uma skill;
- `subagent-builder` procura papéis existentes antes de criar ou registrar um subagente especialista.

Skills especializadas permanecem em `skills/` e são carregadas sob demanda, em vez de serem registradas em todas as integrações.

O índice canônico de skills é gerado a partir de `skills/*/SKILL.md` com:

```bash
node scripts/build-skill-index.js
```

Os dados de descoberta ficam em `.skill-index/`:

- `skills.json` — catálogo gerado de skills;
- `project-profile.json` — perfil do repositório com linguagens, frameworks, ferramentas, diretórios importantes e padrões recomendados detectados.

Não mantenha um segundo catálogo manual em diretórios específicos de ferramentas.

## Integrações suportadas

O repositório atualmente inclui superfícies de integração para:

- Claude Code: `.claude/`, `CLAUDE.md` e metadados de plugin em `.claude-plugin/`;
- OpenAI Codex CLI: `.codex/` e `.agents/skills/`;
- Antigravity CLI: `.agy/`;
- MiMo Code: `.mimocode/`;
- OpenCode: `.opencode/`;
- Kimi: `.kimi/`.

O conteúdo legado em `.gemini/` é mantido para compatibilidade e histórico de migração, mas a integração ativa do Antigravity fica em `.agy/`.

## Instalação

Clone o repositório e inicie a ferramenta na raiz para que ela carregue as instruções e os links locais do projeto:

```bash
git clone git@github.com:yusei21/skills.git
cd skills
```

Exemplos:

```bash
claude
codex
agy
opencode
```

Para instalação como plugin do Claude Code, quando compatível com a versão atual do Claude Code e com os metadados deste repositório:

```text
/plugin marketplace add git@github.com:yusei21/skills.git
/plugin install skills@skills
```

Não copie todas as skills para uma pasta global da ferramenta por padrão. Prefira o roteamento local do projeto ou instale somente os recursos específicos necessários em outro repositório.

## Servidores MCP

O catálogo compartilhado está em [`mcp-configs/mcp-servers.json`](./mcp-configs/mcp-servers.json). Credenciais devem permanecer em variáveis de ambiente ou na configuração do usuário, nunca no repositório. Ative somente os servidores necessários para preservar contexto e reduzir a superfície de ataque.

## Documentação

- [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md) — estrutura do repositório, fronteiras de propriedade, fluxo de dados e política de adaptadores;
- [`docs/GUIA.md`](./docs/GUIA.md) — uso avançado, orquestração, roteamento de skills, contribuição e disciplina de contexto;
- [`docs/ECOSYSTEM.pt-BR.md`](./docs/ECOSYSTEM.pt-BR.md) — análise do ecossistema externo de skills, critérios de seleção, decisões de deduplicação e notas de implementação.

A documentação voltada ao usuário é mantida em inglês, português (`pt-BR`) e chinês simplificado (`zh-CN`). Mudanças materiais devem atualizar as três variantes no mesmo conjunto de mudanças.

## Estrutura

```text
skills/
├── skills/              # skills canônicas
├── agents/              # agentes reutilizáveis canônicos
├── commands/            # comandos compartilhados
├── rules/               # regras compartilhadas
├── hooks/               # automação orientada a eventos
├── scripts/             # geradores, instaladores e runtimes de apoio
├── mcp-configs/         # catálogo MCP compartilhado
├── .skill-index/        # dados gerados de descoberta + perfil do projeto
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

## Contribuição

Mantenha implementações compartilhadas nos diretórios canônicos da raiz. Pastas de integração devem referenciar esses recursos, em vez de duplicá-los.

Antes de adicionar uma nova skill:

1. pesquise o índice atual e compare a intenção com skills existentes;
2. prefira ampliar uma skill canônica existente em vez de adicionar uma quase duplicata;
3. valide frontmatter, fronteiras do workflow, segurança, dependências e licenciamento;
4. regenere o índice de skills;
5. adicione exposição específica de ferramenta somente quando a integração exigir;
6. atualize a documentação em inglês, português e chinês simplificado quando a mudança for material.

Para mudanças estruturais, siga as regras de propriedade e o checklist de validação em [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md).

## Atribuição e licença

Este projeto incorpora e adapta trabalho open source de várias fontes. Créditos, detalhes de licenciamento e notas de adaptação são mantidos em [`NOTICE.md`](./NOTICE.md).

MIT — veja [`LICENSE`](./LICENSE) e [`NOTICE.md`](./NOTICE.md).
