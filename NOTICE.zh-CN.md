# 来源与许可证说明

[English](./NOTICE.en.md) | [Português](./NOTICE.md) | **简体中文**

本仓库包含并改编来自第三方开源项目的内容。以下说明用于保留所使用材料的来源、版权和许可证信息。

---

### everything-claude-code

- **来源：** https://github.com/affaan-m/everything-claude-code
- **Copyright：** (c) 2026 Affaan Mustafa
- **许可证：** MIT

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

## 本仓库中的适配

当前结构在仓库根目录维护共享规范来源：

- `skills/`：skills；
- `agents/`：智能体定义；
- `commands/`、`rules/`、`hooks/`、`scripts/` 和 `mcp-configs/`：支持资源。

各工具的集成目录已重新组织，以减少容易产生差异的重复副本：

- `.claude/`、`.codex/`、`.agents/`、`.agy/`、`.mimocode/`、`.opencode/` 和 `.kimi/` 仅保存工具特定的配置、文档和链接；
- 共享 skills 与智能体保留在根目录中的规范来源；
- `project-orchestrator`、`skill-builder` 和 `subagent-builder` 是本仓库增加的扩展，用于自动路由、创建和委派；
- `.gemini/` 保留为旧版兼容与迁移历史内容，当前 Antigravity 集成维护在 `.agy/` 下。

被删除或合并的内容可能包括重复副本、测试、脚手架，以及不属于当前架构的工具专用集成。本节仅说明此 fork 的组织方式，不改变任何第三方许可证或署名要求。

---

<!-- 添加来自其他仓库的实际复制或改编内容时，请复制下面的模板，填写后放到此行上方

### 仓库名称

- **来源：** https://github.com/user/repo
- **Copyright：** (c) YYYY 作者
- **许可证：** [MIT / Apache-2.0 / BSD / 等]

```text
（在此粘贴原始许可证文本）
```

---
-->
