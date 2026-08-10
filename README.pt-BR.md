# Skills

[English](./README.md) | **Português** | [简体中文](./README.zh-CN.md)

Coleção compartilhada de skills, agentes, comandos, regras, hooks, scripts e configurações MCP para várias ferramentas de programação com IA.

O repositório usa fontes canônicas na raiz:

- `skills/` para fluxos reutilizáveis e conhecimento de domínio;
- `agents/` para definições reutilizáveis de papéis de agentes;
- `commands/`, `rules/`, `hooks/`, `scripts/` e `mcp-configs/` para recursos de apoio compartilhados.

Pastas específicas de ferramentas, como `.claude/`, `.codex/`, `.agents/`, `.agy/`, `.mimocode/` e `.opencode/`, devem conter apenas arquivos de integração, configuração nativa e links para os recursos canônicos. Elas não devem manter cópias físicas independentes das skills ou dos agentes compartilhados.

Este repositório teve origem no projeto open source [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) (licença MIT) e pode incorporar conteúdo de outras fontes ao longo do tempo. Veja [`NOTICE.md`](./NOTICE.md) para créditos e notas de adaptação.

Para uso avançado, orquestração, roteamento de skills, contribuição e disciplina de contexto, consulte [`docs/GUIA.md`](./docs/GUIA.md). Para a análise atual do ecossistema externo de skills, critérios de seleção, decisões de deduplicação e notas de implementação, consulte [`docs/ECOSYSTEM.pt-BR.md`](./docs/ECOSYSTEM.pt-BR.md).

## Roteamento automático

Três skills de projeto coordenam descoberta e criação:

- `project-orchestrator` inspeciona o repositório e seleciona somente as skills e os prompts especialistas necessários para a tarefa atual;
- `skill-builder` procura uma capacidade existente antes de criar, ampliar, validar e registrar uma skill;
- `subagent-builder` procura papéis existentes antes de criar ou registrar um subagente especialista.

As skills especializadas permanecem em `skills/` e são carregadas sob demanda. Isso evita registrar todo o catálogo em cada ferramenta e ultrapassar os limites de contexto.

O índice canônico de skills é gerado a partir de `skills/*/SKILL.md` por `scripts/build-skill-index.js` e mantido sincronizado pelo GitHub Actions:

```bash
node scripts/build-skill-index.js
```

Os dados de descoberta ficam em `.skill-index/skills.json`. Não mantenha um segundo catálogo manual em diretórios específicos de ferramentas.

## Skills de workflow em destaque

A análise mais recente do ecossistema adicionou três capacidades distintas depois de verificar sobreposição com o catálogo existente:

- `systematic-debugging` — análise de causa raiz orientada por evidências, com reprodução, hipótese falsificável, isolamento e verificação de regressão;
- `verification-before-completion` — exige evidência atual antes que um agente afirme que uma implementação, correção, migração ou automação foi concluída;
- `composition-patterns` — design de APIs reutilizáveis de componentes de UI usando composição, slots, estado controlado/não controlado, compound components e pontos de extensão explícitos.

Candidatas amplas de React e design web foram intencionalmente descartadas porque o repositório já possui cobertura sobreposta mais forte em skills como `react-patterns`, `react-performance`, `design-system`, `frontend-design-direction` e `make-interfaces-feel-better`. Veja [`docs/ECOSYSTEM.pt-BR.md`](./docs/ECOSYSTEM.pt-BR.md) para o registro da decisão.

## Integrações suportadas

O repositório inclui superfícies de integração para:

- Claude Code: `.claude/` e `CLAUDE.md`;
- OpenAI Codex CLI: `.codex/` e `.agents/skills/`;
- Antigravity CLI: `.agy/`;
- MiMo Code: `.mimocode/`;
- OpenCode: `.opencode/`;
- Kimi: `.kimi/`.

O conteúdo legado em `.gemini/` é mantido para compatibilidade e histórico de migração, mas a integração ativa do Antigravity está documentada em `.agy/`.

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

Para instalação como plugin do Claude Code, quando compatível com a versão atual do Claude Code e com os metadados de plugin deste repositório:

```text
/plugin marketplace add git@github.com:yusei21/skills.git
/plugin install skills@skills
```

Não copie todas as skills para uma pasta global da ferramenta por padrão. Use as skills de roteamento locais do projeto ou instale somente os recursos necessários em outro repositório.

## Servidores MCP

O catálogo compartilhado está em [`mcp-configs/mcp-servers.json`](./mcp-configs/mcp-servers.json). Credenciais devem permanecer em variáveis de ambiente ou na configuração do usuário, nunca no repositório. Ative somente os servidores necessários para preservar contexto e reduzir a superfície de ataque.

## Política de documentação

A documentação voltada ao usuário é mantida nesta ordem:

1. inglês — fonte canônica;
2. português (`pt-BR`);
3. chinês simplificado (`zh-CN`).

Mudanças materiais de documentação devem atualizar as três variantes no mesmo conjunto de mudanças. Identificadores de código, nomes de comandos, caminhos de arquivos, nomes de APIs e chaves de configuração permanecem em inglês, salvo quando uma ferramenta subjacente exigir localização.

## Estrutura

```text
skills/
├── skills/          # skills canônicas
├── agents/          # prompts canônicos de agentes
├── commands/        # comandos compartilhados
├── rules/           # regras compartilhadas
├── hooks/           # automações disparadas por eventos
├── scripts/         # scripts e runtimes de apoio
├── mcp-configs/     # catálogo MCP compartilhado
├── .skill-index/    # índice canônico gerado para descoberta de skills
├── .agents/         # links de descoberta de skills para Codex/nativo
├── .claude/         # integração específica do Claude
├── .codex/          # configuração e papéis nativos do Codex
├── .agy/            # integração específica do Antigravity
├── .mimocode/       # integração específica do MiMo Code
├── .opencode/       # plugin e integração do OpenCode
├── .kimi/           # integração específica do Kimi
├── .gemini/         # conteúdo legado de compatibilidade
├── docs/            # guias multilíngues e pesquisa de ecossistema
├── AGENTS.md        # instruções compartilhadas de roteamento automático
├── CLAUDE.md        # entrada específica do Claude
├── NOTICE.md        # avisos de origem e licença em português
├── NOTICE.en.md     # avisos de origem e licença em inglês
└── NOTICE.zh-CN.md  # avisos de origem e licença em chinês simplificado
```

## Contribuição

Mantenha implementações compartilhadas nos diretórios canônicos da raiz. As pastas de integração devem referenciar esses recursos em vez de duplicá-los.

Antes de adicionar uma nova skill:

1. pesquise o índice atual e compare a intenção com as skills existentes;
2. prefira ampliar uma skill canônica existente em vez de adicionar uma quase duplicata;
3. valide frontmatter, fronteiras do workflow, segurança e licença;
4. regenere o índice de skills;
5. atualize a documentação voltada ao usuário em inglês, português e chinês simplificado quando a mudança for material.

## Licença

MIT — veja [`LICENSE`](./LICENSE) e [`NOTICE.md`](./NOTICE.md).
