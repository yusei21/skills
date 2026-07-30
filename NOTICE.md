# Aviso de Origem

*[Read this in English](./NOTICE.en.md)*

Este repositório incorpora conteúdo de projetos open source de terceiros,
listados abaixo com sua origem, copyright e licença.

---

### everything-claude-code

- **Origem:** https://github.com/affaan-m/everything-claude-code
- **Copyright:** (c) 2026 Affaan Mustafa
- **Licença:** MIT

```
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

**O que foi mantido / adaptado / removido em relação ao original:**

- **Mantido:** `agents/`, `skills/`, `rules/`, `hooks/`, `scripts/`,
  `commands/`, `mcp-configs/`, `.codex/`, `.opencode/`.
- **Adaptado:** `.gemini/` foi reestruturado para o **Antigravity CLI (`agy`)**,
  sucessor do Gemini CLI descontinuado — config geral em
  `.gemini/antigravity-cli/` e config de MCP em `.gemini/config/mcp_config.json`.
- **Removido:** `ecc2/`, `tests/`, `.github/`, `.kiro/`, `.trae/`, `.codebuddy/`
  e outros andaimes específicos de harness desnecessários para esta coleção
  pessoal.

---

<!-- Ao adicionar conteúdo de outro repositório, copie o bloco abaixo, preencha e cole acima desta linha

### nome-do-repositorio

- **Origem:** https://github.com/usuario/repo
- **Copyright:** (c) AAAA Autor
- **Licença:** [MIT / Apache-2.0 / BSD / etc.]

```
(cole aqui o texto da licença original)
```

---
-->
