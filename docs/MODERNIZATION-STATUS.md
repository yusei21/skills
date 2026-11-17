# Status da modernização

Documento de passagem: o que foi feito neste fork, as decisões tomadas e o que
falta, em ordem. Atualize ao terminar cada item.

## Decisões

- **TypeScript sem mudar o runtime.** Hooks rodam no `node` de quem instala e o
  Node não remove tipos de arquivos em `node_modules`, então o código continua
  `.js` CommonJS. A tipagem vem de JSDoc checado pelo TypeScript 7
  (`npm run typecheck`); um arquivo entra no modo `strict` com `// @ts-check`.
- **TypeScript 7 + ponte 6.** O TS 7 (compilador nativo) não tem API JS. Quem
  usa a API (`ts.createSourceFile`, `transpileModule`) importa
  `@typescript/typescript6`. O pacote da ponte também instala um binário `tsc`,
  por isso `npm run typecheck` chama `node_modules/typescript/bin/tsc`.
- **Skills por departamento.** `skills/<departamento>/<skill>/`. O Claude Code
  carrega todo `skills/<skill>/SKILL.md` na raiz de um plugin e não entra em
  subpastas: assim o plugin `yus` lista só o núcleo e cada `yus-<departamento>`
  traz o resto. Medido com `claude plugin details`: ~33.800 tokens fixos por
  sessão no yus original, ~9.500 no `yus` novo.
- **Instalação continua plana.** O instalador remove o nível do departamento no
  destino (`skills/<skill>/`), em `scripts/lib/install-targets/helpers.js`.
  Código de runtime que procura uma skill usa `scripts/lib/skill-layout.js`,
  que aceita os dois layouts. O `pi/core` também é plano: `build-pi-core.js`
  reescreve os links relativos ao copiar.
- **Rust:** edition 2024, MSRV 1.85 (`rust-version`), toolchain fixada em 1.99
  (`yus2/rust-toolchain.toml`). Clippy no nível padrão (`all`); o `pedantic`
  gera milhares de avisos neste crate de 55 mil linhas e ficou de fora.
- **Python:** uv. `[dependency-groups] dev`, backend `uv_build`, `uv.lock`,
  `.python-version` 3.14, mínimo 3.11. O ruff só olha `src/` e `tests/`: o
  ruff 0.16 também formata blocos Python dentro de Markdown e scripts das skills.
- **Fora do escopo por pedido:** trazer as skills do repositório Harnesses (só
  a ideia) e patrocínios (removidos). A renomeação de ECC para yus, de início
  fora do escopo, foi feita depois a pedido (ver abaixo).
- **Runtime continua Node, não Bun.** Os hooks rodam no `node` de quem instala,
  e a suíte depende de `node:test` e do `c8`. O Bun segue suportado como
  gerenciador de pacotes dos projetos dos usuários e tem linhas próprias no CI.
- **Yarn 4 é o gerenciador do repositório** (`packageManager`;
  `.claude/package-manager.json` também diz `yarn`). npm, pnpm e bun rodam no CI
  como linhas de compatibilidade.

## Feito

- Node 22.12+ (`engines`), `.tool-versions` com Node 26 LTS e Python 3.14.
- TypeScript 7.0.2, ESLint 10.15, `@eslint/js` 10, c8 12, Yarn 4.18.1
  (`yarn.lock` regenerado; **não rode `npm install` sem depois regenerar o
  `yarn.lock` com Yarn**: o npm reescreve o arquivo no formato v1).
- Piloto tipado: `scripts/lib/package-manager.js` (strict), com dois bugs
  corrigidos: chaves herdadas (`toString`, `constructor`) aceitas como gerenciador
  de pacotes, e `\n` aceito nos argumentos de `getExecCommand` (injeção de comando).
- Testes do piloto migrados para `node:test`; `tests/run-all.js` conta o resumo
  do `node:test`; codemod `scripts/dev/migrate-test-to-node-test.js`.
- 18 departamentos (`manifests/skill-departments.json`), 19 plugins gerados por
  `npm run departments:sync` e checados por `npm run departments:check`.
