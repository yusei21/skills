# Referência rápida de comandos

[English](COMMANDS-QUICK-REF.md) | **Português** | [中文](COMMANDS-QUICK-REF.zh-CN.md)

> 94 comandos de barra instalados globalmente. Digite `/` em qualquer sessão do Claude Code para usar.

---

## Fluxo principal

| Comando | O que faz |
|---------|-----------|
| `/plan` | Reformula os requisitos, avalia riscos e escreve um plano de implementação passo a passo; **espera sua confirmação antes de mexer no código** |
| `/plan-canvas` | Abre um plano ou artefato HTML no Plan Canvas do navegador para revisar com anotações e aprovar |
| `/plan-prd` | Gera um PRD enxuto, centrado no problema, e passa para o `/plan` planejar a implementação |
| `/feature-dev` | Desenvolvimento guiado de funcionalidades, com entendimento do código e foco em arquitetura |
| `/code-review` | Revisão de código: mudanças locais não commitadas ou um PR do GitHub (passe o número/URL do PR para o modo PR) |
| `/review-pr` | Revisão completa de PR usando agentes especializados |
| `/build-fix` | Detecta e corrige erros de build; delega automaticamente ao agente build-resolver certo |
| `/quality-gate` | Verificação de qualidade contra os padrões do projeto |
| `/santa-loop` | Ciclo adversarial de revisão dupla: dois revisores independentes (modelos diferentes) precisam aprovar antes de o código ser entregue |
| `/astra-review` | Envia código escrito pelo Claude ao GPT-6-Astra (ChatGPT, via Codex CLI) para uma revisão independente de outro provedor e depois corrige o que ele encontrar |

---

## Testes

| Comando | O que faz |
|---------|-----------|
| `/test-coverage` | Analisa a cobertura, identifica lacunas e gera os testes que faltam até a meta |
| `/go-test` | Fluxo de TDD para Go (orientado a tabelas, cobertura de 80%+ com `go test -cover`) |
| `/kotlin-test` | TDD para Kotlin (Kotest + Kover) |
| `/rust-test` | TDD para Rust (cargo test, `cargo-llvm-cov`) |
| `/cpp-test` | TDD para C++ (GoogleTest + gcov/lcov) |
| `/flutter-test` | Roda testes Flutter/Dart (unitários, de widget, golden, de integração), reporta e corrige falhas |
| `/react-test` | TDD para React (React Testing Library, Vitest ou Jest, metas de cobertura) |

---

## Revisão de código

| Comando | O que faz |
|---------|-----------|
| `/code-review` | Revisão de código: mudanças locais não commitadas ou um PR do GitHub (passe o número/URL do PR para o modo PR) |
| `/issue-review` | Revisão de issue do GitHub: confere o relato contra o código, encontra duplicatas e correções anteriores, define a gravidade e rascunha uma resposta (publicar é opcional) |
| `/python-review` | Python: PEP 8, type hints, segurança, padrões idiomáticos |
| `/go-review` | Go: padrões idiomáticos, segurança de concorrência, tratamento de erros |
| `/kotlin-review` | Kotlin: null safety, segurança de coroutines, arquitetura limpa |
| `/rust-review` | Rust: ownership, lifetimes, uso de unsafe |
| `/cpp-review` | C++: segurança de memória, idiomas modernos, concorrência |
| `/flutter-review` | Flutter/Dart: boas práticas de widgets, gestão de estado, acessibilidade, segurança |
| `/react-review` | React/JSX: uso correto de hooks, desempenho de renderização, fronteiras servidor/cliente, acessibilidade |
| `/vue-review` | Vue.js: uso correto da Composition API, reatividade, padrões de composables, segurança de templates, acessibilidade, desempenho |
| `/fastapi-review` | FastAPI: async correto, injeção de dependências, schemas Pydantic, segurança |

---

## Correção de builds

