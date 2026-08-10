# Pesquisa do ecossistema de Agent Skills

[English](./ECOSYSTEM.md) | **Português** | [简体中文](./ECOSYSTEM.zh-CN.md)

Este documento registra os ecossistemas externos de skills analisados durante a evolução deste repositório e os critérios usados para decidir o que deve ser implementado localmente.

> Data do levantamento: 2026-08-10. Popularidade e atividade dos repositórios mudam ao longo do tempo.

## Objetivo

O objetivo não é espelhar todos os repositórios públicos de skills. Catálogos muito grandes acumulam instruções sobrepostas, aumentam o custo de manutenção e tornam o roteamento menos preciso.

Uma nova skill deve acrescentar uma capacidade reutilizável distinta, encaixar na arquitetura multi-ferramenta do repositório e, sempre que possível, ser útil sem depender de um único fornecedor de modelos.

## Repositórios analisados

### obra/superpowers

Metodologia agentic de desenvolvimento de software com grande adoção, focada em workflows disciplinados como brainstorming, debugging, planejamento, revisão, testes, worktrees e verificação.

Características observadas neste levantamento:

- adoção muito alta no GitHub;
- licença MIT;
- forte foco em processo de desenvolvimento, e não apenas em referências específicas de frameworks;
- desenvolvimento ativo em 2026.

Conceitos escolhidos para implementações locais originais:

- `systematic-debugging`
- `verification-before-completion`

As skills locais foram escritas de forma independente para as convenções deste repositório, sem copiar o texto upstream.

### anthropics/skills

Repositório público oficial de Agent Skills da Anthropic. É uma referência importante para o modelo canônico de `SKILL.md` e cobre áreas como manipulação de documentos, construção de MCP, frontend, testes de aplicações web, uso de APIs e criação de artefatos.

Muitas dessas capacidades de alto valor já existem aqui. Em especial, este repositório já possuía `mcp-builder` antes desta análise, portanto duplicar essa capacidade foi descartado.

### vercel-labs/agent-skills

Coleção oficial de agent skills da Vercel e uma referência forte para desenvolvimento web e React moderno. Durante esta análise, o repositório apresentava skills de boas práticas React, composição de componentes, React Native, deploy na Vercel, design web e workflows de frontend relacionados.

Um conceito foi selecionado para implementação local original:

- `composition-patterns`

Duas candidatas adicionais chegaram a ser implementadas temporariamente durante a análise e depois foram removidas após a inspeção completa do catálogo local:

- `react-best-practices` tinha sobreposição substancial com as skills existentes `react-patterns` e `react-performance`;
- `web-design-guidelines` tinha sobreposição substancial com `design-system`, `frontend-design-direction`, `make-interfaces-feel-better` e materiais de acessibilidade.

Nenhum texto upstream foi copiado. No momento deste levantamento, o GitHub não expunha uma licença do repositório `vercel-labs/agent-skills`, então apenas lacunas de capacidade e temas de alto nível foram usados como sinais de pesquisa.

### trailofbits/skills

A Trail of Bits mantém um ecossistema de skills focado em segurança, cobrindo construção de contexto para auditoria, code review, pesquisa de vulnerabilidades, análise estática/dinâmica, contratos seguros e tooling especializado.

Este repositório já contém uma skill `security-review` substancial e outros materiais de segurança. Por isso, uma nova skill genérica de security review não foi adicionada neste passe, evitando duplicação de intenção.

## Sinais de registries e do ecossistema

Registries públicos de skills em 2026 mostram crescimento rápido e forte concentração em engenharia de software, frontend/UI, recuperação de informação e criação de conteúdo.

O ecossistema também apresenta bastante redundância: muitas skills descrevem intenções quase idênticas com prompts ligeiramente diferentes. Neste repositório, popularidade deve ser usada como sinal de descoberta, e não como motivo automático para importar uma skill.

## Critérios de seleção

Uma skill candidata normalmente deve atender a todos os critérios abaixo:

1. **Intenção distinta** — não duplica substancialmente uma skill canônica existente.
2. **Utilidade recorrente** — aplica-se a muitos repositórios ou tarefas repetidas.
3. **Ativação clara** — o agente consegue identificar quando carregá-la.
4. **Procedimento acionável** — contém workflow ou estrutura de decisão, e não apenas conselhos genéricos.
5. **Resultado verificável** — incentiva evidências, testes, revisão ou critérios mensuráveis de conclusão.
6. **Portabilidade entre ferramentas** — funciona, quando possível, em Claude Code, Codex, OpenCode, Antigravity e outras integrações.
7. **Escopo seguro** — ações de alto impacto exigem controles explícitos e evitam execução cega.
8. **Higiene de licença** — material copiado ou adaptado exige licença compatível e atribuição; caso contrário, a capacidade deve ser implementada de forma independente.

## Skills adicionadas neste passe

| Skill | Lacuna principal | Sinal de pesquisa |
|---|---|---|
| `systematic-debugging` | Análise de causa raiz baseada em evidências e hipóteses falsificáveis | obra/superpowers |
| `verification-before-completion` | Disciplina de evidências antes de afirmar conclusão | obra/superpowers |
| `composition-patterns` | Design de APIs reutilizáveis de componentes e pontos de extensão | vercel-labs/agent-skills |

Essas três foram mantidas porque, após uma segunda revisão de sobreposição, a intenção de ativação permanece suficientemente distinta do catálogo existente.

## Candidatas não adicionadas

As áreas abaixo foram analisadas, mas rejeitadas ou adiadas:

- boas práticas React genéricas — já cobertas por `react-patterns`, `react-performance` e skills React relacionadas;
- revisão genérica de web design — já coberta por `design-system`, `frontend-design-direction`, `make-interfaces-feel-better`, acessibilidade e outras skills de UI;
- test-driven development — já representado por `tdd-workflow` e skills TDD específicas de linguagens e frameworks;
- workflows com Git worktrees — úteis para agentes paralelos, mas devem ser integrados ao material existente de orquestração e DevFleet em vez de adicionados como duplicata isolada;
- deploy na Vercel — específico de fornecedor e só deve entrar se houver demanda que justifique uma skill dedicada;
- security review genérico — já representado por `security-review`; futuras adições de segurança devem ser capacidades especializadas e mais estreitas;
- geração de documentos — já está amplamente representada pelo catálogo atual e integrações upstream.

## Política de manutenção

Ao revisar ecossistemas externos de skills no futuro:

1. consulte primeiro o índice local existente;
2. compare intenção, não apenas nomes de skills;
3. prefira estender uma skill existente a adicionar uma quase duplicata;
4. registre a fonte usada como sinal de pesquisa;
5. verifique a licença do repositório antes de adaptar conteúdo;
6. escreva material original quando a licença estiver ausente ou incerta;
7. atualize `.skill-index/skills.json` após adicionar skills canônicas;
8. mantenha a documentação multilíngue semanticamente alinhada.