- Skills novas (revisadas, commit fixado, licença ao lado):
  `web-design-guidelines`, `agent-desktop`, `untangle-codebase`, `ponytail*`,
  `graphify`, `taste-skill` (ponte), `design-md-library` (ponte). Ficam fora do
  `pi/core` (motivo em `manifests/pi-core.json`).
- README novo; `SPONSORS.md`, `SPONSORING.md` e assets de patrocínio
  removidos. As traduções antigas também saíram e o `--locale` do instalador
  foi desativado com mensagem clara; os documentos da raiz voltaram depois em
  en, pt-BR e zh-CN, mantidos juntos.
- **Testes:** as 6 suítes que falhavam foram corrigidas. O
  `audit-closed-references` não dependia de rede: uma data fixa tinha saído da
  janela de 30 dias.
- **Rust (`yus2/`):** edition 2024, `[lints]`, `cargo fix`/`clippy --fix`/`fmt`.
  Os testes que mudam `HOME`/`PATH` usam uma trava comum; os repositórios de
  teste usam `git init -b main`. Comando novo `yus skills suggest "<tarefa>"`
  (ver `yus2/README.md`).
- **Python (`src/llm/`):** migrado para uv. Três testes ainda apontavam para
  caminhos de skills antigos, escondidos por um erro de coleta.
- **CI:** matriz Node 22/24/26, jobs fixos em 24, `typecheck` e
  `departments:check` no job de validação, job de Rust, job de Python com
  `astral-sh/setup-uv` (SHA fixado) em 3.11 e 3.14.
- **ESLint 10:** `preserve-caught-error` (63) e `no-useless-assignment` (24)
  corrigidas e de volta a `error`. A segunda fica desligada só para os cenários
  de avaliação, que são copiados literalmente para os corpora.
- **pi/core:** o build voltou a passar (allowlist com caminho plano e as 12
  skills novas classificadas).
- **Varredura das skills:** exemplos de CI com actions atuais (`checkout@v7`,
  `setup-node@v7`, `setup-python@v7`, `setup-java@v6`, `setup-go@v7`,
  `cache@v6`, `upload-artifact@v7`), Node 24, Go 1.27; IDs de modelo
  `claude-haiku-5-5` / `claude-sonnet-5-5` e tabela de preços atualizada.
- **node:test:** mais 48 suítes convertidas pelo codemod (mesma contagem de
  testes antes e depois).
- **Tipagem:** `scripts/lib/utils.js`, `session-aliases.js` e
  `session-manager.js` em `strict`, sem os `.d.ts` escritos à mão. O
  `errorField` do `utils.js` é exportado para ler erros capturados sem supor
  `Error`. O `SessionMetadata` agora inclui `project`, `branch` e `worktree`,
  que o código já devolvia e o `.d.ts` antigo omitia.
- **Publicado** em `github.com/yusei21/yus` (`main`, 16/11/2026; o repositório
  se chamava `yusei21/skills`). Os 96
  commits do projeto anterior (coleção de skills derivada do ECC, até
  `22151ba`) continuam no histórico; o commit "restart from ECC upstream"
  (`6528cd7`) troca o conteúdo pelo ECC original e a modernização vem depois. Skills que
  só existiam no projeto anterior estão no histórico (`git show 22151ba:skills/`).
- **Renomeado de ECC para yus** em todo o projeto: plugins (`yus@yus`,
  `yus-<departamento>`), comando `yus`, variáveis `YUS_*`, pastas, arquivos
  (`scripts/yus.js`, `yus2/`), skills (`yus-guide`, `configure-yus`) e textos
  (sempre em minúsculas). Ficaram como estão: `LICENSE`, a atribuição no
  `NOTICE`, os três guias assinados por Affaan Mustafa, produtos de terceiros
  (app ECC Tools, `ecc.tools`, `ecc-agentshield`), nomes legados como
  `everything-claude-code` e fixtures com bytes históricos verificados por
  sha256.
