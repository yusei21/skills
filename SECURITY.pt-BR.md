# Política de segurança

[English](SECURITY.md) | **Português** | [中文](SECURITY.zh-CN.md)

## Versões com suporte

| Versão | Suporte |
| --- | --- |
| 2.x / builds rc | :white_check_mark: |
| 1.10.x | :white_check_mark: |
| 1.9.x | Só correções críticas |
| < 1.9 | :x: |

Correções de segurança entram primeiro no `main`. Backports são feitos quando
possível e só para as linhas de versão com suporte.

## Como reportar uma vulnerabilidade

Sempre que possível, use o reporte privado de vulnerabilidades do GitHub; ele
chega direto ao mantenedor:

- <https://github.com/yusei21/yus/security/advisories/new>

**Não** abra uma issue pública no GitHub para vulnerabilidades de segurança.

Inclua:

- arquivo, pacote, versão, commit e caminho de instalação afetados
- passos para reproduzir a partir de um checkout limpo
- impacto esperado e a fronteira de confiança afetada
- se a exploração exige acesso a um shell local, um repositório malicioso, um
  pacote malicioso, um agente remoto não autenticado ou credenciais de
  mantenedor
- logs de PoC, com tokens, chaves, caminhos locais e dados privados removidos

Resposta esperada:

- **Confirmação de recebimento:** em até 48 horas
- **Avaliação inicial:** em até 7 dias
- **Meta para correção ou mitigação crítica:** em até 14 dias, quando o reporte
  afeta uma versão com suporte e atravessa uma fronteira de confiança real
- **Divulgação coordenada:** antes da publicação do aviso público

Se um reporte for recusado, explicaremos se ele não é reproduzível, está fora
do escopo, já foi corrigido ou precisa de um caminho de ataque mais forte.

## Escopo

Esta política cobre:

- o repositório `yusei21/yus`
- o pacote npm `yus-universal`
- as superfícies de plugin, instalação, reparo, dashboard, hook, regra, skill,
  MCP e comando distribuídas a partir deste repositório
- os workflows de GitHub Actions e a automação de release deste repositório
- os pontos de integração do GitHub App ECC Tools documentados neste
  repositório
- a documentação de uso do AgentShield quando ela estiver incluída aqui.
  Problemas no código do AgentShield pertencem a
  <https://github.com/affaan-m/agentshield>

## Canais oficiais de distribuição

Os canais oficiais do yus são:

- repositório no GitHub: <https://github.com/yusei21/yus>
- slug de marketplace/plugin: `yus@yus`

