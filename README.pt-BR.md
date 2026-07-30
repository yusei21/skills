# skills

*[Read this in English](./README.md)*

Coleção pessoal de agentes, skills, regras e hooks para uso com o Claude Code.

Este repositório teve origem no conteúdo do projeto open source
[Everything Claude Code](https://github.com/affaan-m/everything-claude-code)
(licença MIT) e pode incorporar conteúdo de outras fontes ao longo do tempo.
Veja [`NOTICE.md`](./NOTICE.md) para os créditos completos e o que foi
mantido, adaptado ou removido em relação ao original.

Para tirar o máximo proveito do que está aqui dentro (quando usar cada
agente, como combinar skills, dicas de custo/token), veja o
[guia de uso avançado](./docs/GUIA.md).

## Pré-requisitos

- Claude Code CLI instalado (versão 2.1.0 ou mais recente)
```bash
claude --version
```

## Instalação

### Opção A — Instalar como plugin (recomendado)

```bash
/plugin marketplace add git@github.com:yusei21/skills.git
/plugin install skills@skills
```

> Ajuste `skills@skills` conforme o identificador definido no
> `.claude-plugin/plugin.json` deste repositório, se for diferente.

### Opção B — Instalação manual

```bash
git clone git@github.com:yusei21/skills.git
cd skills

# Agentes
cp agents/*.md ~/.claude/agents/

# Skills (principal superfície de trabalho)
mkdir -p ~/.claude/skills/meu-repo
cp -r skills/* ~/.claude/skills/meu-repo/

# Regras (comuns + específicas da sua stack)
mkdir -p ~/.claude/rules/meu-repo
cp -r rules/common ~/.claude/rules/meu-repo/
cp -r rules/typescript ~/.claude/rules/meu-repo/   # troque pela sua stack
```

### Hooks

Não copie `hooks/hooks.json` diretamente para `~/.claude/settings.json`.
Copie o conteúdo de cada hook individualmente, ajustando os caminhos dos
scripts, ou use o instalador do repositório se houver um.

### Servidores MCP

O catálogo completo está em [`mcp-configs/mcp-servers.json`](./mcp-configs/mcp-servers.json).
Nada é ativado por padrão — copie os servidores que quiser para a seção
`mcpServers` do seu `~/.claude.json` e substitua os placeholders
`YOUR_*_HERE` por chaves reais. Um bom par inicial é **GitHub** e
**Context7**. Mantenha menos de ~10 ativos para preservar a janela de contexto.

### Suporte a Antigravity CLI (`agy`)

A pasta `.gemini/` é voltada para o **Antigravity CLI (`agy`)**, sucessor do
Gemini CLI descontinuado pelo Google (contas individuais foram cortadas em
18/06/2026). O `agy` ainda lê de `~/.gemini/`, mas com um layout novo:

- Config geral / instruções: [`.gemini/antigravity-cli/`](./.gemini/antigravity-cli/)
- Config de MCP centralizada: [`.gemini/config/mcp_config.json`](./.gemini/config/mcp_config.json)
  (substitui o antigo `~/.gemini/settings.json`)

Importe plugins antigos do Gemini CLI com `agy plugin import gemini`.

### Verificar instalação

```bash
/plugin list skills@skills
```

## Estrutura

```
skills/
├── agents/       # subagentes especializados (planner, reviewer, etc.)
├── skills/       # skills — fluxos de trabalho e conhecimento de domínio
├── rules/        # regras sempre ativas (comuns + por linguagem)
├── hooks/        # automações disparadas por eventos
├── scripts/      # scripts de apoio de instalação/runtime
├── commands/     # comandos de compatibilidade (formato /slash)
├── mcp-configs/  # catálogo de servidores MCP (não ativado por padrão)
├── .codex/       # alvo Codex CLI
├── .opencode/    # alvo OpenCode
├── .gemini/      # alvo Antigravity CLI (agy)
├── docs/         # guia de uso avançado
├── NOTICE.md / NOTICE.en.md  # avisos de origem, licenças e adaptações
└── README.md / README.pt-BR.md  # inglês / português
```

## Licença

MIT — veja [`LICENSE`](./LICENSE) e [`NOTICE.md`](./NOTICE.md).
