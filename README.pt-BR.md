# skills (teste)

[English](./README.md) | **Português** | [简体中文](./README.zh-CN.md)

Coleção compartilhada de skills, agentes, comandos, regras, hooks, scripts e
configurações MCP para várias ferramentas de programação com IA.

O repositório usa fontes canônicas na raiz:

- `skills/` para fluxos reutilizáveis e conhecimento de domínio;
- `agents/` para definições reutilizáveis de papéis de agentes;
- `commands/`, `rules/`, `hooks/`, `scripts/` e `mcp-configs/` para recursos de apoio compartilhados.

Pastas específicas de ferramentas, como `.claude/`, `.codex/`, `.agents/`,
`.agy/`, `.mimocode/` e `.opencode/`, devem conter apenas arquivos de
integração, configuração nativa e links para os recursos canônicos. Elas não
devem manter cópias físicas independentes das skills ou dos agentes
compartilhados.

Este repositório teve origem no projeto open source
[Everything Claude Code](https://github.com/affaan-m/everything-claude-code)
(licença MIT) e pode incorporar conteúdo de outras fontes ao longo do tempo.
Veja [`NOTICE.md`](./NOTICE.md) para os créditos e notas de adaptação.

Para uso avançado, orquestração e controle de orçamento de contexto, consulte
[`docs/GUIA.md`](./docs/GUIA.md).

## Roteamento automático

Três skills de projeto coordenam descoberta e criação:

- `project-orchestrator` inspeciona o repositório e seleciona somente as skills
  e os prompts especialistas necessários para a tarefa atual;
- `skill-builder` procura uma capacidade existente antes de criar, ampliar,
  validar e registrar uma skill;
- `subagent-builder` procura papéis existentes antes de criar ou registrar um
  subagente especialista.

As skills especializadas permanecem em `skills/` e são carregadas sob demanda.
Isso evita registrar todo o catálogo em cada ferramenta e ultrapassar os
limites de contexto.

## Integrações suportadas

O repositório inclui superfícies de integração para:

- Claude Code: `.claude/` e `CLAUDE.md`;
- OpenAI Codex CLI: `.codex/` e `.agents/skills/`;
- Antigravity CLI: `.agy/`;
- MiMo Code: `.mimocode/`;
- OpenCode: `.opencode/`;
- Kimi: `.kimi/`.

O conteúdo legado em `.gemini/` é mantido para compatibilidade e histórico de
migração, mas a integração ativa do Antigravity está documentada em `.agy/`.

## Instalação

Clone o repositório e inicie a ferramenta na raiz para que ela carregue as
instruções e os links locais do projeto:

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

Para instalação como plugin do Claude Code, quando compatível com a versão
atual do Claude Code e com os metadados de plugin deste repositório:

```text
/plugin marketplace add git@github.com:yusei21/skills.git
/plugin install skills@skills
```

Não copie todas as skills para uma pasta global da ferramenta por padrão. Use
as skills de roteamento locais do projeto ou instale somente os recursos
necessários em outro repositório.

## Servidores MCP

O catálogo compartilhado está em
[`mcp-configs/mcp-servers.json`](./mcp-configs/mcp-servers.json). Credenciais
devem permanecer em variáveis de ambiente ou na configuração do usuário, nunca
no repositório. Ative somente os servidores necessários para preservar contexto
e reduzir a superfície de ataque.

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
├── .agents/         # links de descoberta de skills para Codex/nativo
├── .claude/         # integração específica do Claude
├── .codex/          # configuração e papéis nativos do Codex
├── .agy/            # integração específica do Antigravity
├── .mimocode/       # integração específica do MiMo Code
├── .opencode/       # plugin e integração do OpenCode
├── .kimi/           # integração específica do Kimi
├── .gemini/         # conteúdo legado de compatibilidade
├── docs/            # guias e documentação de apoio
├── AGENTS.md        # instruções compartilhadas de roteamento automático
├── CLAUDE.md        # entrada específica do Claude
├── NOTICE.md        # avisos de origem e licença em português
├── NOTICE.en.md     # avisos de origem e licença em inglês
└── NOTICE.zh-CN.md  # avisos de origem e licença em chinês simplificado
```

## Contribuição

Mantenha implementações compartilhadas nos diretórios canônicos da raiz. As
pastas de integração devem referenciar esses recursos em vez de duplicá-los.
Novas skills devem ser pesquisadas, validadas e inventariadas antes de serem
adicionadas.

## Licença

MIT — veja [`LICENSE`](./LICENSE) e [`NOTICE.md`](./NOTICE.md).