O yus não é publicado no npm. O AgentShield (`ecc-agentshield`,
<https://github.com/affaan-m/agentshield>) é uma ferramenta separada do autor
do projeto ECC original; reporte os problemas dele lá.

Os pacotes a seguir reaproveitam metadados do projeto ECC original e **não são
mantidos aqui**:

- `@chil_ntl/ecc-cli`
- `ecc-100xprompt-plugin`

Trate qualquer pacote que não esteja entre os canais oficiais como não oficial
até que seja verificado. Não instale pacotes chamados `opencode-ecc`,
`everything-claude-code` ou outros nomes parecidos com yus, a menos que este
repositório os documente explicitamente como oficiais.

## Fora do escopo

Em geral, um reporte está fora do escopo quando mostra apenas:

- execução de comando local em que o usuário já controla o shell local e
  nenhuma fronteira de confiança de privilégio maior é atravessada
- capturas de tela, números de linha desatualizados ou reportes contra
  `yusei21/yus` que não se reproduzem na versão atual de `yusei21/yus`
- self-XSS ou engenharia social sem caminho de exploração controlado pelo
  repositório
- confusão de metadados de pacote ou do grafo de dependências sem um caminho de
  instalação até um pacote oficial do yus
- vulnerabilidades em pacotes de terceiros, a menos que o yus os fixe, instale
  ou execute de um jeito que crie impacto adicional

Ferramentas locais de desenvolvimento ainda podem ter problemas de segurança
válidos quando conteúdo não confiável do repositório, instalação de pacotes,
hooks gerados ou automação de CI podem disparar execução sem intenção clara do
usuário. Mostre essa fronteira de confiança no reporte.

## Regras de cadeia de suprimentos

O yus trata a exposição da cadeia de suprimentos como uma superfície de
segurança de primeira classe.

- GitHub Actions de terceiros devem ser fixadas por SHA de commit.
- Workflows não devem passar contexto não confiável do GitHub direto para
  blocos `run:`.
- A documentação de release e instalação deve apontar apenas para pacotes
  oficiais.
- Os metadados do pacote devem apontar para `yusei21/yus`, não para caminhos
  antigos do repositório.
- Reportes privados de vulnerabilidade são triados em privado antes da
  divulgação pública.
- Avisos de segurança só são publicados quando uma versão com suporte é afetada
  e a divulgação coordenada é adequada.

## Orientações operacionais

### Tratamento de segredos

`mcp-configs/mcp-servers.json` é um **modelo**. Todos os valores `YOUR_*_HERE`
devem ser substituídos na instalação, a partir de variáveis de ambiente ou de
um gerenciador de segredos. Nunca faça commit de credenciais reais. Se um
segredo for commitado por engano, revogue-o na hora e reescreva o histórico;
um simples revert não basta.

A mesma regra vale para a configuração do Claude Code no escopo do usuário
(`~/.claude/settings.json` ou `%USERPROFILE%\.claude\settings.json`). Esse
arquivo fica fora deste repositório, mas costuma ser compartilhado na saída do
`claude doctor`, em capturas de tela e em relatos de bug. Não coloque PATs,
chaves de API ou tokens OAuth fixos nos blocos `mcpServers[*].env`. Resolva-os
no momento em que o servidor é iniciado, a partir do keychain do sistema ou das
variáveis de ambiente que o seu servidor MCP já suporta.

Auditoria rápida:

```bash
# macOS / Linux
grep -EnH '(TOKEN|SECRET|KEY|PASSWORD)\s*"\s*:\s*"[A-Za-z0-9_-]{16,}"' ~/.claude/settings.json

# Windows PowerShell
Select-String -Path "$env:USERPROFILE\.claude\settings.json" -Pattern '(TOKEN|SECRET|KEY|PASSWORD)"\s*:\s*"[A-Za-z0-9_-]{16,}"'
```

Se a auditoria encontrar algo, revogue o segredo no provedor que o emitiu e
depois tire-o do arquivo.

### Portas MCP locais

Alguns servidores MCP incluídos se conectam por HTTP simples a uma porta em
localhost. Antes do primeiro uso, verifique o processo que está escutando:

```bash
# Windows
netstat -ano | findstr :18801

# macOS / Linux
lsof -iTCP:18801 -sTCP:LISTEN
```

Compare o PID com o binário esperado. Qualquer outro processo nessa porta pode
interceptar o tráfego MCP.

## Triagem: blocos `<system-reminder>` suspeitos

O yus roda dentro de ambientes de agentes que podem injetar, a cada turno,
lembretes de sistema temporários do lado do cliente na entrada do modelo.
Esses blocos não são automaticamente conteúdo trazido pelo repositório.

Antes de tratar um deles como ataque, verifique:

1. O bloco está mesmo num arquivo deste repositório?

   ```bash
   grep -rEn "system-reminder|NEVER mention|DO NOT mention" .
   ```

2. O bloco está gravado na transcrição da sessão como parte do resultado de uma
   ferramenta?
3. Ele é coerente com lembretes conhecidos do cliente, como avisos do
   TodoWrite, avisos de data ou avisos de arquivo modificado?

Só escale para o upstream quando o bloco estiver dentro do resultado de uma
ferramenta ou de um arquivo do repositório e não puder ser atribuído ao
arquivo, URL ou comando que foi de fato lido.

## Recursos de segurança

- **AgentShield:** `npx ecc-agentshield scan`
- **Guia de segurança:** [The Shorthand Guide to Everything Agentic Security](./the-security-guide.pt-BR.md)
- **Resposta a incidentes na cadeia de suprimentos:** [playbook de registro de pacotes npm/GitHub Actions](./docs/security/supply-chain-incident-response.md)
- **OWASP MCP Top 10:** <https://owasp.org/www-project-mcp-top-10/>
- **OWASP Agentic Applications Top 10:** <https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/>
