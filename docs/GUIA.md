# Guia de Uso Avançado

[English](./GUIDE.md) | **Português** | [简体中文](./GUIDE.zh-CN.md)

Este guia parte do princípio de que o repositório já está instalado. Veja [`README.pt-BR.md`](../README.pt-BR.md) para instruções de instalação e integração.

O repositório foi organizado em torno de recursos canônicos reutilizáveis, descoberta automática de skills e carregamento seletivo. O objetivo não é colocar o maior catálogo possível em todas as sessões; é tornar fácil descobrir e reutilizar o menor conjunto útil de capacidades.

Para o levantamento de ecossistemas externos e os critérios usados para adicionar ou rejeitar skills, consulte [`ECOSYSTEM.pt-BR.md`](./ECOSYSTEM.pt-BR.md).

## 1. Arquitetura canônica

As implementações compartilhadas ficam na raiz do repositório:

| Recurso | Local canônico | Finalidade |
|---|---|---|
| Agentes | `agents/` | Definições de papéis especialistas para trabalho delegado |
| Skills | `skills/` | Workflows, procedimentos e conhecimento de domínio reutilizáveis |
| Regras | `rules/` | Restrições transversais de comportamento e código |
| Hooks | `hooks/` | Automação e enforcement orientados a eventos |
| Comandos | `commands/` | Entradas rápidas para workflows recorrentes |
| Configurações MCP | `mcp-configs/` | Catálogo compartilhado de servidores MCP |
| Scripts | `scripts/` | Ferramentas determinísticas de apoio e integração |

Diretórios específicos de ferramentas, como `.claude/`, `.codex/`, `.agents/`, `.agy/`, `.mimocode/` e `.opencode/`, devem conter arquivos de integração, configuração nativa e links para recursos canônicos, em vez de cópias independentes.

## 2. Descoberta automática de skills

`project-orchestrator` é o roteador de nível de repositório para tarefas substanciais. Ele deve:

1. inspecionar o repositório atual e a tarefa;
2. ler `.skill-index/skills.json` como catálogo de descoberta;
3. selecionar somente o menor conjunto útil de skills;
4. carregar prompts de agentes especialistas apenas quando agregarem valor;
5. evitar carregar o catálogo inteiro no contexto.

O índice canônico de skills é gerado a partir de `skills/*/SKILL.md` por:

```bash
node scripts/build-skill-index.js
```

O arquivo gerado é:

```text
.skill-index/skills.json
```

O GitHub Actions mantém o índice sincronizado quando definições canônicas de skills ou o gerador mudam. Pull requests que alteram skills devem deixar o índice gerado consistente.

Não mantenha manualmente uma segunda lista de skills em diretórios específicos de ferramentas.

## 3. Escolhendo a skill correta

Prefira correspondência por intenção, não apenas por nome. Antes de criar uma nova skill:

1. pesquise em `.skill-index/skills.json`;
2. compare a candidata com skills existentes que produzem resultados semelhantes;
3. amplie uma skill canônica existente quando houver sobreposição substancial de intenção;
4. crie uma nova skill somente quando ela acrescentar um workflow reutilizável distinto;
5. use `skill-scout`, `skill-builder`, `skill-stocktake` e `skill-comply` quando apropriado.

Uma boa skill deve ter gatilho claro, procedimento acionável, resultado verificável e fronteiras que a diferenciem de skills vizinhas.

## 4. Skills atuais de alto valor para workflows

### Debugging sistemático

Use `systematic-debugging` quando a causa de uma falha estiver incerta, for intermitente, atravessar várias camadas ou já tiver resistido a correções anteriores.

O workflow é orientado por evidências:

```text
reproduzir
  ↓
coletar evidências
  ↓
formular hipótese falsificável
  ↓
isolar o domínio da falha
  ↓
testar a hipótese
  ↓
corrigir a causa raiz
  ↓
verificar a regressão
```

Não altere código apenas porque uma mudança parece plausível. A skill exige uma hipótese concreta e um teste que possa refutá-la antes de tratar um patch como correção de causa raiz.

### Verificação antes de concluir

Use `verification-before-completion` antes de afirmar que uma implementação, correção, migração, refatoração ou automação foi concluída.

Afirmações de conclusão devem ser sustentadas por evidências atuais, como:

- os artefatos esperados existem e contêm a mudança pretendida;
- o comportamento solicitado foi exercitado diretamente;
- testes focados passaram;
- testes mais amplos, verificações estáticas ou builds passaram quando relevantes;
- riscos restantes e áreas não verificadas foram explicitamente informados.

Essa skill complementa `verification-loop`: o loop define verificações amplas do projeto, enquanto `verification-before-completion` governa qual evidência é necessária antes de afirmar que algo está concluído.

