# Guia de solução de problemas

[English](TROUBLESHOOTING.md) | **Português** | [中文](TROUBLESHOOTING.zh-CN.md)

Problemas comuns do plugin ECC e como resolvê-los.

## Sumário

- [Problemas de memória e contexto](#problemas-de-memória-e-contexto)
- [Falhas do ambiente de agentes](#falhas-do-ambiente-de-agentes)
- [Erros de hooks e fluxos](#erros-de-hooks-e-fluxos)
- [Instalação e configuração](#instalação-e-configuração)
- [Problemas de desempenho](#problemas-de-desempenho)
- [Mensagens de erro comuns](#mensagens-de-erro-comuns)
- [Como conseguir ajuda](#como-conseguir-ajuda)

---

## Problemas de memória e contexto

### Estouro da janela de contexto

**Sintoma:** erros de "Context too long" ou respostas incompletas

**Causas:**
- Arquivos grandes que passam do limite de tokens
- Histórico de conversa acumulado
- Várias saídas grandes de ferramentas na mesma sessão

**Soluções:**
```bash
# 1. Limpe o histórico da conversa e comece de novo
# No Claude Code: "New Chat" ou Cmd/Ctrl+Shift+N

# 2. Reduza o tamanho do arquivo antes da análise
head -n 100 large-file.log > sample.log

# 3. Leia saídas grandes em partes
head -n 50 large-file.txt

# 4. Divida as tarefas em partes menores
# Em vez de: "Analise todos os 50 arquivos"
# Use: "Analise os arquivos da pasta src/components/"
```

### Falhas na persistência da memória

**Sintoma:** o agente não lembra do contexto ou das observações anteriores

**Causas:**
- Hooks de aprendizado contínuo desativados
- Arquivos de observação corrompidos
- Falhas na detecção do projeto

**Soluções:**
```bash
# Verifique se as observações estão sendo gravadas
ls ~/.claude/homunculus/projects/*/observations.jsonl

# Encontre o id (hash) do projeto atual
python3 - <<'PY'
import json, os
registry_path = os.path.expanduser("~/.claude/homunculus/projects.json")
with open(registry_path) as f:
    registry = json.load(f)
for project_id, meta in registry.items():
    if meta.get("root") == os.getcwd():
        print(project_id)
        break
else:
    raise SystemExit("Project hash not found in ~/.claude/homunculus/projects.json")
PY

# Veja as observações recentes desse projeto
tail -20 ~/.claude/homunculus/projects/<project-hash>/observations.jsonl

# Faça backup de um arquivo de observações corrompido antes de recriá-lo
mv ~/.claude/homunculus/projects/<project-hash>/observations.jsonl \
  ~/.claude/homunculus/projects/<project-hash>/observations.jsonl.bak.$(date +%Y%m%d-%H%M%S)

# Confirme que os hooks estão ativados
grep -r "observe" ~/.claude/settings.json
```

---

## Falhas do ambiente de agentes

### Agente não encontrado

**Sintoma:** erros de "Agent not loaded" ou "Unknown agent"

**Causas:**
- Plugin instalado de forma incorreta
- Caminho dos agentes mal configurado
- Mistura de instalação pelo marketplace com instalação manual

**Soluções:**
```bash
# Verifique a instalação do plugin
ls ~/.claude/plugins/cache/

# Confirme que o agente existe (instalação pelo marketplace)
ls ~/.claude/plugins/cache/*/agents/

# Na instalação manual, os agentes ficam em:
ls ~/.claude/agents/  # Só agentes personalizados

# Recarregue o plugin
# Claude Code → Settings → Extensions → Reload
```

### O fluxo trava durante a execução

**Sintoma:** o agente começa, mas nunca termina

**Causas:**
- Loops infinitos na lógica do agente
- Esperando uma resposta do usuário
- Timeout de rede esperando a API

**Soluções:**
```bash
# 1. Procure processos travados
ps aux | grep claude

# 2. Ative o modo de depuração
export CLAUDE_DEBUG=1

# 3. Use timeouts mais curtos
export CLAUDE_TIMEOUT=30

# 4. Verifique a conexão de rede
curl -I https://api.anthropic.com
```

### Erros no uso de ferramentas

**Sintoma:** "Tool execution failed" ou permissão negada

**Causas:**
- Dependências ausentes (npm, python etc.)
- Permissões de arquivo insuficientes
- Caminho não encontrado

**Soluções:**
```bash
# Confirme que as ferramentas necessárias estão instaladas
which node python3 npm git

# Corrija as permissões dos scripts de hook
chmod +x ~/.claude/plugins/cache/*/hooks/*.sh
chmod +x ~/.claude/plugins/cache/*/skills/*/hooks/*.sh

# Verifique se o PATH inclui os binários necessários
echo $PATH
```

---

## Erros de hooks e fluxos

### Hooks não disparam

**Sintoma:** os hooks de antes/depois não executam

**Causas:**
- Hooks não registrados no settings.json
- Sintaxe de hook inválida
- Script de hook sem permissão de execução

**Soluções:**
```bash
# Verifique se os hooks estão registrados
grep -A 10 '"hooks"' ~/.claude/settings.json

# Confirme que os arquivos de hook existem e são executáveis
ls -la ~/.claude/plugins/cache/*/hooks/

# Teste o hook à mão
bash ~/.claude/plugins/cache/*/hooks/pre-bash.sh <<< '{"command":"echo test"}'

# Registre os hooks de novo (se estiver usando o plugin)
# Desative e reative o plugin nas configurações do Claude Code
```

### Versões incompatíveis de Python/Node

**Sintoma:** "python3 not found" ou "node: command not found"

**Causas:**
- Python/Node não instalado
- PATH não configurado
- Versão errada do Python (Windows)

**Soluções:**
```bash
# Instale o Python 3 (se faltar)
# macOS: brew install python3
# Ubuntu: sudo apt install python3
# Windows: baixe em python.org

# Instale o Node.js (se faltar)
# macOS: brew install node
# Ubuntu: sudo apt install nodejs npm
# Windows: baixe em nodejs.org

# Confirme as instalações
python3 --version
node --version
npm --version

# Windows: garanta que `python` (não `python3`) funciona
python --version
```

### Falsos positivos do bloqueio de servidor de desenvolvimento

**Sintoma:** o hook bloqueia comandos legítimos que mencionam "dev"

**Causas:**
- Conteúdo de heredoc disparando o padrão
- Comandos que não são de desenvolvimento, mas têm "dev" nos argumentos

**Soluções:**
```bash
# Corrigido na v1.8.0+ (PR #371)
# Atualize o plugin para a versão mais recente

# Alternativa: rode os servidores de desenvolvimento dentro do tmux
tmux new-session -d -s dev "npm run dev"
tmux attach -t dev

# Se precisar, desative o hook temporariamente
# Edite ~/.claude/settings.json e remova o hook pre-bash
```

---

## Instalação e configuração

### O plugin não carrega

**Sintoma:** os recursos do plugin não aparecem depois da instalação

**Causas:**
- Cache do marketplace desatualizado
- Versão do Claude Code incompatível
- Arquivos do plugin corrompidos
- A configuração local do Claude foi apagada ou redefinida

**Soluções:**
```bash
# Primeiro, veja o que o ECC ainda sabe sobre esta máquina
ecc list-installed
ecc doctor
ecc repair

# Só reinstale se o doctor/repair não conseguir restaurar os arquivos

# Inspecione o cache de plugins antes de mudá-lo
ls -la ~/.claude/plugins/cache/

# Faça backup do cache de plugins em vez de apagá-lo
mv ~/.claude/plugins/cache ~/.claude/plugins/cache.backup.$(date +%Y%m%d-%H%M%S)
mkdir -p ~/.claude/plugins/cache

# Reinstale pelo marketplace
# Claude Code → Extensions → ECC → Uninstall
# Depois instale de novo pelo marketplace

# Se o problema for de acesso ao marketplace ou à conta, recupere a conta pelo ECC Tools à parte; reinstalar não recupera conta

# Verifique a versão do Claude Code
claude --version
# Requer Claude Code 2.0+

# Instalação manual (se o marketplace falhar)
git clone https://github.com/affaan-m/ECC.git
cp -r ECC ~/.claude/plugins/ecc
```

### A detecção do gerenciador de pacotes falha

**Sintoma:** usa o gerenciador de pacotes errado (npm em vez de pnpm)

**Causas:**
- Nenhum arquivo de lock presente
- CLAUDE_PACKAGE_MANAGER não definido
- Vários arquivos de lock confundindo a detecção

**Soluções:**
```bash
# Defina o gerenciador de pacotes preferido para todos os projetos
export CLAUDE_PACKAGE_MANAGER=pnpm
# Adicione ao ~/.bashrc ou ~/.zshrc

# Ou defina por projeto
echo '{"packageManager": "pnpm"}' > .claude/package-manager.json

# Ou use o campo do package.json
npm pkg set packageManager="pnpm@8.15.0"

# Atenção: remover arquivos de lock pode mudar as versões das dependências instaladas.
# Faça commit ou backup do arquivo de lock antes, depois rode uma instalação limpa e o CI de novo.
# Só faça isso quando estiver trocando de gerenciador de pacotes de propósito.
rm package-lock.json  # Se estiver usando pnpm/yarn/bun
```

### O OpenCode não inicia no Termux/Android

**Sintoma:** o rastreamento de arquivos alterados para de funcionar em
silêncio (um aviso único `[ECC] changed-files tracking disabled` aparece nos
logs do OpenCode) ou, em versões mais antigas, o `opencode` trava logo ao
iniciar com um `ResolveMessage` do Bun, por exemplo:

```
ResolveMessage: Cannot find module '../plugins/lib/changed-files-store.js' from '.../.opencode/tools/changed-files.ts'
```

**Causas:**
- A instalação em `~/.opencode` está faltando ou incompleta nesta máquina.
  Em geral `tools/` e `plugins/` existem, mas `plugins/lib/` não terminou de
  ser copiado (uma instalação interrompida, ou um problema de armazenamento
  ou permissão, mais comum no sistema de arquivos do Android). Tanto a
  ferramenta `changed-files` quanto o plugin `ecc-hooks` dependem de
  `plugins/lib/changed-files-store.js`. Como o `ecc-hooks.ts` é o ponto de
  entrada do plugin no OpenCode (carregado uma vez no início da sessão, antes
  do arquivo barrel `tools/index.ts`), uma dependência faltando ali derrubava
  a sessão inteira do OpenCode antes de qualquer hook carregar, e não só
  aquela ferramenta.

**Soluções:**
```bash
# No repositório do ECC, procure e repare arquivos gerenciados ausentes/incompletos
ecc doctor --target opencode
ecc repair --target opencode

# Se não houver diferenças, mas plugins/ continuar faltando no aparelho,
# rode de novo o instalador do ECC para o destino opencode
```

**Observação:** se você também estiver vendo
`ProviderModelNotFoundError: Model not found: openai/gpt-5.5` com referência a
`~/.config/opencode/oh-my-opencode-slim.json`, esse arquivo pertence ao plugin
de terceiros [`oh-my-opencode-slim`](https://github.com/alvinunreal/oh-my-opencode-slim),
não ao ECC; o ECC nunca escreve em `~/.config/opencode/`. Corrija ali o
prefixo do modelo (`opencode/...` em vez de `openai/...`) ou reporte no
projeto dele.

---

## Problemas de desempenho

### Respostas lentas

**Sintoma:** o agente leva mais de 30 segundos para responder

**Causas:**
- Arquivos de observação grandes
- Hooks ativos demais
- Latência de rede até a API

**Soluções:**
```bash
# Arquive observações grandes em vez de apagá-las
archive_dir="$HOME/.claude/homunculus/archive/$(date +%Y%m%d)"
mkdir -p "$archive_dir"
find ~/.claude/homunculus/projects -name "observations.jsonl" -size +10M -exec sh -c '
  for file do
    base=$(basename "$(dirname "$file")")
    gzip -c "$file" > "'"$archive_dir"'/${base}-observations.jsonl.gz"
    : > "$file"
  done
' sh {} +

# Desative temporariamente os hooks que não usa
# Edite ~/.claude/settings.json

# Mantenha pequenos os arquivos de observação ativos
# Arquivos grandes devem ficar em ~/.claude/homunculus/archive/
```

### Uso alto de CPU

**Sintoma:** o Claude Code consumindo 100% da CPU

**Causas:**
- Loops infinitos de observação
- Monitoramento de arquivos em pastas grandes
- Vazamentos de memória em hooks

**Soluções:**
```bash
# Procure processos descontrolados
top -o cpu | grep claude

# Desative o aprendizado contínuo temporariamente
touch ~/.claude/homunculus/disabled

# Reinicie o Claude Code
# Cmd/Ctrl+Q e abra de novo

# Verifique o tamanho dos arquivos de observação
du -sh ~/.claude/homunculus/*/
```

---

## Mensagens de erro comuns

### "EACCES: permission denied"

```bash
# Corrija as permissões dos hooks
find ~/.claude/plugins -name "*.sh" -exec chmod +x {} \;

# Corrija as permissões da pasta de observações
chmod -R u+rwX,go+rX ~/.claude/homunculus
```

### "MODULE_NOT_FOUND"

```bash
# Instale as dependências do plugin
# Troque <version> pela versão mostrada em `claude plugin list`, por exemplo 2.2.3
cd "$HOME/.claude/plugins/cache/ecc/ecc/<version>"
npm install

# Ou, na instalação manual
cd ~/.claude/plugins/ecc
npm install
```

### "spawn UNKNOWN"

```bash
# Específico do Windows: garanta que os scripts usam a quebra de linha certa
# Converta CRLF para LF
find ~/.claude/plugins -name "*.sh" -exec dos2unix {} \;

# Ou instale o dos2unix
# macOS: brew install dos2unix
# Ubuntu: sudo apt install dos2unix
```

---

## Como conseguir ajuda

Se o problema continuar:

1. **Veja as issues no GitHub**: [github.com/affaan-m/ECC/issues](https://github.com/affaan-m/ECC/issues)
2. **Ative os logs de depuração**:
   ```bash
   export CLAUDE_DEBUG=1
   export CLAUDE_LOG_LEVEL=debug
   ```
3. **Colete informações de diagnóstico**:
   ```bash
   claude --version
   node --version
   python3 --version
   echo $CLAUDE_PACKAGE_MANAGER
   ls -la ~/.claude/plugins/cache/
   ```
4. **Abra uma issue**: inclua os logs de depuração, as mensagens de erro e as informações de diagnóstico

---

## Documentação relacionada

- [README.pt-BR.md](./README.pt-BR.md): instalação e recursos
- [CONTRIBUTING.pt-BR.md](./CONTRIBUTING.pt-BR.md): diretrizes de desenvolvimento
- [docs/](./docs/): documentação detalhada (em inglês)
- [examples/](./examples/): exemplos de uso
