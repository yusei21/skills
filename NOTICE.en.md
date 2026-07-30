# Notice

*[Leia em português](./NOTICE.md)*

This repository incorporates and adapts content from third-party open source
projects. The notices below preserve the source, copyright, and license of the
incorporated materials.

---

### everything-claude-code

- **Source:** https://github.com/affaan-m/everything-claude-code
- **Copyright:** (c) 2026 Affaan Mustafa
- **License:** MIT

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

## Adaptations in this repository

The current structure uses shared canonical sources at the repository root:

- `skills/` for skills;
- `agents/` for agent definitions;
- `commands/`, `rules/`, `hooks/`, `scripts/`, and `mcp-configs/` for supporting resources.

Tool-specific integrations were reorganized to reduce divergent copies:

- `.claude/`, `.codex/`, `.agents/`, `.agy/`, `.mimocode/`, `.opencode/`, and
  `.kimi/` hold tool-specific configuration, documentation, and links;
- shared skills and agents remain in the canonical root sources;
- `project-orchestrator`, `skill-builder`, and `subagent-builder` were added as
  repository-local extensions for automatic routing, creation, and delegation;
- `.gemini/` remains as legacy compatibility and migration-history content,
  while the active Antigravity integration is maintained under `.agy/`.

Removed or consolidated content may include redundant copies, tests,
scaffolding, and tool-specific integrations that are not part of the current
architecture. This section documents the organization of this fork; it does not
change third-party licenses or attribution.

---

<!-- When adding content from another repository, copy the block below, fill it in, and paste it above this line

### repo-name

- **Source:** https://github.com/user/repo
- **Copyright:** (c) YYYY Author
- **License:** [MIT / Apache-2.0 / BSD / etc.]

```text
(paste the original license text here)
```

---
-->