| Comando | O que faz |
|---------|-----------|
| `/build-fix` | Detecta e corrige erros de build; delega automaticamente ao agente build-resolver certo |
| `/go-build` | Corrige erros de build do Go e avisos do `go vet` |
| `/kotlin-build` | Corrige erros de compilação do Kotlin/Gradle |
| `/rust-build` | Corrige problemas de build e do borrow checker do Rust |
| `/cpp-build` | Corrige problemas de CMake e de linker em C++ |
| `/gradle-build` | Corrige erros de Gradle para Android / KMP |
| `/flutter-build` | Corrige erros do analisador Dart e falhas de build do Flutter |
| `/react-build` | Corrige falhas de build de React (Vite, webpack, Next.js, CRA, Parcel, esbuild, Bun) |

---

## Fluxos orquestrados de funcionalidades

| Comando | O que faz |
|---------|-----------|
| `/orch-add-feature` | Cria uma funcionalidade nova de ponta a ponta: pesquisa, plano, TDD, revisão, commit com aprovação |
| `/orch-build-mvp` | Monta um MVP funcional a partir de um documento de design/especificação: leitura, divisão em fatias, estrutura inicial, TDD, revisão, commit com aprovação |
| `/orch-change-feature` | Altera uma funcionalidade existente para o novo comportamento desejado: atualiza os testes para a nova especificação, muda a implementação, revisão, commit com aprovação |
| `/orch-fix-defect` | Corrige um bug: reproduz como um teste de regressão que falha, corrige até passar, revisão, commit com aprovação |
| `/orch-refine-code` | Refatoração que preserva o comportamento: confirma os testes verdes, reestrutura, mantém verdes, revisão, commit com aprovação |
| `/orch-review` | Roda o Workflow nativo orch-review sobre um diff (mudanças locais ou um PR do GitHub) e separa achados bloqueantes de sugestões |

---

## Fluxo PRP

| Comando | O que faz |
|---------|-----------|
| `/prp-prd` | Gerador interativo de PRD: centrado no problema, guiado por hipóteses, com perguntas de ida e volta |
| `/prp-plan` | Cria um plano completo de implementação, com análise do código e extração de padrões |
| `/prp-implement` | Executa um plano de implementação com ciclos rigorosos de validação |
| `/prp-commit` | Commit rápido, escolhendo os arquivos em linguagem natural |
| `/prp-pr` | Cria um PR no GitHub a partir do branch atual com commits ainda não enviados |

---

## Coordenação de épicos (nativa do GitHub)

| Comando | O que faz |
|---------|-----------|
| `/epic-decompose` | Divide um épico em tarefas filhas sem criar branches para elas |
| `/epic-validate` | Valida se o épico está pronto, suas dependências e a política de coordenação |
| `/epic-claim` | Assume uma issue de épico, registra o estado de coordenação e sincroniza a posse local |
| `/epic-sync` | Sincroniza corpo, labels e snapshots locais de coordenação das issues de épico a partir do GitHub |
| `/epic-review` | Marca a revisão do épico como pedida, aprovada ou com mudanças pedidas |
| `/epic-publish` | Publica uma atualização validada do épico de volta na issue e no cache local |
| `/epic-unblock` | Varre as issues de épico bloqueadas e reabre as que tiverem todas as dependências fechadas |

---

## Planejamento e arquitetura

| Comando | O que faz |
|---------|-----------|
| `/plan` | Reformula os requisitos, avalia riscos e escreve um plano de implementação passo a passo; **espera sua confirmação antes de mexer no código** |
| `/multi-plan` | Planejamento colaborativo com vários modelos |
| `/multi-workflow` | Desenvolvimento colaborativo com vários modelos |
| `/multi-backend` | Desenvolvimento com vários modelos focado em backend |
| `/multi-frontend` | Desenvolvimento com vários modelos focado em frontend |
| `/multi-execute` | Execução colaborativa com vários modelos |

---

## Gestão de sessões

| Comando | O que faz |
|---------|-----------|
| `/save-session` | Salva o estado da sessão atual em `~/.claude/session-data/` |
| `/resume-session` | Carrega a sessão salva mais recente do repositório canônico de sessões e continua de onde parou |
| `/sessions` | Navega, busca e gerencia o histórico de sessões com aliases em `~/.claude/session-data/` (lendo também o legado em `~/.claude/sessions/`) |
| `/checkpoint` | Cria, verifica ou lista checkpoints do fluxo depois de rodar as verificações |
| `/aside` | Responde uma pergunta paralela rápida sem perder o contexto da tarefa atual |

