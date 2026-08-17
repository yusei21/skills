# Skills

[English](./README.md) | [Português](./README.pt-BR.md) | **简体中文**

这是一个持续维护并扩展的共享资源集合，面向多种 AI 编程工具，包含 skills、智能体、命令、规则、hooks、脚本以及 MCP 配置。

仓库采用规范来源架构：共享行为只在根目录维护一份，生成的元数据负责发现，工具专用目录作为适配层，而不是独立副本。

关于当前结构、归属规则、数据流、symlink 策略和结构验证的完整说明，请参阅 [`docs/ARCHITECTURE.zh-CN.md`](./docs/ARCHITECTURE.zh-CN.md)。

## 架构概览

仓库分为四层：

1. **规范资源** — `skills/`、`agents/`、`commands/`、`rules/`、`hooks/`、`scripts/` 和 `mcp-configs/`。
2. **发现元数据** — `.skill-index/skills.json` 和 `.skill-index/project-profile.json`。
3. **工具适配层** — `.claude/`、`.codex/`、`.agents/`、`.agy/`、`.mimocode/`、`.opencode/`、`.kimi/`，以及旧版兼容目录 `.gemini/`。
4. **打包与自动化** — `.claude-plugin/`、`.github/`、`docs/` 和仓库级说明文件。

工具专用目录应只包含集成文件、原生配置、链接或生成表示，不应成为共享 skills 或 agents 的独立实体副本。

## 自动路由

三个轻量项目 skill 用于协调发现与创建：

- `project-orchestrator` 检查仓库，并仅选择当前任务需要的 skills 与专家提示；
- `skill-builder` 在创建能力之前先搜索现有能力，然后负责扩展、验证和注册 skill；
- `subagent-builder` 在创建或注册专家子智能体之前先搜索已有角色。

专业 skills 保存在 `skills/` 中并按需加载，而不是在所有集成中全部注册。

规范 skill 索引由 `skills/*/SKILL.md` 生成：

```bash
node scripts/build-skill-index.js
```

发现数据保存在 `.skill-index/`：

- `skills.json` — 生成的 skill 目录；
- `project-profile.json` — 描述检测到的语言、框架、工具、重要目录以及推荐默认能力的仓库 profile。

不要在工具专用目录中维护第二套人工目录。

## 支持的集成

仓库目前提供以下集成入口：

- Claude Code：`.claude/`、`CLAUDE.md`，以及 `.claude-plugin/` 中的插件元数据；
- OpenAI Codex CLI：`.codex/` 与 `.agents/skills/`；
- Antigravity CLI：`.agy/`；
- MiMo Code：`.mimocode/`；
- OpenCode：`.opencode/`；
- Kimi：`.kimi/`。

旧版 `.gemini/` 内容保留用于兼容与迁移历史；当前 Antigravity 集成维护在 `.agy/` 下。

## 安装

克隆仓库，并从仓库根目录启动工具，以便加载项目本地说明和链接：

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

默认不要把所有 skills 复制到工具的全局目录。优先使用项目本地路由，或仅安装其他仓库真正需要的资源。

## MCP 服务器

共享目录位于 [`mcp-configs/mcp-servers.json`](./mcp-configs/mcp-servers.json)。凭据必须保存在环境变量或用户级配置中，绝不能提交到仓库。只启用任务真正需要的服务器，以减少上下文占用和攻击面。

## 文档

- [`docs/ARCHITECTURE.zh-CN.md`](./docs/ARCHITECTURE.zh-CN.md) — 仓库结构、归属边界、数据流和适配层策略；
- [`docs/GUIDE.zh-CN.md`](./docs/GUIDE.zh-CN.md) — 高级用法、编排、skill 路由、贡献方式和上下文管理；
- [`docs/ECOSYSTEM.zh-CN.md`](./docs/ECOSYSTEM.zh-CN.md) — 外部 skill 生态调研、选择标准、去重决策和实现说明。

面向用户的文档以英语、葡萄牙语（`pt-BR`）和简体中文（`zh-CN`）维护。实质性文档变更应在同一组改动中同步更新三种语言。

## 目录结构

```text
skills/
├── skills/              # 规范 skills
├── agents/              # 规范可复用 agents
├── commands/            # 共享命令
├── rules/               # 共享规则
├── hooks/               # 事件驱动自动化
├── scripts/             # 生成器、安装器和支持运行时
├── mcp-configs/         # 共享 MCP 目录
├── .skill-index/        # 生成的发现数据 + 项目 profile
├── .agents/             # 原生/Codex 兼容 skill 链接
├── .claude/             # Claude Code 适配层
├── .claude-plugin/      # Claude 插件/marketplace 元数据
├── .codex/              # Codex 原生配置和 agents
├── .agy/                # Antigravity 适配层
├── .mimocode/           # MiMo Code 适配层
├── .opencode/           # OpenCode 插件/集成
├── .kimi/               # Kimi 适配层
├── .gemini/             # 旧版兼容内容
├── .github/             # CI 与仓库自动化
├── docs/                # 多语言项目文档
├── AGENTS.md            # 共享路由说明
├── CLAUDE.md            # Claude 专用入口
├── README*.md           # 多语言项目概览
├── NOTICE*.md           # 署名与许可证说明
└── LICENSE
```

## 贡献

共享实现应保存在根目录中的规范目录。集成目录应引用这些资源，而不是复制它们。

新增 skill 之前：

1. 搜索当前索引，并与已有 skill 比较真实意图；
2. 如果存在近似能力，优先扩展已有规范 skill；
3. 验证 frontmatter、工作流边界、安全性、依赖和许可证；
4. 重新生成 skill 索引；
5. 只有在集成确实要求时才增加工具专用暴露方式；
6. 如果变更具有实质影响，同步更新英语、葡萄牙语和简体中文文档。

对于结构性变更，请遵循 [`docs/ARCHITECTURE.zh-CN.md`](./docs/ARCHITECTURE.zh-CN.md) 中的归属规则和验证清单。

## 署名与许可证

本项目整合并改编了多个开源来源的工作。来源、许可证、版权和适配说明统一维护在 [`NOTICE.zh-CN.md`](./NOTICE.zh-CN.md) 中。

MIT — 参阅 [`LICENSE`](./LICENSE) 与 [`NOTICE.zh-CN.md`](./NOTICE.zh-CN.md)。
