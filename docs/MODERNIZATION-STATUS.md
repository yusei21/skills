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
  que aceita os dois layouts.
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
  `graphify`, `taste-skill` (ponte), `design-md-library` (ponte).
- README novo; traduções, `SPONSORS.md`, `SPONSORING.md` e assets de
  patrocínio removidos; `--locale` do instalador desativado com mensagem clara.

## Falta, em ordem

1. **Enviar para `github.com/yusei21/skills`.** Esse repositório já tem outro
   projeto em `main`; o trabalho daqui vai num branch separado,
   `ecc-modernized`, sem histórico comum. Falta autenticar: a chave SSH local
   não está cadastrada no GitHub. Depois de autenticar:
   `git push yusei ecc-modernized`.
2. **Testes restantes.** Ver a seção "Último resultado" abaixo.
3. **Rust (`ecc2/`).** `edition = "2024"`, `rust-version`, `rust-toolchain.toml`
   para 1.99, tabela `[lints]` (clippy pedantic com exceções) e
   `cargo fmt`/`clippy --fix`. Depois, o comando `ecc skills suggest "<tarefa>"`
   (ideia do Harnesses): lê `manifests/skill-departments.json` e
   `manifests/context-packs/skill-triggers@1.json`, pontua gatilhos e recomenda
   quais plugins `ecc-<departamento>` instalar.
4. **Python (`src/llm/`).** `[dependency-groups]` no lugar de
   `[project.optional-dependencies] dev`, `uv.lock`, `ruff format` (28 arquivos a
   formatar), backend `uv_build`. Linha de base: 600 testes passando, ruff e
   mypy limpos.
5. **CI (`.github/workflows/`).** Matriz Node 18/20/22 → 22/24/26; jobs fixos em
   `20.x` → `24.x`; adicionar `npm run typecheck` e `npm run departments:check`;
   job de Rust (não existe); job de Python com `astral-sh/setup-uv`.
6. **ESLint 10.** `preserve-caught-error` (63) e `no-useless-assignment` (35)
   estão como `warn` em `eslint.config.js`; corrigir e voltar para `error`.
7. **Varredura das skills.** Procurar versões e APIs desatualizadas (Node 18/20,
   React/Next antigos, comandos obsoletos), começando por `core`, `frontend` e
   `backend`.
8. **Migração para `node:test`.** 48 arquivos convertíveis pelo codemod
   (validado: 46 com resultado idêntico, 2 que antes não imprimiam contagem).
9. **Tipagem gradual.** Próximo candidato: `scripts/lib/utils.js` (ainda usa
   `scripts/lib/utils.d.ts` escrito à mão).

## Limitações conhecidas

- `dmux-workflows`, `autonomous-loops` e `skill-host-compat` chamam scripts via
  `$CLAUDE_PLUGIN_ROOT/scripts/`. Num plugin de departamento essa raiz é a pasta
  do departamento; os snippets já mostram erro e pedem o caminho de um checkout.
- Usar `ecc-all-departments` **ou** plugins individuais, nunca os dois.
- `.agents/skills/` (cópias para Codex) e `.cursor/skills/` continuam planos.

## Como verificar

```bash
npm ci && npm test        # validadores + suíte JS
npm run typecheck
npm run lint
claude plugin validate .
```

## Último resultado

Preenchido ao final da sessão de 16/11/2026.