---

## CLI de memória entre ambientes

Estes são comandos da CLI `yus`, não comandos de barra. Eles usam um único
cofre em Markdown, que dá para inspecionar, compartilhado entre Claude, Codex,
Hermes, OpenClaw, Kimi e outros ambientes.

| Comando | O que faz |
|---------|-----------|
| `yus memory init` | Cria as pastas do cofre do projeto, da equipe ou do usuário |
| `yus memory save` | Cria um contexto, decisão, fato, lição, nota, preferência ou runbook ainda não revisado |
| `yus memory handoff` | Transfere um estado de trabalho delimitado de um ambiente para outro |
| `yus memory search` | Busca memórias por texto, escopo, tipo ou ambiente de destino |
| `yus memory read` | Lê uma memória e seus backlinks pelo ID estável |
| `yus memory doctor` | Reporta arquivos malformados, IDs duplicados, links quebrados e symlinks ignorados |
| `yus-memory-mcp` | Inicia o servidor MCP local opcional via stdio |

Passe o conteúdo das memórias com `--stdin` ou `--body-file`; de propósito, ele
não é aceito como valor na linha de comando. Memórias recuperadas são contexto
não confiável, não instruções executáveis nem política.

---

## CLI de saúde da instalação e feedback

Estes comandos de ciclo de vida também estão disponíveis pela CLI `yus`.

| Comando | O que faz |
|---------|-----------|
| `yus list-installed` | Mostra as instalações registradas no estado gerenciado do yus |
| `yus doctor` | Diagnostica arquivos gerenciados ausentes ou alterados e aponta as falhas para o formulário curto de problemas |
| `yus repair` | Restaura arquivos gerenciados ausentes ou alterados |
| `yus uninstall` | Remove só os arquivos gerenciados pelo estado de instalação e, se quiser, mostra o caminho de feedback de saída de 20 segundos |
| `yus feedback` | Mostra os caminhos públicos de problema, feedback rápido e sugestão de funcionalidade, sem ler arquivos nem enviar diagnósticos |

---

## Aprendizado e melhoria

| Comando | O que faz |
|---------|-----------|
| `/learn` | Extrai padrões reutilizáveis da sessão atual |
| `/learn-eval` | Extrai padrões e avalia a própria qualidade antes de salvar |
| `/evolve` | Analisa os instintos aprendidos e sugere estruturas de skill evoluídas |
| `/promote` | Promove instintos do escopo do projeto para o escopo global |
| `/prune` | Apaga instintos pendentes com mais de 30 dias que nunca foram promovidos |
| `/instinct-status` | Mostra todos os instintos aprendidos (projeto + global) com notas de confiança |
| `/instinct-export` | Exporta instintos para um arquivo |
| `/instinct-import` | Importa instintos de um arquivo ou URL |
| `/skill-create` | Analisa o histórico git local e gera uma skill reutilizável |
| `/skill-health` | Painel de saúde do portfólio de skills, com análises |
| `/skill-host-compat` | Verifica as skills quanto a frontmatter seguro para o Codex e substituições do Claude |

---

## Refatoração e limpeza

| Comando | O que faz |
|---------|-----------|
| `/refactor-clean` | Remove código morto, consolida duplicatas e organiza a estrutura |

---

## Documentação e pesquisa

Para investigações em fontes públicas que começam com poucas pistas, use a
[skill `osint-investigation`](skills/research/osint-investigation/SKILL.md) para
extrair pistas negligenciadas, ligar evidências fragmentadas e testar
explicações concorrentes por meio de falseamento deliberado e verificação
visual.

| Comando | O que faz |
|---------|-----------|
| `/yus-guide` | Navega pelos agentes, skills, comandos, hooks, perfis de instalação e documentação atuais do yus a partir do repositório vivo |
| `/update-docs` | Sincroniza a documentação a partir das fontes da verdade, como scripts, schemas, rotas e exports |
| `/update-codemaps` | Regenera os mapas de código do projeto |