- **Ideias do `deepseek-ai/dsh-superagent-prototype`** (MIT, commit
  `8c32a9d`), reescritas para qualquer agente: skills `pr-review-threads`
  (operations; responder review de humanos e bots thread a thread, no máximo
  3 rodadas por bot) e `human-attention-budget` (ai-agents; falar só quando
  alguém precisa agir, parar por impacto e não por esforço), e a seção
  antes/depois para mudanças de UI na `verification-loop`. Crédito no NOTICE
  e licença ao lado. O runtime deles (orquestrador, Feishu, painel) depende da
  plataforma DeepSeek Harness e ficou de fora. Também veio de lá a ideia do
  orçamento de contexto (abaixo).
- **Orçamento de contexto do plugin `yus`:**
  `scripts/ci/check-core-context-budget.js` soma nome e descrição das skills
  do núcleo, dos comandos e dos agentes, o que toda sessão lê, e falha se uma
  categoria passar do limite (~5% acima da base: 6154/14731/15986 caracteres,
  ~9.200 tokens no total). Roda no `npm test`; `npm run context-budget:check`
  mostra os itens maiores. Baixe o limite quando o texto encolher.
- **Gatilhos:** as 328 skills têm frases de gatilho (3721), geradas com
  `claude-sonnet-5-5`. O gerador agora mostra o motivo da falha do `claude`,
  não apaga gatilhos existentes quando uma chamada falha e aceita `--missing`
  para retomar só as skills sem gatilhos (útil quando o limite de uso acaba
  no meio). O token deve ficar numa linha só: uma quebra de linha no meio dá
  "Invalid auth token".
  Seis skills tiveram as frases revisadas à mão depois da geração
  (`santa-method`, `ai-regression-testing`, `accessibility`, `ui-demo`,
  `ralphinho-rfc-pipeline`, `security-review`): frases com palavras genéricas
  ("two", "same", "make", "test", "pass") faziam a seleção automática escolher
  a skill errada. Uma geração completa nova desfaz isso; rode os testes
  `tests/lib/context-selection.test.js` e `context-routing-index.test.js`
  depois e corrija as frases que eles apontarem.
- **Hooks que bloqueiam sem ler o stdin:** quando um hook sai antes de ler toda
  a entrada, o `spawnSync` acusa `EPIPE` mesmo com o código de saída
  disponível. Os executores (`run-with-flags`, os dois bootstraps e o wrapper
  do InsAIts) tratavam isso como falha: um `exit 2` (bloquear) virava 0 ou 1
  e a ação passava. `scripts/lib/spawn-result.js` concentra a regra. Achado
  por um teste intermitente no macOS. No Windows o mesmo caso chega como
  `EOF`, não `EPIPE` (`ad0c1c2`); os dois são aceitos, confirmado pelo job
  Windows full do CI.
- **`plan-canvas stop` no Windows:** o CLI e o servidor apagavam o
  `server.json` ao mesmo tempo, e o segundo recebia `EPERM` (arquivo pendente
  de exclusão). O `stop` devolvia um erro e o servidor às vezes não saía.
  A remoção agora é tolerante a falhas nos dois lados.
- **CI consertado (17/11):** `yarn.lock` regenerado, caminhos planos no teste
  do pacote, resumo TAP do Node 22 contado pelo `run-all`, limites de tempo
  ajustados para cobertura e runners lentos, caminho do Dependabot.
- **Varredura das skills de nuvem, JVM e mobile (17/11):** a `security-review`
  (única com código de SDK de nuvem) usa o cliente modular do AWS SDK v3
  (`send(new ...Command())`; o exemplo do CloudWatch nem compilava), regras de
  security group como recursos separados, Block Public Access e
  `BucketOwnerEnforced` no S3, `id-token: write` para OIDC e actions fixadas
  por SHA (o exemplo usava `trufflehog@main`). Spring: `@MockitoBean` no lugar
  de `@MockBean` (removido no Boot 4), `@ServiceConnection` e Testcontainers 2.
  Quarkus: `quarkus-rest` e `@WithTestResource`. Exposed 1.6 (pacotes
  `org.jetbrains.exposed.v1`), Ktor 3.6, Flyway 13, HikariCP 7 e o resto das
  versões pelo Maven Central. Riverpod 3 (`.value` em vez de `valueOrNull`,
  provider sem o sufixo `Notifier`). Postgres 14 (fim de vida em 11/2026)
  trocado por 18 no exemplo de CI do Django. As skills de Swift/iOS 26, Compose
  e React Native já estavam em dia.
