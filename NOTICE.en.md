# Notice

*[Leia em português](./NOTICE.md)*

This repository incorporates content from third-party open source projects,
listed below with their source, copyright, and license.

---

### everything-claude-code

- **Source:** https://github.com/affaan-m/everything-claude-code
- **Copyright:** (c) 2026 Affaan Mustafa
- **License:** MIT

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

**What was kept / adapted / removed compared to the original:**

- **Kept:** `agents/`, `skills/`, `rules/`, `hooks/`, `scripts/`, `commands/`,
  `mcp-configs/`, `.codex/`, `.opencode/`.
- **Adapted:** `.gemini/` was restructured for **Antigravity CLI (`agy`)**, the
  successor to the discontinued Gemini CLI — general config moved to
  `.gemini/antigravity-cli/` and MCP config to `.gemini/config/mcp_config.json`.
- **Removed:** `ecc2/`, `tests/`, `.github/`, `.kiro/`, `.trae/`, `.codebuddy/`
  and other harness-specific scaffolding not needed for this personal collection.

---

<!-- When adding content from another repository, copy the block below, fill it in, and paste it above this line

### repo-name

- **Source:** https://github.com/user/repo
- **Copyright:** (c) YYYY Author
- **License:** [MIT / Apache-2.0 / BSD / etc.]

```
(paste the original license text here)
```

---
-->
