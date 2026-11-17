# 为 yus 做贡献

[English](CONTRIBUTING.md) | [Português](CONTRIBUTING.pt-BR.md) | **中文**

感谢你愿意贡献！本仓库是面向 Claude Code 用户的社区资源。

## 目录

- [我们需要什么](#我们需要什么)
- [快速开始](#快速开始)
- [贡献技能](#贡献技能)
- [技能改编政策](#技能改编政策)
- [贡献智能体](#贡献智能体)
- [贡献钩子](#贡献钩子)
- [贡献命令](#贡献命令)
- [MCP 与文档（如 Context7）](#mcp-与文档如-context7)
- [其他环境与翻译](#其他环境与翻译)
- [Pull Request 流程](#pull-request-流程)
- [发布](#发布)
- [准则](#准则)
- [文件命名](#文件命名)
- [有问题？](#有问题)

---

## 我们需要什么

### 智能体
能把特定任务做好的新智能体：
- 按语言的评审者（Python、Go、Rust）
- 框架专家（Django、Rails、Laravel、Spring）
- DevOps 专家（Kubernetes、Terraform、CI/CD）
- 领域专家（ML 流水线、数据工程、移动端）

### 技能
工作流定义和领域知识：
- 语言最佳实践
- 框架模式
- 测试策略
- 架构指南

### 钩子
实用的自动化：
- lint/格式化钩子
- 安全检查
- 校验钩子
- 通知钩子

### 命令
触发实用工作流的斜杠命令：
- 部署命令
- 测试命令
- 代码生成命令

---

## 快速开始

```bash
# 1. Fork 并克隆
gh repo fork yusei21/yus --clone
cd yus

# 2. 创建分支
git checkout -b feat/my-contribution

# 3. 添加你的贡献（见下文各节）

# 4. 本地测试
cp -r skills/<department>/my-skill ~/.claude/skills/  # 技能
# 然后在 Claude Code 中测试

# 5. 提交 PR
git add . && git commit -m "feat: add my-skill" && git push -u origin feat/my-contribution
```

---

## 贡献技能

技能是 Claude Code 根据上下文加载的知识模块。

> **完整指南：**关于如何编写有效技能的详细说明，见
> [Skill Development Guide](docs/SKILL-DEVELOPMENT-GUIDE.md)（英文）。内容包括：
> - 技能的架构和分类
> - 如何写出有效的内容（附示例）
> - 最佳实践和常见模式
> - 测试与校验
> - 完整的示例集

### 目录结构

```
skills/
└── <department>/
    └── your-skill-name/
        └── SKILL.md
```

在 `manifests/skill-departments.json` 中选择部门并登记该技能，然后运行
`npm run departments:sync`，让部门插件收录它。

### SKILL.md 模板

技能、智能体和命令都用英文编写，因此下面的模板保留英文。

```markdown
---
name: your-skill-name
description: Brief description shown in skill list and used for auto-activation
origin: yus
---

# Your Skill Title

Brief overview of what this skill covers.

## When to Activate

Describe scenarios where Claude should use this skill. This is critical for auto-activation.

## Core Concepts

Explain key patterns and guidelines.

## Code Examples

\`\`\`typescript
// Include practical, tested examples
function example() {
  // Well-commented code
}
\`\`\`

## Anti-Patterns

Show what NOT to do with examples.

## Best Practices

- Actionable guidelines
- Do's and don'ts
- Common pitfalls to avoid

## Related Skills

Link to complementary skills (e.g., `related-skill-1`, `related-skill-2`).
```

### 技能分类

| 分类 | 用途 | 示例 |
|------|------|------|
| **语言规范** | 惯用法、约定、最佳实践 | `python-patterns`、`golang-patterns` |
| **框架模式** | 特定框架的指导 | `django-patterns`、`nextjs-patterns` |
| **工作流** | 分步骤的流程 | `tdd-workflow`、`refactoring-workflow` |
| **领域知识** | 专业领域 | `security-review`、`api-design` |
| **工具集成** | 工具/库的用法 | `docker-patterns`、`supabase-patterns` |
| **模板** | 项目专用的技能模板 | `docs/examples/project-guidelines-template.md` |

### 技能改编政策

如果你要移植来自其他仓库、插件、环境或个人提示词集合的想法，请在提交 PR 前阅读
[Skill Adaptation Policy](docs/skill-adaptation-policy.md)（英文）。

简要说明：

- 借鉴的是背后的想法，而不是外部产品的身份
- 当 yus 对技能做了实质改动或扩展时，给它改名
- 优先使用 yus 原生的规则、技能、脚本和 MCP，而不是默认引入新的第三方依赖
- 不要发布主要价值只是让用户安装未经审查的包的技能

### 技能检查清单

- [ ] 专注于一个领域/技术（不要过于宽泛）
- [ ] 包含用于自动激活的 "When to Activate" 部分
- [ ] 包含实用、可直接复制的代码示例
- [ ] 展示反模式（不应该怎么做）
- [ ] 少于 500 行（最多 800 行）
- [ ] 使用清晰的章节标题
- [ ] 已在 Claude Code 中测试
- [ ] 链接到相关技能
- [ ] 不含敏感数据（API 密钥、令牌、路径）
- [ ] frontmatter 中声明的 `name:` 与目录名一致
- [ ] frontmatter 的 `description:` 是行内字符串或折叠（`>`）标量，而不是字面块
  （`|`、`|-` 或 `|+`）——字面块会保留内部换行，导致表格渲染出错

### 技能示例

| 技能 | 分类 | 用途 |
|------|------|------|
| `coding-standards/` | 语言规范 | TypeScript/JavaScript 模式 |
| `frontend-patterns/` | 框架模式 | React 和 Next.js 最佳实践 |
| `backend-patterns/` | 框架模式 | API 和数据库模式 |
| `security-review/` | 领域知识 | 安全检查清单 |
| `tdd-workflow/` | 工作流 | 测试驱动开发流程 |
| `docs/examples/project-guidelines-template.md` | 模板 | 项目专用技能模板 |

---

## 贡献智能体

智能体是通过 Task 工具调用的专用助手。

### 文件位置

```
agents/your-agent-name.md
```

### 智能体模板

```markdown
---
name: your-agent-name
description: What this agent does and when Claude should invoke it. Be specific!
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

You are a [role] specialist.

## Your Role

- Primary responsibility
- Secondary responsibility
- What you DO NOT do (boundaries)

## Workflow

### Step 1: Understand
How you approach the task.

### Step 2: Execute
How you perform the work.

### Step 3: Verify
How you validate results.

## Output Format

What you return to the user.

## Examples

### Example: [Scenario]
Input: [what user provides]
Action: [what you do]
Output: [what you return]
```

### 智能体字段

| 字段 | 说明 | 选项 |
|------|------|------|
| `name` | 小写，用连字符分隔 | `code-reviewer` |
| `description` | 用于决定何时调用 | 要具体！ |
| `tools` | 只列需要的 | `Read, Write, Edit, Bash, Grep, Glob, WebFetch, Task`，智能体使用 MCP 时也可以是 MCP 工具名（如 `mcp__context7__resolve-library-id`、`mcp__context7__query-docs`） |
| `model` | 复杂程度 | `haiku`（简单）、`sonnet`（编码）、`opus`（复杂） |

### 智能体示例

| 智能体 | 用途 |
|--------|------|
| `tdd-guide.md` | 测试驱动开发 |
| `code-reviewer.md` | 代码评审 |
| `security-reviewer.md` | 安全扫描 |
| `build-error-resolver.md` | 修复构建错误 |

---

## 贡献钩子

钩子是由 Claude Code 事件触发的自动行为。

### 文件位置

```
hooks/hooks.json
```

### 钩子类型

| 类型 | 触发时机 | 用途 |
|------|----------|------|
| `PreToolUse` | 工具运行前 | 校验、警告、拦截 |
| `PostToolUse` | 工具运行后 | 格式化、检查、通知 |
| `SessionStart` | 会话开始 | 加载上下文 |
| `Stop` | 会话结束 | 清理、审计 |

### 钩子格式

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "tool == \"Bash\" && tool_input.command matches \"rm -rf /\"",
        "hooks": [
          {
            "type": "command",
            "command": "echo '[Hook] BLOCKED: Dangerous command' && exit 1"
          }
        ],
        "description": "Block dangerous rm commands"
      }
    ]
  }
}
```

### matcher 语法

```javascript
// 匹配特定工具
tool == "Bash"
tool == "Edit"
tool == "Write"

// 匹配输入模式
tool_input.command matches "npm install"
tool_input.file_path matches "\\.tsx?$"

// 组合条件
tool == "Bash" && tool_input.command matches "git push"
```

### 钩子示例

```json
// 拦截不在 tmux 中运行的开发服务器
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"npm run dev\"",
  "hooks": [{"type": "command", "command": "echo 'Use tmux for dev servers' && exit 1"}],
  "description": "Ensure dev servers run in tmux"
}

// 编辑 TypeScript 后自动格式化
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\.tsx?$\"",
  "hooks": [{"type": "command", "command": "npx prettier --write \"$file_path\""}],
  "description": "Format TypeScript files after edit"
}

// git push 前提醒
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"git push\"",
  "hooks": [{"type": "command", "command": "echo '[Hook] Review changes before pushing'"}],
  "description": "Reminder to review before push"
}
```

### 钩子检查清单

- [ ] matcher 足够具体（不要过于宽泛）
- [ ] 包含清晰的错误/提示信息
- [ ] 使用正确的退出码（`exit 1` 拦截，`exit 0` 放行）
- [ ] 经过充分测试
- [ ] 有描述

---

## 贡献命令

命令是用户通过 `/command-name` 调用的操作。

### 文件位置

```
commands/your-command.md
```

### 命令模板

```markdown
---
description: Brief description shown in /help
---

# Command Name

## Purpose

What this command does.

## Usage

\`\`\`
/your-command [args]
\`\`\`

## Workflow

1. First step
2. Second step
3. Final step

## Output

What the user receives.
```

### 命令示例

| 命令 | 用途 |
|------|------|
| `commit.md` | 创建 git 提交 |
| `code-review.md` | 评审代码改动 |
| `tdd.md` | TDD 工作流 |
| `e2e.md` | E2E 测试 |

---

## MCP 与文档（如 Context7）

技能和智能体可以使用 **MCP（Model Context Protocol）** 工具获取最新数据，而不只依赖训练数据。
这对文档尤其有用。

- **Context7** 是一个提供 `resolve-library-id` 和 `query-docs` 的 MCP 服务器。当用户询问库、
  框架或 API 时使用它，让回答反映当前的文档和代码示例。
- 贡献依赖最新文档的**技能**（如配置、API 用法）时，说明如何使用相关 MCP 工具（如先解析库 ID，
  再查询文档），并以 `documentation-lookup` 技能或 Context7 作为参考模式。
- 贡献回答文档/API 问题的**智能体**时，在智能体的工具中加入 Context7 的 MCP 工具名（如
  `mcp__context7__resolve-library-id`、`mcp__context7__query-docs`），并写明"解析 → 查询"的流程。
- **mcp-configs/mcp-servers.json** 中包含 Context7 条目；用户在自己的环境（如 Claude Code、
  Cursor）中启用它，即可使用 documentation-lookup 技能（位于
  `skills/research/documentation-lookup/`）和 `/docs` 命令。

---

## 其他环境与翻译

### 技能子集（Codex 和 Cursor）

yus 为其他环境提供技能子集：

- **Codex：** `.agents/skills/`——`agents/openai.yaml` 中列出的技能由 Codex 加载。
- **Cursor：** `.cursor/skills/`——为 Cursor 打包了一部分技能。

当你**新增一个技能**并希望它在 Codex 或 Cursor 中可用时：

1. 照常把技能放到 `skills/<department>/your-skill-name/`。
2. 如果要在 **Codex** 中可用，把它加到 `.agents/skills/`（复制技能目录或添加引用），并在需要时
   确保 `agents/openai.yaml` 中引用了它。
3. 如果要在 **Cursor** 中可用，按 Cursor 的结构把它加到 `.cursor/skills/`。

可参考这些目录中已有的技能来确认结构。这些子集需要手动保持同步；如果你更新了它们，请在 PR 中
说明。

### 翻译

根目录文档（README、NOTICE、CONTRIBUTING、SECURITY、TROUBLESHOOTING、CODE_OF_CONDUCT、
COMMANDS-QUICK-REF 和三篇指南）在英文文件旁边都有葡萄牙语（`*.pt-BR.md`）和中文
（`*.zh-CN.md`）版本。修改其中任何一个时，请在同一个 PR 中更新翻译，或在 PR 中说明翻译尚待
更新。`docs/`、`skills/`、`agents/` 和 `commands/` 下的内容只有英文。

---

## 提交 issue

在任意 20 分钟内最多提交五个 issue，并且同时最多保持十个 issue 打开。
[issue 审核政策](.github/ISSUE_MODERATION.md)（英文）说明了自动关闭、重新打开和提醒维护者的规则。
政策生效时已打开的 issue 保持打开。

## Pull Request 流程

### 提交数量

在任意 20 分钟内最多提交五个 PR。自动审核会关闭并锁定超出的 PR，包括草稿。20 分钟内提交超过
十个会触发维护者提醒并尝试封禁账号。已关闭的 PR 仍计入时间窗口。拥有仓库写权限的贡献者不受
突发审核限制。维护者可以通过审核提醒处理例外情况。

同时也请最多保持十个 PR 打开。当你打开或重新打开超过上限的 PR 时，自动化会关闭该 PR，并留言
说明数量。本次政策更新前已打开的 PR 保持打开，即使作者超过十个。延迟运行的检查可能会关闭运行时
已打开的、超出上限的较新 PR。该上限适用于所有作者，包括维护者。先让 PR 合并，或关闭不再需要的
PR，然后再重新打开。
十个打开的 PR 已经超过任何一位评审者能同时跟进的数量，这样可以把评审时间留给你最在意的工作。

激活方式、凭据要求和恢复步骤见[审核运行手册](.github/PR_MODERATION.md)（英文）。

### 1. PR 标题格式

```
feat(skills): add rust-patterns skill
feat(agents): add api-designer agent
feat(hooks): add auto-format hook
fix(skills): update React patterns
docs: improve contributing guide
```

### 2. PR 描述

```markdown
## Summary
What you're adding and why.

## Type
- [ ] Skill
- [ ] Agent
- [ ] Hook
- [ ] Command

## Testing
How you tested this.

## Checklist
- [ ] Follows format guidelines
- [ ] Tested with Claude Code
- [ ] No sensitive info (API keys, paths)
- [ ] Clear descriptions
```

### 3. 推送之前（避免 CI 失败）

在本地运行 `npm test`。它与 CI 运行的检查相同，几乎能发现下面列出的所有问题。

- **改了 `package.json`？**如果改动了 `bin`、`files` 或依赖，运行
  `yarn install --mode=update-lockfile` 并提交 `yarn.lock` 的变更。在公开 PR 上，CI 以加固模式
  运行 Yarn，如果锁文件需要修改就会失败，因此过期的 `yarn.lock` 本身就会让构建失败。
- **新增了技能、命令、智能体、钩子或 CLI 工具？**把它需要的地方都接好：
  - `package.json`（`bin` 和 `files`）、`manifests/install-components.json`、
    `manifests/install-modules.json` 和 `agent.yaml`
  - 重新生成目录（`npm run catalog:sync`）和命令注册表（`npm run command-registry:write`）
  - 更新文档表格（`README.md`、`COMMANDS-QUICK-REF.md`、`docs/COMMAND-AGENT-MAP.md`）
  - 有新的脚本路径？把它加入发布白名单（`tests/scripts/npm-publish-surface.test.js`）
  - 其他环境：对于 Codex，添加 `.agents/skills/<name>/` 以及 `agents/openai.yaml`。Codex 的
    frontmatter 校验器只允许 `name`、`description`、`metadata`、`license` 和 `allowed-tools`，
    因此要从该副本中去掉 `version` 之类的键。

### 4. 评审流程

1. 维护者会在 48 小时内评审
2. 如有要求，请根据反馈修改
3. 批准后合并到 main

---

## 发布

发布按固定节奏进行，大约每两周一次；安全或数据丢失问题的修复会在周期外单独发布。

1. 在各处同步版本号：`VERSION`、`package.json`，以及（通过
   `node scripts/build-pi-core.js`）`pi/core/package.json`。
2. 更新 `CHANGELOG.md`，并在 `docs/releases/<version>/release-notes.md` 写好经过评审的发布说明
   （发布工作流需要它）。
3. 在 `main` 上打 `vX.Y.Z` 标签并推送。`release.yml` 工作流会确认标签恰好位于 `origin/main`，
   检查 VERSION 与 pi/core 是否同步，在 Linux、macOS 和 Windows 上测试打包后的确切产物，带出处
   证明发布到 npm，校验注册表中的字节，并根据评审过的说明创建 GitHub Release。

标签和 GitHub Release 一旦发布就不可更改：下游打包者会轮询 `/releases`，下载
`archive/refs/tags/vX.Y.Z.tar.gz` 并固定它的 sha256。不要移动或重打已发布版本的标签，而应发布
新的补丁版本。

---

## 准则

### 应该
- 让贡献保持聚焦和模块化
- 写清楚描述
- 提交前先测试
- 遵循现有模式
- 写明依赖

### 不应该
- 包含敏感数据（API 密钥、令牌、路径）
- 添加过于复杂或过于小众的配置
- 提交未经测试的贡献
- 重复实现已有的功能

---

## 文件命名

- 使用小写和连字符：`python-reviewer.md`
- 名称要有描述性：用 `tdd-workflow.md`，不要用 `workflow.md`
- 名称与文件名一致

---

## 有问题？

- **Issues：**[github.com/yusei21/yus/issues](https://github.com/yusei21/yus/issues)

---

感谢你的贡献！让我们一起打造一个出色的资源。