- **Tipagem:** `atomic-write.js` e `install/claude-settings-lock.js` em
  `strict`. O `runWithSettingsLock` não quebra mais quando o callback lança um
  valor que não é objeto e o lock também falha ao liberar.
- `node scripts/dev/generate-skill-triggers.js --keep-triggers` atualiza o
  `registryDigest` sem chamar modelo. Use depois de editar skills sem mudar a
  `description`; com descrição nova ou skill nova, rode a geração completa.

## Falta, em ordem

Os itens da lista original estão feitos. O que sobra é opcional:

1. **Tipagem gradual, quando valer a pena.** Em strict: `package-manager.js`,
   `utils.js`, `session-manager.js`, `session-aliases.js`, `atomic-write.js` e
   `install/claude-settings-lock.js`. Os próximos naturais são os que usam o
   lock (`install/claude-settings.js`, `claude-plugin-setup.js`).
2. **Versões fixadas nas skills envelhecem.** Repita a busca por versões e APIs
   obsoletas a cada poucos meses; as versões Maven saem de
   `repo1.maven.org/maven2/<grupo>/<artefato>/maven-metadata.xml` (o índice de
   busca do Maven Central fica meses atrasado).

## Limitações conhecidas

- `dmux-workflows`, `autonomous-loops` e `skill-host-compat` chamam scripts via
  `$CLAUDE_PLUGIN_ROOT/scripts/`. Num plugin de departamento essa raiz é a pasta
  do departamento; os snippets já mostram erro e pedem o caminho de um checkout.
- Usar `yus-all-departments` **ou** plugins individuais, nunca os dois.
- `.agents/skills/` (cópias para Codex) e `.cursor/skills/` continuam planos.
- O job de Yarn no CI usa Corepack, que o Node 25+ não traz mais; por isso as
  linhas de gerenciador de pacotes da matriz ficam no Node 24.
- O `yus-tui` ainda tem ~20 avisos de código morto (`dead_code`) do upstream.

## Como verificar

```bash
npm ci && npm test        # validadores + suíte JS
npm run typecheck
npm run lint
uv sync && uv run pytest && uv run ruff check && uv run mypy src
(cd yus2 && cargo fmt --check && cargo clippy --all-targets && cargo test)
claude plugin validate .
```

## Último resultado

Sessão de 17/11/2026 (fim de tarde), varredura de nuvem/JVM/mobile e tipagem
de `atomic-write` e `claude-settings-lock`:

- `npm test`: 9295 testes em 455 arquivos, 0 falhas; `npm run typecheck`: ok;
  ESLint: 0 erros; markdownlint: ok; `build-pi-core.js --check`: ok.
- CI do `ad0c1c2` (run `44109809052`): tudo verde, inclusive o Windows full,
  menos dois jobs do macOS cancelados sem runner (falta de máquina no GitHub).
- Por isso o CI tirou as lanes `pnpm` e `yarn` do macOS (cobertas no Linux e
  no Windows). No macOS ficam `npm full`, `bun` e o `Packed Install`.

Rodada anterior:

Sessão de 16/11/2026 (noite), tipagem dos módulos de sessão:

- `npm test`: 9280 testes em 453 arquivos, 0 falhas (também depois das skills do dsh-superagent; 328 skills).
- `npm run typecheck`: ok; ESLint nos três arquivos alterados: 0 erros.

Rodada anterior:

Sessão de 16/11/2026 (tarde), commit final no branch `modernize-2026`:

- `npm test`: 9216 testes em 453 arquivos; a única falha da última rodada completa (`build-pi-core.test.js`) foi corrigida e o arquivo passa sozinho, com os validadores verdes
- `npm run lint`: 0 erros (198 avisos de complexidade e `prefer-const`, herdados); `npm run typecheck`: ok.
- Python: 639 passaram, 3 pulados; ruff e mypy limpos.
- Rust: 516 passaram, 1 ignorado; fmt e clippy sem erros.