### Padrões de composição de componentes

Use `composition-patterns` quando um componente de UI estiver acumulando props booleanas que interagem entre si ou precisar de pontos de extensão flexíveis.

Prefira:

- `children` e slots explícitos para estrutura;
- contratos de estado controlado/não controlado;
- compound components quando subpartes fazem parte de uma mesma API conceitual;
- limites estreitos de contexto;
- pontos de extensão explícitos em vez de explosão de props.

Para trabalho em React, use-a junto de `react-patterns` e `react-performance`, em vez de criar outra skill ampla de “React best practices”.

## 5. Workflows comuns

### Começar uma nova feature

```text
project-orchestrator
  ↓
skill de intenção / planejamento
  ↓
implementação + skills relevantes do framework
  ↓
testes
  ↓
revisão de código/segurança quando necessário
  ↓
verification-before-completion
```

Para trabalhos maiores, use a família `orch-*` ou outras skills de orquestração já existentes no catálogo, em vez de inventar um pipeline independente.

### Corrigir um bug

```text
systematic-debugging
  ↓
reproduzir a falha
  ↓
adicionar teste de regressão quando viável
  ↓
implementar a correção de causa raiz
  ↓
executar verificações focadas e mais amplas
  ↓
verification-before-completion
```

### Preparar para produção

Combine somente o que o projeto realmente precisa, por exemplo:

```text
security-review / security-scan
production-audit
E2E ou verificação específica do framework
canary-watch quando for necessário validar deployment
verification-before-completion
```

## 6. Combinando agentes e skills

Agentes são definições de papéis; skills são capacidades reutilizáveis. Mantenha essas responsabilidades separadas.

Um agente revisor pode carregar skills de segurança ou revisão de framework. Um agente desenvolvedor pode carregar skills de implementação, testes e verificação. Não copie o mesmo conhecimento de domínio para cada prompt de agente.

Para execução multiagente, prefira propriedade explícita das tarefas, artefatos, gates de verificação e handoffs delimitados em vez de conversas abertas entre agentes.

## 7. Disciplina de contexto e custo

- Carregue apenas as skills necessárias para a tarefa atual.
- Prefira metadados do índice antes de abrir arquivos `SKILL.md` completos.
- Use regras específicas apenas para tecnologias realmente presentes no projeto.
- Mantenha servidores MCP não relacionados desativados para reduzir contexto e superfície de ataque.
- Faça compactação de contexto em transições lógicas de fase, não durante debugging ou implementação ativos.
- Reutilize perfis de projeto e memória durável quando disponíveis, em vez de redescobrir fatos estáveis a cada turno.

## 8. Adicionando conteúdo de repositórios externos

Antes de importar ou adaptar uma capacidade externa:

1. inspecione primeiro o catálogo local;
2. compare intenção em vez de apenas nomes;
3. verifique a licença atual do repositório de origem;
4. revise scripts, hooks, dependências, configuração MCP e comportamento de acesso a dados;
5. prefira implementação original quando a licença estiver ausente ou incerta;
6. preserve atribuições obrigatórias quando material protegido for realmente copiado ou adaptado;
7. atualize os arquivos NOTICE apropriados quando necessário;
8. regenere o índice de skills após adicionar skills canônicas.

A metodologia da pesquisa e os ecossistemas analisados estão documentados em [`ECOSYSTEM.pt-BR.md`](./ECOSYSTEM.pt-BR.md).

## 9. Política de idiomas da documentação

A documentação voltada ao usuário deve permanecer disponível em três idiomas:

1. inglês — fonte canônica;
2. português (`pt-BR`);
3. chinês simplificado (`zh-CN`).

Quando um documento voltado ao usuário mudar de forma material, atualize as três variantes no mesmo conjunto de mudanças. Mantenha identificadores de código, nomes de comandos, caminhos de arquivos, nomes de APIs e chaves de configuração em inglês, salvo quando a ferramenta subjacente exigir localização.

Use links de idioma próximos ao topo dos documentos equivalentes para permitir troca direta entre versões.

## 10. Manutenção do catálogo

Revise periodicamente o catálogo em busca de:

- intenções duplicadas ou quase duplicadas;
- orientação obsoleta de frameworks ou versões;
- descrições de frontmatter truncadas ou fracas;
- skills que exigem permissões desnecessárias ou inseguras;
- skills cujos workflows deixaram de ser acionáveis;
- referências externas cuja licença ou manutenção mudou.

Popularidade é um sinal de descoberta, não um critério automático de importação. Um catálogo menor e bem roteado é mais útil do que um catálogo maior cheio de prompts sobrepostos.
