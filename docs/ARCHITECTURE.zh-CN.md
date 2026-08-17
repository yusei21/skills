# 仓库架构

[English](./ARCHITECTURE.md) | [Português](./ARQUITETURA.md) | **简体中文**

本文档描述仓库当前结构，以及规范资源、生成的发现数据、工具专用适配层和自动化之间的边界。

核心原则很简单：共享行为应只有一个规范实现。工具集成应暴露或引用该实现，而不是维护彼此独立的副本。

## 架构分层

仓库分为四个层次。

### 1. 规范资源

以下目录保存各集成共享的可复用源内容：

| 路径 | 职责 |
|---|---|
| `skills/` | 可复用工作流、操作步骤和领域知识。每个规范 skill 由自己的 `SKILL.md` 定义。 |
| `agents/` | 可复用的专家 agent 角色定义。 |
| `commands/` | 重复工作流的共享命令入口。 |
| `rules/` | 跨任务的行为和代码约束。 |
| `hooks/` | 事件驱动自动化与强制检查。 |
| `scripts/` | 确定性支持工具、生成器、安装器和运行时。 |
| `mcp-configs/` | 共享 MCP 服务器目录及相关配置。 |

影响多种工具的共享行为通常应优先在这些目录中修改。

### 2. 发现与生成元数据

`.skill-index/` 保存仓库级发现数据，用于避免把整个 skill 目录加载到上下文中。

当前文件包括：

- `.skill-index/skills.json` — 根据 `skills/*/SKILL.md` 生成的目录；
- `.skill-index/project-profile.json` — 描述检测到的语言、框架、工具、重要目录以及推荐默认 skills 的项目 profile。

规范索引通过以下命令生成：

```bash
node scripts/build-skill-index.js
```

`.skill-index/skills.json` 是生成数据，不应成为第二套人工维护的目录。

### 3. 工具适配层与原生配置

工具专用目录是集成层，而不是另一套事实来源：

| 路径 | 作用 |
|---|---|
| `.agents/` | 原生/Codex 兼容的 skill 发现链接。 |
| `.claude/` | Claude Code 项目集成以及轻量路由 skill 链接。 |
| `.codex/` | Codex 配置和原生 agent 定义。 |
| `.agy/` | Antigravity 集成。 |
| `.mimocode/` | MiMo Code 集成。 |
| `.opencode/` | OpenCode 插件与集成文件。 |
| `.kimi/` | Kimi 集成。 |
| `.gemini/` | 旧版兼容与迁移历史内容。 |

当工具支持链接或引用时，适配层应指向规范资源，不应维护同一共享 skill 或 agent 的独立实体副本。

目前多个集成暴露的轻量项目路由 skills 为：

- `project-orchestrator`；
- `skill-builder`；
- `subagent-builder`。

专业 skills 继续保存在 `skills/` 中，并按需发现和加载。

### 4. 打包、自动化与文档

其余顶层支持入口包括：

| 路径 | 作用 |
|---|---|
| `.claude-plugin/` | Claude Code 插件和 marketplace 元数据。 |
| `.github/` | 仓库自动化，包括 skill 索引同步 workflow。 |
| `docs/` | 多语言指南、架构文档和生态调研。 |
| `AGENTS.md` | 供兼容 agent/工具使用的共享自动路由说明。 |
| `CLAUDE.md` | 建立在 `AGENTS.md` 之上的 Claude 专用入口。 |
| `NOTICE*.md` | 署名、许可证和适配说明。 |

## 数据流

预期的数据流如下：

```text
skills/*/SKILL.md 和其他规范资源
                  │
                  ├── scripts/build-skill-index.js
                  │           │
                  │           └── .skill-index/skills.json
                  │
                  ├── project-orchestrator / builders
                  │           │
                  │           └── 按需加载 skills 与 agents
                  │
                  └── 工具适配层
                              │
                              ├── .claude/
                              ├── .agents/
                              ├── .agy/
                              ├── .mimocode/
                              ├── .opencode/
                              └── 其他原生集成
```

适配层负责提供访问方式；规范目录负责定义行为。

## 归属规则

可按以下规则判断变更应该放在哪里：

1. 如果行为应被多个工具共享，修改根目录中的规范资源。
2. 如果变更只涉及某个工具的原生配置或加载机制，修改该工具的适配目录。
3. 如果变更影响 skill 发现，修改规范 skill 并重新生成 `.skill-index/skills.json`，不要手工编辑生成索引。
4. 如果变更影响插件打包或 marketplace 元数据，修改 `.claude-plugin/`。
5. 如果变更影响仓库自动化，修改 `.github/`，并在适用时同步修改对应的确定性脚本。
6. 如果变更对用户可见且属于实质更新，应在同一组改动中同步更新英语、葡萄牙语和简体中文文档。

## 添加 skill

新的可复用 skill 应放在：

```text
skills/<skill-name>/SKILL.md
```

添加前：

1. 在 `.skill-index/skills.json` 中搜索重叠意图；
2. 如果工作流明显重叠，优先扩展已有 skill；
3. 验证 frontmatter、边界、安全性、依赖和许可证；
4. 重新生成 skill 索引；
5. 只有当某个工具确实需要时，才增加该工具专用暴露方式。

不要在每个适配层中注册所有专业 skills。仓库的设计目标就是选择性发现。

## 添加或修改 agent

可复用角色定义应放在 `agents/`；如果某个 agent 被有意限制在单一 skill 内，也可以放在该 skill 自己的 agent 资源中。工具原生且工具专用的 agent 配置应放在对应适配层，例如 `.codex/agents/`。

可复用领域知识应保存在 skills 中，不要复制到每个 agent prompt。

## Symlink 与重复策略

多个集成目录使用链接指向规范路由 skills。这是有意设计：链接既能保持单一实现，也能满足工具的原生发现约定。

新增集成时，优先顺序为：

1. 直接引用规范资源；
2. symlink 或轻量适配器；
3. 当工具要求不同格式时使用生成表示；
4. 只有目标工具无法支持其他方案时才使用实体复制，并明确建立同步策略。

## 验证清单

进行结构性变更时，应验证：

- 规范资源仍保存在根目录共享目录中；
- 适配层没有悄悄引入重复事实来源；
- 路由链接能够正确解析；
- skills 变化后 `node scripts/build-skill-index.js` 能成功执行；
- `.skill-index/skills.json` 与规范 skill 树一致；
- 文档中的结构示例与仓库实际树一致；
- 实质用户文档变更同步更新三种语言。

## 当前顶层结构

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
