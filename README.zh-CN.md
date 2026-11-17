# yus

[English](README.md) | [Português](README.pt-BR.md) | **中文**

面向 Claude Code 及其他编程智能体环境（Codex、Cursor、OpenCode、Gemini、Kimi 等）
的代理、技能、钩子、规则和斜杠命令。

你现在可以使用 71 个代理、326 个技能和 98 个命令。此外还有钩子、规则、记忆和持续学习
工作流。

| 类别 | 数量 | 说明 |
|------|------|------|
| 代理 | 71 | 用于规划、评审、修复构建、安全和领域工作的子代理 |
| 命令 | 98 | 转发到代理和技能的斜杠命令垫片 |
| 技能 | 326 | 工作流和领域知识，分为 18 个部门 |

## 在 Claude Code 中安装

把本仓库添加为插件市场，然后安装核心插件。想使用这些插件的人在自己的 Claude Code 中运行：

```text
/plugin marketplace add yusei21/yus
/plugin install yus@yus
```

`yus` 包含运行时（代理、命令、钩子、MCP 设置），以及仅 **core** 部门。再按需添加你
所用的部门：

```text
/plugin install yus-frontend@yus
/plugin install yus-backend@yus
```

也可以用 `yus-all-departments@yus` 一次安装全部部门。单独的部门和
`yus-all-departments` 只能二选一：它们列出的是同一批技能。

插件命令以插件名作为前缀，例如 `/yus:plan`。插件方式和下面的安装器是二选一：执行
`/plugin install` 后，不要再在上面运行完整安装器（`--profile full`），否则每个技能和
钩子都会安装两次。

### 为什么按部门划分

Claude Code 会把每个已安装技能的名称和描述放进每一次会话。用 `claude plugin details`
测得：

| 配置 | 常驻上下文 |
|------|------------|
| 上游 yus（所有技能在一个插件里） | 约 33,800 个 token |
| `yus`（运行时 + core） | 约 9,500 个 token |
| `yus` + `yus-frontend` | 约 11,400 个 token |
| `yus` + `yus-all-departments` | 约 36,700 个 token |

### 部门

| 插件 | 部门 | 技能数 | 范围 |
|------|------|--------|------|
| `yus` | 核心工程 | 18 | TDD、验证、git、代码规范、上下文管理 |
| `yus-frontend` | 前端与设计 | 23 | Web 界面、设计系统、无障碍、动效、UI 框架 |
| `yus-backend` | 后端与 API | 29 | 服务架构、API 契约、服务端框架 |
| `yus-languages` | 编程语言 | 18 | 各语言的惯用法与测试 |
| `yus-mobile` | 移动端与 Apple | 12 | Android、iOS/Swift、Flutter、React Native |
| `yus-data` | 数据与数据库 | 9 | SQL、ORM、缓存、分析、数据迁移 |
| `yus-ai-agents` | AI 与智能体 | 41 | 智能体架构、编排、提示词、LLM 成本、计算机操作 |
| `yus-ml` | 机器学习 | 5 | 模型的训练、评估与落地 |
| `yus-quality` | 质量、测试与性能 | 24 | E2E、评测、基准、审计、最小化代码评审 |
| `yus-security` | 安全 | 10 | 安全评审、扫描、智能体加固 |
| `yus-devops` | DevOps 与基础设施 | 18 | 容器、部署、环境、网络 |
| `yus-docs-product` | 文档、产品与知识 | 12 | 文档治理、决策、产品规划、代码图谱 |
| `yus-research` | 研究 | 10 | 深度研究、搜索、OSINT、科学数据库 |
| `yus-business` | 商业、内容与营销 | 17 | 写作、品牌、SEO、市场调研、社交媒体 |
| `yus-media` | 媒体与视频 | 11 | 视频生成与剪辑 |
| `yus-operations` | 运营与集成 | 20 | 邮件、计费、GitHub、Jira、Google Workspace |
| `yus-verticals` | 行业垂直领域 | 25 | 医疗、供应链、web3、预测市场 |
| `yus-admin` | yus 管理 | 24 | 安装配置、持续学习、记忆、成本、技能维护 |

分类定义在 [`manifests/skill-departments.json`](manifests/skill-departments.json)。

## 不用插件安装

选择性安装器把所选模块复制到各个环境自己的目录（`~/.claude`、`~/.codex`、`.cursor`
等）。无论源目录结构如何，安装后的技能始终是扁平的（`skills/<skill>/`）。

```bash
node scripts/yus.js setup                      # 引导式 Claude Code 配置
node scripts/yus.js install --profile developer
node scripts/yus.js catalog                    # 列出配置档和组件
node scripts/yus.js doctor                     # 检查已有安装
```

要手动复制单个技能，把它的文件夹直接复制到 `~/.claude/skills/` 下，例如
`cp -r skills/core/tdd-workflow ~/.claude/skills/`。Claude Code 不会查找那里的子文件夹。

## 仓库结构

```text
|-- agents/    # 专用子代理
|-- commands/  # 斜杠命令垫片
|-- skills/    # 按需加载的可复用工作流
|   |-- core/            每个部门一个文件夹，
|   |-- frontend/        部门内每个技能一个文件夹：
|   `-- ...              skills/<部门>/<技能>/SKILL.md
|-- hooks/       各环境的钩子定义
|-- rules/       始终生效的准则
|-- manifests/   安装模块、配置档、组件、部门
|-- scripts/     Node.js 运行时：钩子、安装器、CI 校验
|-- yus2/        Rust 编写的 TUI 与控制面
|-- src/llm/     Python 模型提供方抽象包
`-- tests/       Node.js 与 Python 测试套件
```

## 开发

要求：Node.js 22.12 或更新版本（推荐 Node 26 LTS）和 Git。只有 `yus2/` 和
`src/llm/` 需要 Rust 和 Python。

```bash
npm ci
npm test            # 校验器 + 完整 JS 测试
npm run typecheck   # 对标记了 // @ts-check 的文件运行 TypeScript 7
npm run lint
```

- 运行时代码仍是 CommonJS `.js`，因为钩子在用户自己安装的 `node` 下运行。类型安全来自
  由 TypeScript 检查的 JSDoc：在文件中加入 `// @ts-check`，它就会按 `strict` 模式检查。
- 新测试使用 `node:test`。`scripts/dev/migrate-test-to-node-test.js` 可以转换旧的测试。
- 添加技能：创建 `skills/<部门>/<技能>/SKILL.md`，在 `manifests/skill-departments.json`
  和一个安装模块中登记，然后运行
  `node scripts/ci/generate-department-plugins.js --write`。

## 许可证

MIT；见 [LICENSE](LICENSE)。来源、署名和第三方技能的许可证见
[NOTICE.zh-CN.md](NOTICE.zh-CN.md)。
