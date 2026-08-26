# Integridade de Revisão e Instruções

[English](./REVIEW-INTEGRITY.md) | **Português** | [简体中文](./REVIEW-INTEGRITY.zh-CN.md)

Este documento define a política do repositório para revisão de código baseada em evidências e para mudanças no plano de controle de instruções usado pelas ferramentas de programação com IA suportadas.

Os objetivos são reduzir falsos positivos em reviews, manter o comportamento compartilhado portátil entre runtimes e evitar drift de instruções ou expansão insegura de capacidades.

## Política de revisão

Reviews devem otimizar correção e capacidade de ação, não a quantidade de problemas encontrados.

Para mudanças substanciais, use perspectivas independentes em vez de uma única passada genérica:

1. **Correção** — bugs concretos ou regressões introduzidos pela mudança.
2. **Conformidade do repositório** — `AGENTS.md`, `CLAUDE.md`, regras e convenções aplicáveis.
3. **Contexto/histórico** — chamadores, testes, blame e histórico direcionado quando a intenção estiver ambígua.
4. **Segurança** — quando o diff cruza uma fronteira de segurança ou altera o plano de controle de agente/ferramenta.

O `code-reviewer` principal já aplica filtro de confiança. A orquestração final deve preservar esse comportamento:

- reportar somente achados acionáveis com confiança acima de 80%;
- consolidar achados duplicados com a mesma causa raiz;
- separar problemas introduzidos pela mudança de débito preexistente e não relacionado;
- exigir evidência exata e cenário concreto de falha para achados HIGH ou CRITICAL;
- aceitar zero achados como resultado válido de uma revisão bem-sucedida.

Um achado que não consegue identificar local afetado, gatilho e resultado incorreto deve ser rebaixado ou removido.

## Hierarquia de evidências

Use a menor quantidade de evidência necessária para verificar um achado. Fontes úteis incluem:

- linhas alteradas e implementação ao redor;
- chamadores e caminhos de fluxo de dados;
- testes e fixtures;
- restrições de tipos ou schemas;
- instruções aplicáveis do repositório;
- garantias do framework/runtime;
- `git blame` ou histórico direcionado para comportamento sensível à intenção.

O histórico deve esclarecer contexto, não criar requisitos especulativos ausentes do código e da documentação atuais.

## Mudanças no plano de controle de instruções

Trate os itens abaixo como recursos de plano de controle porque podem alterar como um agente se comporta ou quais capacidades usa:

- `AGENTS.md`, `CLAUDE.md` e arquivos de instruções com escopo mais próximo;
- skills canônicas e prompts de agentes;
- regras e hooks;
- configuração de MCP/ferramentas;
- metadados de plugin ou marketplace;
- adaptadores de runtime como `.claude/`, `.codex/`, `.agy/`, `.mimocode/`, `.opencode/`, `.kimi/` e conteúdo de compatibilidade.

Mudanças nesses arquivos exigem uma passada de integridade de instruções além da revisão normal de texto/código.

## Checklist de integridade de instruções

Quando o comportamento de instruções ou adaptadores mudar:

1. Estabeleça a precedência efetiva do runtime afetado, incluindo instruções da raiz e de escopo mais próximo.
2. Mantenha política compartilhada em recursos canônicos e sintaxe/comportamento de carregamento nativo no adaptador relevante.
3. Compare runtimes irmãos em busca de contradições, referências obsoletas, duplicação acidental e divergência não documentada.
4. Não propague diretivas específicas de uma ferramenta para todos os runtimes sem confirmar que a semântica é realmente portátil.
5. Execute `skill-security-audit` para risco de prompt injection, expansão inesperada de permissões, persistência, acesso a credenciais, configuração insegura de rede/ferramentas e instruções externas.
6. Verifique se hooks, servidores MCP, scripts ou metadados de plugin ampliam de forma material o escopo de shell, filesystem, rede ou credenciais.
7. Documente diferenças intencionais entre runtimes quando um mantenedor futuro poderia interpretá-las como drift.

## Padrões externos de plugins e skills

Ecossistemas externos podem ser boas fontes de ideias arquiteturais e de workflow. Prefira adaptar conceitos ao modelo de fonte canônica deste repositório em vez de copiar implementações específicas de uma ferramenta por inteiro.

Quando conteúdo for copiado ou adaptado de forma substancial:

- verifique a licença exata da origem antes da adoção;
- preserve avisos e atribuições exigidos;
- registre proveniência quando a política do repositório exigir;
- evite importar detalhes de implementação que prendam comportamento compartilhado a um único runtime sem necessidade.

Quando produzir um design mais limpo e portátil, prefira reimplementar um padrão geral em texto original e estrutura nativa deste repositório.

## Integração com a orquestração

`project-orchestrator` é responsável por detectar trabalho em instruções/plano de controle e selecionar os recursos de auditoria/revisão relevantes.

`orch-pipeline` é responsável por exigir revisão baseada em evidências antes do gate de commit. Mudanças padrão e grandes devem usar perspectivas separadas quando útil, depois deduplicar e filtrar os achados por confiança.

O fluxo esperado é:

```text
inspecionar repositório + hierarquia de instruções
                │
                ├── implementar / alterar
                │
                ├── revisão de correção
                ├── revisão de regras do repositório
                ├── revisão de contexto/histórico (quando necessário)
                └── revisão de segurança/plano de controle (quando acionada)
                                │
                                └── deduplicar + filtrar por confiança (>80%)
                                                │
                                                └── resolver HIGH/CRITICAL → gate de commit
```

## Regra de manutenção

Se uma mudança futura reduzir o limite de confiança, remover verificações de precedência de instruções ou introduzir uma segunda fonte física de verdade em um adaptador, ela deve incluir justificativa documentada e estratégia de migração.
