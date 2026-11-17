# Como contribuir com o ECC

[English](CONTRIBUTING.md) | **Português** | [中文](CONTRIBUTING.zh-CN.md)

Obrigado por querer contribuir! Este repositório é um recurso comunitário para
quem usa o Claude Code.

## Sumário

- [O que procuramos](#o-que-procuramos)
- [Início rápido](#início-rápido)
- [Contribuindo com skills](#contribuindo-com-skills)
- [Política de adaptação de skills](#política-de-adaptação-de-skills)
- [Contribuindo com agentes](#contribuindo-com-agentes)
- [Contribuindo com hooks](#contribuindo-com-hooks)
- [Contribuindo com comandos](#contribuindo-com-comandos)
- [MCP e documentação (ex.: Context7)](#mcp-e-documentação-ex-context7)
- [Outros ambientes e traduções](#outros-ambientes-e-traduções)
- [Processo de pull request](#processo-de-pull-request)
- [Releases](#releases)
- [Diretrizes](#diretrizes)
- [Nomes de arquivos](#nomes-de-arquivos)
- [Dúvidas?](#dúvidas)

---

## O que procuramos

### Agentes
Agentes novos que façam bem tarefas específicas:
- Revisores por linguagem (Python, Go, Rust)
- Especialistas em frameworks (Django, Rails, Laravel, Spring)
- Especialistas em DevOps (Kubernetes, Terraform, CI/CD)
- Especialistas de domínio (pipelines de ML, engenharia de dados, mobile)

### Skills
Definições de fluxo de trabalho e conhecimento de domínio:
- Boas práticas de linguagens
- Padrões de frameworks
- Estratégias de teste
- Guias de arquitetura

### Hooks
Automações úteis:
- Hooks de lint/formatação
- Verificações de segurança
- Hooks de validação
- Hooks de notificação

### Comandos
Comandos de barra que disparam fluxos úteis:
- Comandos de deploy
- Comandos de teste
- Comandos de geração de código

---

## Início rápido

```bash
# 1. Faça o fork e clone
gh repo fork affaan-m/ECC --clone
cd ECC

# 2. Crie um branch
git checkout -b feat/my-contribution

# 3. Adicione sua contribuição (veja as seções abaixo)

# 4. Teste localmente
cp -r skills/<department>/my-skill ~/.claude/skills/  # para skills
# Depois teste no Claude Code

# 5. Envie o PR
git add . && git commit -m "feat: add my-skill" && git push -u origin feat/my-contribution
```

---

## Contribuindo com skills

Skills são módulos de conhecimento que o Claude Code carrega de acordo com o
contexto.

> **Guia completo:** para orientações detalhadas sobre como criar skills
> eficazes, veja o [Skill Development Guide](docs/SKILL-DEVELOPMENT-GUIDE.md)
> (em inglês). Ele cobre:
> - Arquitetura e categorias de skills
> - Como escrever conteúdo eficaz, com exemplos
> - Boas práticas e padrões comuns
> - Testes e validação
> - Uma galeria completa de exemplos

### Estrutura de pastas

```
skills/
└── <department>/
    └── your-skill-name/
        └── SKILL.md
```

Escolha o departamento em `manifests/skill-departments.json`, liste a skill
ali e rode `npm run departments:sync` para os plugins de departamento a
incluírem.

### Modelo de SKILL.md

Skills, agentes e comandos são escritos em inglês, por isso os modelos abaixo
ficam em inglês.

```markdown
---
name: your-skill-name
description: Brief description shown in skill list and used for auto-activation
origin: ECC
---

# Your Skill Title

Brief overview of what this skill covers.

## When to Activate

Describe scenarios where Claude should use this skill. This is critical for auto-activation.

## Core Concepts

Explain key patterns and guidelines.

## Code Examples

\`\`\`typescript
// Include practical, tested examples
function example() {
  // Well-commented code
}
\`\`\`

## Anti-Patterns

Show what NOT to do with examples.

## Best Practices

- Actionable guidelines
- Do's and don'ts
- Common pitfalls to avoid

## Related Skills

Link to complementary skills (e.g., `related-skill-1`, `related-skill-2`).
```

### Categorias de skills

| Categoria | Propósito | Exemplos |
|-----------|-----------|----------|
| **Padrões de linguagem** | Idiomas, convenções, boas práticas | `python-patterns`, `golang-patterns` |
| **Padrões de framework** | Orientações específicas de cada framework | `django-patterns`, `nextjs-patterns` |
| **Fluxo de trabalho** | Processos passo a passo | `tdd-workflow`, `refactoring-workflow` |
| **Conhecimento de domínio** | Domínios especializados | `security-review`, `api-design` |
| **Integração de ferramentas** | Uso de ferramentas/bibliotecas | `docker-patterns`, `supabase-patterns` |
| **Modelo** | Modelos de skill específicos de projeto | `docs/examples/project-guidelines-template.md` |

### Política de adaptação de skills

Se você está trazendo uma ideia de outro repositório, plugin, ambiente ou
coleção pessoal de prompts, leia a [Skill Adaptation Policy](docs/skill-adaptation-policy.md)
(em inglês) antes de abrir o PR.

Versão curta:

- copie a ideia por trás, não a identidade do produto externo
- renomeie a skill quando o ECC mudar ou ampliar bastante o que ela faz
- prefira regras, skills, scripts e MCPs nativos do ECC a novas dependências
  de terceiros por padrão
- não publique uma skill cujo valor principal é mandar o usuário instalar um
  pacote não verificado

### Checklist de skill

- [ ] Focada em um domínio/tecnologia (não ampla demais)
- [ ] Tem a seção "When to Activate" para a ativação automática
- [ ] Traz exemplos de código práticos, prontos para copiar
- [ ] Mostra anti-padrões (o que NÃO fazer)
- [ ] Menos de 500 linhas (máximo de 800)
- [ ] Usa títulos de seção claros
- [ ] Testada no Claude Code
- [ ] Aponta para skills relacionadas
- [ ] Sem dados sensíveis (chaves de API, tokens, caminhos)
- [ ] O frontmatter declara um `name:` igual ao nome da pasta
- [ ] O `description:` do frontmatter é uma string em linha ou um escalar
  dobrado (`>`), não um bloco literal (`|`, `|-` ou `|+`), que preserva as
  quebras de linha e estraga quem exibe o texto em tabela

### Exemplos de skills

| Skill | Categoria | Propósito |
|-------|-----------|-----------|
| `coding-standards/` | Padrões de linguagem | Padrões de TypeScript/JavaScript |
| `frontend-patterns/` | Padrões de framework | Boas práticas de React e Next.js |
| `backend-patterns/` | Padrões de framework | Padrões de API e banco de dados |
| `security-review/` | Conhecimento de domínio | Checklist de segurança |
| `tdd-workflow/` | Fluxo de trabalho | Processo de desenvolvimento guiado por testes |
| `docs/examples/project-guidelines-template.md` | Modelo | Modelo de skill específica de projeto |

---

## Contribuindo com agentes

Agentes são assistentes especializados chamados pela ferramenta Task.

### Local do arquivo

```
agents/your-agent-name.md
```

### Modelo de agente

```markdown
---
name: your-agent-name
description: What this agent does and when Claude should invoke it. Be specific!
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

You are a [role] specialist.

## Your Role

- Primary responsibility
- Secondary responsibility
- What you DO NOT do (boundaries)

## Workflow

### Step 1: Understand
How you approach the task.

### Step 2: Execute
How you perform the work.

### Step 3: Verify
How you validate results.

## Output Format

What you return to the user.

## Examples

### Example: [Scenario]
Input: [what user provides]
Action: [what you do]
Output: [what you return]
```

### Campos do agente

| Campo | Descrição | Opções |
|-------|-----------|--------|
| `name` | Minúsculas, com hífens | `code-reviewer` |
| `description` | Usado para decidir quando chamar o agente | Seja específico! |
| `tools` | Só o necessário | `Read, Write, Edit, Bash, Grep, Glob, WebFetch, Task`, ou nomes de ferramentas MCP (ex.: `mcp__context7__resolve-library-id`, `mcp__context7__query-docs`) quando o agente usa MCP |
| `model` | Nível de complexidade | `haiku` (simples), `sonnet` (código), `opus` (complexo) |

### Exemplos de agentes

| Agente | Propósito |
|--------|-----------|
| `tdd-guide.md` | Desenvolvimento guiado por testes |
| `code-reviewer.md` | Revisão de código |
| `security-reviewer.md` | Varredura de segurança |
| `build-error-resolver.md` | Corrigir erros de build |

---

## Contribuindo com hooks

Hooks são comportamentos automáticos disparados por eventos do Claude Code.

### Local do arquivo

```
hooks/hooks.json
```

### Tipos de hook

| Tipo | Quando dispara | Uso |
|------|----------------|-----|
| `PreToolUse` | Antes de a ferramenta rodar | Validar, avisar, bloquear |
| `PostToolUse` | Depois de a ferramenta rodar | Formatar, verificar, notificar |
| `SessionStart` | No início da sessão | Carregar contexto |
| `Stop` | No fim da sessão | Limpeza, auditoria |

### Formato do hook

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "tool == \"Bash\" && tool_input.command matches \"rm -rf /\"",
        "hooks": [
          {
            "type": "command",
            "command": "echo '[Hook] BLOCKED: Dangerous command' && exit 1"
          }
        ],
        "description": "Block dangerous rm commands"
      }
    ]
  }
}
```

### Sintaxe do matcher

```javascript
// Casar ferramentas específicas
tool == "Bash"
tool == "Edit"
tool == "Write"

// Casar padrões na entrada
tool_input.command matches "npm install"
tool_input.file_path matches "\\.tsx?$"

// Combinar condições
tool == "Bash" && tool_input.command matches "git push"
```

### Exemplos de hooks

```json
// Bloquear servidores de desenvolvimento fora do tmux
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"npm run dev\"",
  "hooks": [{"type": "command", "command": "echo 'Use tmux for dev servers' && exit 1"}],
  "description": "Ensure dev servers run in tmux"
}

// Formatar automaticamente depois de editar TypeScript
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\.tsx?$\"",
  "hooks": [{"type": "command", "command": "npx prettier --write \"$file_path\""}],
  "description": "Format TypeScript files after edit"
}

// Avisar antes de git push
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"git push\"",
  "hooks": [{"type": "command", "command": "echo '[Hook] Review changes before pushing'"}],
  "description": "Reminder to review before push"
}
```

### Checklist de hook

- [ ] O matcher é específico (não amplo demais)
- [ ] Traz mensagens de erro/informação claras
- [ ] Usa os códigos de saída corretos (`exit 1` bloqueia, `exit 0` permite)
- [ ] Testado a fundo
- [ ] Tem descrição

---

## Contribuindo com comandos

Comandos são ações que o usuário chama com `/command-name`.

### Local do arquivo

```
commands/your-command.md
```

### Modelo de comando

```markdown
---
description: Brief description shown in /help
---

# Command Name

## Purpose

What this command does.

## Usage

\`\`\`
/your-command [args]
\`\`\`

## Workflow

1. First step
2. Second step
3. Final step

## Output

What the user receives.
```

### Exemplos de comandos

| Comando | Propósito |
|---------|-----------|
| `commit.md` | Criar commits git |
| `code-review.md` | Revisar mudanças no código |
| `tdd.md` | Fluxo de TDD |
| `e2e.md` | Testes E2E |

---

## MCP e documentação (ex.: Context7)

Skills e agentes podem usar ferramentas **MCP (Model Context Protocol)** para
buscar dados atualizados em vez de depender só dos dados de treinamento. Isso
é especialmente útil para documentação.

- **Context7** é um servidor MCP que expõe `resolve-library-id` e `query-docs`.
  Use-o quando o usuário perguntar sobre bibliotecas, frameworks ou APIs, para
  que as respostas reflitam a documentação e os exemplos de código atuais.
- Ao contribuir com **skills** que dependem de documentação atual (ex.:
  configuração, uso de API), descreva como usar as ferramentas MCP relevantes
  (ex.: resolver o ID da biblioteca e depois consultar a documentação) e
  aponte para a skill `documentation-lookup` ou o Context7 como padrão.
- Ao contribuir com **agentes** que respondem perguntas sobre documentação/API,
  inclua os nomes das ferramentas MCP do Context7 (ex.:
  `mcp__context7__resolve-library-id`, `mcp__context7__query-docs`) nas
  ferramentas do agente e documente o fluxo resolver → consultar.
- **mcp-configs/mcp-servers.json** inclui uma entrada do Context7; os usuários
  a ativam no seu ambiente (ex.: Claude Code, Cursor) para usar a skill
  documentation-lookup (em `skills/research/documentation-lookup/`) e o
  comando `/docs`.

---

## Outros ambientes e traduções

### Subconjuntos de skills (Codex e Cursor)

O ECC distribui subconjuntos de skills para outros ambientes:

- **Codex:** `.agents/skills/`; as skills listadas em `agents/openai.yaml` são
  carregadas pelo Codex.
- **Cursor:** `.cursor/skills/`; um subconjunto de skills vem junto para o
  Cursor.

Quando você **adicionar uma skill nova** que deve estar disponível no Codex ou
no Cursor:

1. Adicione a skill em `skills/<department>/your-skill-name/` normalmente.
2. Se ela deve estar no **Codex**, adicione-a em `.agents/skills/` (copie a
   pasta da skill ou adicione uma referência) e garanta que ela esteja em
   `agents/openai.yaml`, se for o caso.
3. Se ela deve estar no **Cursor**, adicione-a em `.cursor/skills/` seguindo a
   estrutura do Cursor.

Veja as skills que já estão nessas pastas para conferir a estrutura esperada.
Manter esses subconjuntos em dia é manual; diga no PR se você os atualizou.

### Traduções

Os documentos da raiz (README, NOTICE, CONTRIBUTING, SECURITY,
TROUBLESHOOTING, CODE_OF_CONDUCT, COMMANDS-QUICK-REF e os três guias) têm
versões em português (`*.pt-BR.md`) e chinês (`*.zh-CN.md`) ao lado do
arquivo em inglês. Quando mudar um deles, atualize as traduções no mesmo PR ou
avise no PR que elas ainda precisam ser atualizadas. Tudo em `docs/`,
`skills/`, `agents/` e `commands/` é só em inglês.

---

## Envio de issues

Envie no máximo cinco issues em qualquer janela de 20 minutos e mantenha no
máximo dez issues abertas ao mesmo tempo. A [política de moderação de issues](.github/ISSUE_MODERATION.md)
(em inglês) explica as regras de fechamento automático, reabertura e alerta
aos mantenedores. As issues que já estavam abertas continuam abertas quando a
política entra em vigor.

## Processo de pull request

### Volume de envios

Envie no máximo cinco PRs em qualquer janela de 20 minutos. A moderação
automática fecha e bloqueia os PRs excedentes, inclusive rascunhos. Mais de
dez envios em 20 minutos disparam um alerta aos mantenedores e uma tentativa
de bloqueio da conta. PRs fechados continuam contando na janela. Quem tem
acesso de escrita ao repositório não passa pela moderação de rajadas. Os
mantenedores podem revisar exceções pelo alerta de moderação.

Mantenha também no máximo dez PRs abertos por vez. Quando você abre ou reabre
um PR acima desse limite, a automação fecha esse PR com um comentário
explicando a contagem. PRs que já estavam abertos antes desta atualização da
política continuam abertos, mesmo para quem tem mais de dez. Uma verificação
atrasada pode fechar PRs excedentes mais novos que já estejam abertos quando
ela rodar. O limite vale para todo mundo, inclusive os mantenedores. Consiga o
merge dos PRs ou feche os que não precisa mais e depois reabra.
Dez PRs abertos é mais do que qualquer revisor consegue acompanhar; assim o
tempo de revisão vai para o trabalho que mais importa para você.

Veja o [runbook de moderação](.github/PR_MODERATION.md) (em inglês) para
ativação, requisitos de credenciais e recuperação.

### 1. Formato do título do PR

```
feat(skills): add rust-patterns skill
feat(agents): add api-designer agent
feat(hooks): add auto-format hook
fix(skills): update React patterns
docs: improve contributing guide
```

### 2. Descrição do PR

```markdown
## Summary
What you're adding and why.

## Type
- [ ] Skill
- [ ] Agent
- [ ] Hook
- [ ] Command

## Testing
How you tested this.

## Checklist
- [ ] Follows format guidelines
- [ ] Tested with Claude Code
- [ ] No sensitive info (API keys, paths)
- [ ] Clear descriptions
```

### 3. Antes de enviar (para não quebrar o CI)

Rode `npm test` localmente. É a mesma bateria que o CI roda e pega quase tudo
o que está abaixo.

- **Mudou o `package.json`?** Se mexeu em `bin`, `files` ou dependências, rode
  `yarn install --mode=update-lockfile` e faça commit da mudança no
  `yarn.lock`. Em PRs públicos o CI roda o Yarn em modo endurecido e falha se
  o lockfile tiver que mudar; um `yarn.lock` desatualizado quebra o build
  sozinho.
- **Adicionou uma skill, comando, agente, hook ou ferramenta de CLI?** Ligue
  tudo o que ela precisa:
  - `package.json` (`bin` e `files`), `manifests/install-components.json`,
    `manifests/install-modules.json` e `agent.yaml`
  - Regenere o catálogo (`npm run catalog:sync`) e o registro de comandos
    (`npm run command-registry:write`)
  - Atualize as tabelas da documentação (`README.md`, `COMMANDS-QUICK-REF.md`,
    `docs/COMMAND-AGENT-MAP.md`)
  - Caminho de script novo? Adicione-o à lista de publicação permitida
    (`tests/scripts/npm-publish-surface.test.js`)
  - Outros ambientes: para o Codex, adicione `.agents/skills/<name>/` e
    `agents/openai.yaml`. O validador de frontmatter do Codex só aceita
    `name`, `description`, `metadata`, `license` e `allowed-tools`, então tire
    chaves como `version` dessa cópia.

### 4. Processo de revisão

1. Os mantenedores revisam em até 48 horas
2. Responda ao feedback, se pedido
3. Depois de aprovado, é feito o merge no main

---

## Releases

As releases saem com frequência regular, mais ou menos a cada duas semanas,
além de correções fora do ciclo para problemas de segurança ou perda de dados.

1. Sincronize a versão em todos os lugares: `VERSION`, `package.json` e (via
   `node scripts/build-pi-core.js`) `pi/core/package.json`.
2. Atualize o `CHANGELOG.md` e escreva as notas de release revisadas em
   `docs/releases/<version>/release-notes.md` (exigidas pelo workflow de
   release).
3. Crie a tag `vX.Y.Z` no `main` e envie a tag. O workflow `release.yml`
   confirma que a tag está exatamente em `origin/main`, verifica a
   sincronização de VERSION/pi/core, testa o artefato empacotado exato em
   Linux, macOS e Windows, publica no npm com proveniência, verifica os bytes
   no registro e cria a GitHub Release a partir das notas revisadas.

Tags e GitHub Releases não mudam depois de publicadas: quem empacota o projeto
consulta `/releases`, baixa `archive/refs/tags/vX.Y.Z.tar.gz` e fixa o sha256
dele. Nunca mova nem refaça a tag de uma versão publicada; publique uma nova
versão de correção.

---

## Diretrizes

### Faça
- Mantenha as contribuições focadas e modulares
- Inclua descrições claras
- Teste antes de enviar
- Siga os padrões existentes
- Documente as dependências

### Não faça
- Incluir dados sensíveis (chaves de API, tokens, caminhos)
- Adicionar configurações complexas demais ou muito de nicho
- Enviar contribuições não testadas
- Duplicar funcionalidades que já existem

---

## Nomes de arquivos

- Use minúsculas com hífens: `python-reviewer.md`
- Seja descritivo: `tdd-workflow.md`, não `workflow.md`
- O nome deve bater com o nome do arquivo

---

## Dúvidas?

- **Issues:** [github.com/affaan-m/ECC/issues](https://github.com/affaan-m/ECC/issues)
- **X/Twitter:** [@affaanmustafa](https://x.com/affaanmustafa)

---

Obrigado por contribuir! Vamos construir juntos um ótimo recurso.
