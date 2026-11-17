# ECC

[English](README.md) | **Português** | [中文](README.zh-CN.md)

Agentes, skills, hooks, regras e comandos de barra para o Claude Code e outros
ambientes de agentes de código (Codex, Cursor, OpenCode, Gemini, Kimi e
outros).

Acesso a 71 agentes, 326 skills e 98 shims de comandos legados, além de hooks,
regras, memória e fluxos de aprendizado contínuo.

| Recurso | Quantidade | O que é |
|---------|------------|---------|
| Agentes | 71 | Subagentes para planejamento, revisão, correção de build, segurança e trabalho de domínio |
| Comandos | 98 | Shims de comandos de barra que encaminham para agentes e skills |
| Skills | 326 | Fluxos de trabalho e conhecimento de domínio, agrupados em 18 departamentos |

## Instalar no Claude Code

Adicione este repositório como marketplace e instale o plugin principal.
Quem quiser usar os plugins roda isto no próprio Claude Code:

```text
/plugin marketplace add yusei21/skills
/plugin install ecc@ecc
```

O `ecc` traz o runtime (agentes, comandos, hooks, configurações de MCP) e só o
departamento **core**. Adicione os departamentos em que você trabalha:

```text
/plugin install ecc-frontend@ecc
/plugin install ecc-backend@ecc
```

Ou instale todos os departamentos de uma vez com `ecc-all-departments@ecc`. Use
os departamentos individuais ou o `ecc-all-departments`, nunca os dois: eles
listam as mesmas skills.

Os comandos do plugin levam o nome do plugin como prefixo, por exemplo
`/ecc:plan`. O plugin e o instalador abaixo são alternativas: depois do
`/plugin install`, não rode o instalador completo (`--profile full`) por cima,
senão cada skill e cada hook ficam instalados duas vezes.

### Por que departamentos

O Claude Code coloca o nome e a descrição de cada skill instalada em toda
sessão. Medido com `claude plugin details`:

| Configuração | Contexto sempre carregado |
|--------------|---------------------------|
| ECC original (todas as skills num plugin) | ~33.800 tokens |
| `ecc` (runtime + core) | ~9.500 tokens |
| `ecc` + `ecc-frontend` | ~11.400 tokens |
| `ecc` + `ecc-all-departments` | ~36.700 tokens |

### Departamentos

| Plugin | Departamento | Skills | Escopo |
|--------|--------------|--------|--------|
| `ecc` | Engenharia básica | 18 | TDD, verificação, git, padrões de código, gestão de contexto |
| `ecc-frontend` | Frontend e design | 23 | Interfaces web, design systems, acessibilidade, animação, frameworks de UI |
| `ecc-backend` | Backend e APIs | 29 | Arquitetura de serviços, contratos de API, frameworks de servidor |
| `ecc-languages` | Linguagens | 18 | Idiomas e testes de cada linguagem |
| `ecc-mobile` | Mobile e Apple | 12 | Android, iOS/Swift, Flutter, React Native |
| `ecc-data` | Dados e bancos de dados | 9 | SQL, ORMs, cache, análise, movimentação de dados |
| `ecc-ai-agents` | IA e agentes | 41 | Arquitetura de agentes, orquestração, prompts, custo de LLM, uso do computador |
| `ecc-ml` | Machine learning | 5 | Treinamento, avaliação e adoção de modelos |
| `ecc-quality` | Qualidade, testes e desempenho | 24 | E2E, evals, benchmarks, auditorias, revisão de código mínimo |
| `ecc-security` | Segurança | 10 | Revisão de segurança, varredura, proteção de agentes |
| `ecc-devops` | DevOps e infraestrutura | 18 | Containers, deploy, ambientes, redes |
| `ecc-docs-product` | Documentação, produto e conhecimento | 12 | Governança de documentação, decisões, planejamento de produto, grafos de código |
| `ecc-research` | Pesquisa | 10 | Pesquisa aprofundada, busca, OSINT, bases científicas |
| `ecc-business` | Negócios, conteúdo e marketing | 17 | Escrita, marca, SEO, pesquisa de mercado, redes sociais |
| `ecc-media` | Mídia e vídeo | 11 | Geração e edição de vídeo |
| `ecc-operations` | Operações e integrações | 20 | E-mail, cobrança, GitHub, Jira, Google Workspace |
| `ecc-verticals` | Setores específicos | 25 | Saúde, cadeia de suprimentos, web3, mercados de previsão |
| `ecc-admin` | Administração do ECC | 24 | Configuração, aprendizado contínuo, memória, custo, manutenção de skills |

A taxonomia fica em [`manifests/skill-departments.json`](manifests/skill-departments.json).

## Instalar sem o plugin

O instalador seletivo copia os módulos escolhidos para as pastas de cada
ambiente (`~/.claude`, `~/.codex`, `.cursor` e outras). As skills instaladas
ficam sempre planas (`skills/<skill>/`), qualquer que seja a estrutura de
origem.

```bash
node scripts/ecc.js setup                      # configuração guiada do Claude Code
node scripts/ecc.js install --profile developer
node scripts/ecc.js catalog                    # lista perfis e componentes
node scripts/ecc.js doctor                     # verifica uma instalação existente
```

Para copiar uma skill à mão, copie a pasta dela direto em `~/.claude/skills/`,
por exemplo `cp -r skills/core/tdd-workflow ~/.claude/skills/`. O Claude Code
não procura dentro de subpastas ali.

## Estrutura do repositório

```text
|-- agents/    # subagentes especializados
|-- commands/  # shims de comandos de barra
|-- skills/    # fluxos reutilizáveis carregados sob demanda
|   |-- core/            uma pasta por departamento,
|   |-- frontend/        uma pasta por skill dentro dela:
|   `-- ...              skills/<departamento>/<skill>/SKILL.md
|-- hooks/       definições de hooks para cada ambiente
|-- rules/       diretrizes sempre ativas
|-- manifests/   módulos de instalação, perfis, componentes, departamentos
|-- scripts/     runtime Node.js: hooks, instalador, validadores de CI
|-- ecc2/        TUI e painel de controle em Rust
|-- src/llm/     pacote Python de abstração de provedores
`-- tests/       suítes de testes em Node.js e Python
```

## Desenvolvimento

Requisitos: Node.js 22.12 ou mais novo (recomendado: Node 26 LTS) e Git. Rust
e Python só são necessários para `ecc2/` e `src/llm/`.

```bash
npm ci
npm test            # validadores + suíte JS completa
npm run typecheck   # TypeScript 7 nos arquivos marcados com // @ts-check
npm run lint
```

- O código de runtime continua em `.js` CommonJS, porque os hooks rodam no
  `node` que o usuário tiver instalado. A checagem de tipos vem de JSDoc
  verificado pelo TypeScript: adicione `// @ts-check` a um arquivo para
  submetê-lo ao modo `strict`.
- Testes novos usam `node:test`. O `scripts/dev/migrate-test-to-node-test.js`
  converte as suítes antigas.
- Para adicionar uma skill: crie `skills/<departamento>/<skill>/SKILL.md`,
  liste-a em `manifests/skill-departments.json` e num módulo de instalação e
  rode `node scripts/ci/generate-department-plugins.js --write`.

## Licença

MIT; veja [LICENSE](LICENSE). A origem, a atribuição e as licenças das skills
de terceiros estão em [NOTICE.pt-BR.md](NOTICE.pt-BR.md).
