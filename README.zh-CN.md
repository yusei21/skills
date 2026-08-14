# Skills

[English](./README.md) | [Português](./README.pt-BR.md) | **简体中文**

这是一个持续维护并扩展的共享资源集合，面向多种 AI 编程工具，包含 skills、智能体、命令、规则、hooks、脚本以及 MCP 配置。

本仓库在根目录维护规范来源：

- `skills/`：可复用工作流与领域知识；
- `agents/`：可复用的智能体角色定义；
- `commands/`、`rules/`、`hooks/`、`scripts/` 和 `mcp-configs/`：共享支持资源。

`.claude/`、`.codex/`、`.agents/`、`.agy/`、`.mimocode/`、`.opencode/` 等特定工具目录应仅包含集成文件、原生配置以及指向规范资源的链接，不应维护共享 skills 或智能体的独立实体副本。

本项目整合并改编了多个开源来源的工作。来源、许可证、版权和适配说明统一维护在 [`NOTICE.zh-CN.md`](./NOTICE.zh-CN.md) 中。

高级用法、编排、skill 路由、贡献方式和上下文管理请参阅 [`docs/GUIDE.zh-CN.md`](./docs/GUIDE.zh-CN.md)。当前外部 skill 生态调研、选择标准、去重决策以及实现说明请参阅 [`docs/ECOSYSTEM.zh-CN.md`](./docs/ECOSYSTEM.zh-CN.md)。

## 自动路由

三个项目级 skill 用于协调发现与创建：

- `project-orchestrator` 检查仓库，并仅选择当前任务需要的 skills 与专家提示；
- `skill-builder` 在创建能力之前先搜索现有能力，然后负责扩展、验证和注册 skill；
- `subagent-builder` 在创建或注册专家子智能体之前先搜索已有角色。

专业 skills 保存在 `skills/` 中并按需加载。这样可以避免在每个工具中注册整个目录，从而降低上下文消耗。

规范 skill 索引由 `scripts/build-skill-index.js` 根据 `skills/*/SKILL.md` 自动生成，并通过 GitHub Actions 保持同步：

```bash
node scripts/build-skill-index.js
```

发现数据保存在 `.skill-index/skills.json`。不要在工具特定目录中手工维护第二套 skill 目录。

## 重点工作流 skills

最新的生态调研在检查现有目录重叠后，最终增加了三个独立能力：

- `systematic-debugging` — 基于证据的根因分析，覆盖可复现故障、可证伪假设、故障隔离与回归验证；
- `verification-before-completion` — 在 agent 宣称实现、调试、迁移或自动化工作“已完成”之前，要求提供当前证据；
- `composition-patterns` — 使用组合、slots、controlled/uncontrolled 状态、compound components 和明确扩展点来设计可复用 UI 组件 API。

宽泛的 React 和 Web 设计候选能力被有意放弃，因为仓库已经通过 `react-patterns`、`react-performance`、`design-system`、`frontend-design-direction`、`make-interfaces-feel-better` 等 skills 提供了更强且重叠的覆盖。完整决策记录见 [`docs/ECOSYSTEM.zh-CN.md`](./docs/ECOSYSTEM.zh-CN.md)。

## 支持的集成

仓库目前提供以下集成入口：

- Claude Code：`.claude/` 与 `CLAUDE.md`；
- OpenAI Codex CLI：`.codex/` 与 `.agents/skills/`；
- Antigravity CLI：`.agy/`；
- MiMo Code：`.mimocode/`；
- OpenCode：`.opencode/`；
- Kimi：`.kimi/`。

旧版 `.gemini/` 内容保留用于兼容与迁移历史；当前 Antigravity 集成维护在 `.agy/` 下。

## 安装

克隆仓库，并从仓库根目录启动工具，以便加载项目本地的说明和链接：

```bash
git clone git@github.com:yusei21/skills.git
cd skills
```

示例：

```bash
claude
codex
agy
opencode
```

当当前 Claude Code 版本以及本仓库插件元数据支持时，可按以下方式安装 Claude Code 插件：

```text
/plugin marketplace add git@github.com:yusei21/skills.git
/plugin install skills@skills
```

默认不要把所有 skills 复制到工具的全局目录。优先使用本项目的本地路由 skills，或仅在其他仓库中安装真正需要的资源。

## MCP 服务器

共享目录位于 [`mcp-configs/mcp-servers.json`](./mcp-configs/mcp-servers.json)。凭据必须保存在环境变量或用户级配置中，绝不能提交到仓库。只启用任务真正需要的服务器，以减少上下文占用和攻击面。

## 文档策略

面向用户的文档按以下顺序维护：

1. 英语 — 规范来源；
2. 葡萄牙语（`pt-BR`）；
3. 简体中文（`zh-CN`）。

当文档发生实质变化时，应在同一组变更中更新三种语言版本。代码标识符、命令名称、文件路径、API 名称和配置键默认保持英语，除非底层工具明确要求本地化。

## 目录结构

```text
skills/
├── skills/          # 规范 skills
├── agents/          # 规范智能体提示
├── commands/        # 共享命令
├── rules/           # 共享规则
├── hooks/           # 事件驱动自动化
├── scripts/         # 支持脚本与运行时
├── mcp-configs/     # 共享 MCP 目录
├── .skill-index/    # 自动生成的规范 skill 发现索引
├── .agents/         # Codex/原生 skill 发现链接
├── .claude/         # Claude 专用集成
├── .codex/          # Codex 配置与原生角色
├── .agy/            # Antigravity 专用集成
├── .mimocode/       # MiMo Code 专用集成
├── .opencode/       # OpenCode 插件与集成
├── .kimi/           # Kimi 专用集成
├── .gemini/         # 旧版兼容内容
├── docs/            # 多语言指南与生态调研
├── AGENTS.md        # 共享自动路由说明
├── CLAUDE.md        # Claude 专用入口
├── NOTICE.md        # 葡萄牙语来源与许可证说明
├── NOTICE.en.md     # 英语来源与许可证说明
└── NOTICE.zh-CN.md  # 简体中文来源与许可证说明
```

## 贡献

共享实现应保存在根目录中的规范目录。集成目录应引用这些资源，而不是复制它们。

新增 skill 之前：

1. 搜索当前索引，并与已有 skill 比较真实意图；
2. 如果存在近似能力，优先扩展已有规范 skill；
3. 验证 frontmatter、工作流边界、安全性和许可证；
4. 重新生成 skill 索引；
5. 如果变更影响用户使用方式，同时更新英语、葡萄牙语和简体中文文档。

## 许可证

MIT — 参阅 [`LICENSE`](./LICENSE) 与 [`NOTICE.zh-CN.md`](./NOTICE.zh-CN.md)。