---

## Ciclos e automação

| Comando | O que faz |
|---------|-----------|
| `/loop-start` | Inicia um ciclo recorrente de agente num intervalo |
| `/loop-status` | Verifica o status dos ciclos em execução |
| `/gan-build` | Ciclo gerador/avaliador de build para tarefas de implementação, com iterações limitadas e pontuação |
| `/gan-design` | Ciclo gerador/avaliador de design para trabalho de frontend ou visual, com iterações limitadas e pontuação |

---

## Projeto e infraestrutura

| Comando | O que faz |
|---------|-----------|
| `/projects` | Lista os projetos conhecidos e as estatísticas de instintos de cada um |
| `/project-init` | Detecta a stack de um projeto e produz um plano de integração ao yus em modo de simulação |
| `/harness-audit` | Audita a configuração do ambiente de agentes quanto a confiabilidade e custo |
| `/model-route` | Encaminha uma tarefa para o modelo certo (Haiku / Sonnet / Opus) |
| `/pm2` | Inicialização do gerenciador de processos PM2 |
| `/setup-pm` | Configura o gerenciador de pacotes (npm / pnpm / yarn / bun) |
| `/auto-update` | Baixa as últimas mudanças do repositório yus e reinstala os destinos gerenciados atuais |
| `/cost-report` | Gera um relatório local de custo do Claude Code a partir de um banco SQLite do cost-tracker |
| `/token-card` | Gera um cartão de estatísticas de uso de tokens a partir dos logs locais de sessão e faz commit dele no repositório |
| `/security-scan` | Roda o AgentShield sobre agentes, hooks, MCP, permissões e segredos |
| `/jira` | Busca um ticket do Jira, analisa os requisitos, atualiza o status ou adiciona comentários |
| `/pr` | Cria um PR no GitHub a partir do branch atual com commits ainda não enviados |
| `/hookify` | Cria hooks para impedir comportamentos indesejados, a partir da análise da conversa ou de instruções explícitas |
| `/hookify-configure` | Ativa ou desativa regras do hookify de forma interativa |
| `/hookify-list` | Lista todas as regras configuradas do hookify |
| `/hookify-help` | Ajuda sobre o sistema hookify |

---

## Marketing

| Comando | O que faz |
|---------|-----------|
| `/marketing-campaign` | Planeja e executa uma campanha completa de marketing: posicionamento, textos de landing page, sequência de e-mails, posts em redes sociais, variações de anúncio, roteiros de vídeo, calendário de conteúdo |

---

## Comandos aposentados

Estes comandos de barra foram aposentados em favor de skills. Os arquivos dos
comandos ainda existem em `legacy-command-shims/commands/` por compatibilidade
(fora da instalação padrão), mas o fluxo mantido agora vive na skill listada;
use a skill diretamente:

| Comando aposentado | Use esta skill |
|---|---|
| `/tdd` | `tdd-workflow` |
| `/eval` | `eval-harness` |
| `/verify` | `verification-loop` |
| `/e2e` | `e2e-testing` |
| `/docs` | `documentation-lookup` |
| `/claw` | `nanoclaw-repl` |
| `/context-budget` | `context-budget` |
| `/devfleet` | `claude-devfleet` |
| `/orchestrate` | `dmux-workflows` e `autonomous-agent-harness` |
| `/prompt-optimize` | `prompt-optimizer` |
| `/rules-distill` | `rules-distill` |
| `/agent-sort` | `agent-sort` |

---

## Guia rápido de decisão

```
Começando uma funcionalidade nova?  → /plan primeiro, depois TDD com a skill tdd-workflow
Acabou de escrever código?          → /code-review
Triando uma issue do GitHub?        → /issue-review <número>
Build quebrado?                     → /build-fix
Precisa de documentação atual?      → a skill documentation-lookup
A sessão está para acabar?          → /save-session ou /learn-eval
Retomando no dia seguinte?          → /resume-session
O contexto está ficando pesado?     → a skill context-budget
Quer extrair o que aprendeu?        → /learn-eval e depois /evolve
Rodando tarefas repetidas?          → /loop-start
```
