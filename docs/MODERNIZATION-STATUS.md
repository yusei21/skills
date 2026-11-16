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
  subpastas: assim o plugin `ecc` lista só o núcleo e cada `ecc-<departamento>`
  traz o resto. Medido com `claude plugin details`: ~33.800 tokens fixos por
  sessão no ECC original, ~9.500 no `ecc` novo.
- **Instalação continua plana.** O instalador remove o nível do departamento no
  destino (`skills/<skill>/`), em `scripts/lib/install-targets/helpers.js`.
  Código de runtime que procura uma skill usa `scripts/lib/skill-layout.js`,
  que aceita os dois layouts. O `pi/core` também é plano: `build-pi-core.js`
  reescreve os links relativos ao copiar.
- **Rust:** edition 2024, MSRV 1.85 (`rust-version`), toolchain fixada em 1.99
  (`ecc2/rust-toolchain.toml`). Clippy no nível padrão (`all`); o `pedantic`
  gera milhares de avisos neste crate de 55 mil linhas e ficou de fora.
- **Python:** uv. `[dependency-groups] dev`, backend `uv_build`, `uv.lock`,
  `.python-version` 3.14, mínimo 3.11. O ruff só olha `src/` e `tests/`: o
  ruff 0.16 também formata blocos Python dentro de Markdown e scripts das skills.
- **Fora do escopo por pedido:** renomear ECC, trazer as skills do repositório
  Harnesses (só a ideia), traduções e patrocínios (removidos).

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
- README novo; traduções, `SPONSORS.md`, `SPONSORING.md` e assets de
  patrocínio removidos; `--locale` do instalador desativado com mensagem clara.
- **Testes:** as 6 suítes que falhavam foram corrigidas. O
  `audit-closed-references` não dependia de rede: uma data fixa tinha saído da
  janela de 30 dias.
- **Rust (`ecc2/`):** edition 2024, `[lints]`, `cargo fix`/`clippy --fix`/`fmt`.
  Os testes que mudam `HOME`/`PATH` usam uma trava comum; os repositórios de
  teste usam `git init -b main`. Comando novo `ecc skills suggest "<tarefa>"`
  (ver `ecc2/README.md`).
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
- **Tipagem:** `scripts/lib/utils.js` em `strict`, sem o `utils.d.ts`.
- **Publicado** em `github.com/yusei21/skills` (`main`, 16/11/2026). Os 96
  commits do projeto anterior (coleção de skills derivada do ECC, até
  `22151ba`) continuam no histórico; o commit "restart from ECC upstream"
  troca o conteúdo pelo ECC original e a modernização vem depois. Skills que
  só existiam no projeto anterior estão no histórico (`git show 22151ba:skills/`).
- `node scripts/dev/generate-skill-triggers.js --keep-triggers` atualiza o
  `registryDigest` sem chamar modelo. Use depois de editar skills sem mudar a
  `description`; com descrição nova ou skill nova, rode a geração completa.

## Falta, em ordem

1. **Gatilhos das skills.** Só 46 de 326 skills têm frases de gatilho; o
   `skills suggest` usa nome e descrição para as outras. A geração completa
   precisa de `CLAUDE_CODE_OAUTH_TOKEN` (crie com `claude setup-token`) e roda
   `node scripts/dev/generate-skill-triggers.js --provider claude`.
2. **Varredura das skills, segunda passada.** A primeira cobriu versões de
   actions, runtimes e IDs de modelo. Faltam APIs de bibliotecas por domínio
   (React/Next, ORMs, SDKs de nuvem), skill por skill.
3. **Tipagem gradual, próximos módulos.** `utils.js` já está em strict; os
   próximos são `session-manager.js` e `session-aliases.js` (ainda com `.d.ts`
   escrito à mão).

## Limitações conhecidas

- `dmux-workflows`, `autonomous-loops` e `skill-host-compat` chamam scripts via
  `$CLAUDE_PLUGIN_ROOT/scripts/`. Num plugin de departamento essa raiz é a pasta
  do departamento; os snippets já mostram erro e pedem o caminho de um checkout.
- Usar `ecc-all-departments` **ou** plugins individuais, nunca os dois.
- `.agents/skills/` (cópias para Codex) e `.cursor/skills/` continuam planos.
- O job de Yarn no CI usa Corepack, que o Node 25+ não traz mais; por isso as
  linhas de gerenciador de pacotes da matriz ficam no Node 24.
- O `ecc-tui` ainda tem ~20 avisos de código morto (`dead_code`) do upstream.

## Como verificar

```bash
npm ci && npm test        # validadores + suíte JS
npm run typecheck
npm run lint
uv sync && uv run pytest && uv run ruff check && uv run mypy src
(cd ecc2 && cargo fmt --check && cargo clippy --all-targets && cargo test)
claude plugin validate .
```

## Último resultado

Sessão de 16/11/2026 (tarde), commit final no branch `modernize-2026`:

- `npm test`: 9216 testes em 453 arquivos; a única falha da última rodada completa (`build-pi-core.test.js`) foi corrigida e o arquivo passa sozinho, com os validadores verdes
- `npm run lint`: 0 erros (198 avisos de complexidade e `prefer-const`, herdados); `npm run typecheck`: ok.
- Python: 639 passaram, 3 pulados; ruff e mypy limpos.
- Rust: 516 passaram, 1 ignorado; fmt e clippy sem erros.
