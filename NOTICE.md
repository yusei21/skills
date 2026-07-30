# Aviso de Origem

*[Read this in English](./NOTICE.en.md)*

Este repositório incorpora e adapta conteúdo de projetos open source de
terceiros. Os avisos abaixo preservam a origem, o copyright e a licença dos
materiais incorporados.

---

### everything-claude-code

- **Origem:** https://github.com/affaan-m/everything-claude-code
- **Copyright:** (c) 2026 Affaan Mustafa
- **Licença:** MIT

```text
MIT License

Copyright (c) 2026 Affaan Mustafa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Adaptações deste repositório

A estrutura atual usa fontes canônicas compartilhadas na raiz:

- `skills/` para skills;
- `agents/` para definições de agentes;
- `commands/`, `rules/`, `hooks/`, `scripts/` e `mcp-configs/` para recursos de apoio.

As integrações específicas de ferramentas foram reorganizadas para reduzir
cópias divergentes:

- `.claude/`, `.codex/`, `.agents/`, `.agy/`, `.mimocode/`, `.opencode/` e
  `.kimi/` mantêm configuração, documentação e links próprios;
- skills e agentes compartilhados permanecem nas fontes canônicas da raiz;
- `project-orchestrator`, `skill-builder` e `subagent-builder` foram adicionados
  como extensões locais deste repositório para roteamento, criação e delegação
  automáticos;
- `.gemini/` permanece como conteúdo legado de compatibilidade e histórico,
  enquanto a integração ativa do Antigravity é mantida em `.agy/`.

Conteúdo removido ou consolidado pode incluir cópias redundantes, testes,
andaimes e integrações específicas que não fazem parte da arquitetura atual.
Esta seção descreve a organização deste fork; ela não altera as licenças nem os
créditos dos materiais de terceiros.

---

<!-- Ao adicionar conteúdo de outro repositório, copie o bloco abaixo, preencha e cole acima desta linha

### nome-do-repositorio

- **Origem:** https://github.com/usuario/repo
- **Copyright:** (c) AAAA Autor
- **Licença:** [MIT / Apache-2.0 / BSD / etc.]

```text
(cole aqui o texto da licença original)
```

---
-->
