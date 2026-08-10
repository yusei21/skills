# 高级使用指南

[English](./GUIDE.md) | [Português](./GUIA.md) | **简体中文**

本指南假设仓库已经安装完成。安装和集成说明见 [`README.zh-CN.md`](../README.zh-CN.md)。

本仓库围绕规范化可复用资源、自动 skill 发现和选择性加载来组织。目标不是在每个会话中加载尽可能大的目录，而是让工具能够快速发现并复用完成当前任务所需的最小能力集合。

关于外部 skill 生态调研，以及新增或拒绝候选 skill 所采用的标准，请参阅 [`ECOSYSTEM.zh-CN.md`](./ECOSYSTEM.zh-CN.md)。

## 1. 规范架构

共享实现保存在仓库根目录：

| 资源 | 规范位置 | 用途 |
|---|---|---|
| Agents | `agents/` | 用于委派工作的专家角色定义 |
| Skills | `skills/` | 可复用工作流、操作步骤和领域知识 |
| Rules | `rules/` | 跨任务的行为与代码约束 |
| Hooks | `hooks/` | 事件驱动的自动化与强制检查 |
| Commands | `commands/` | 常用工作流的快速入口 |
| MCP 配置 | `mcp-configs/` | 共享 MCP 服务器目录 |
| Scripts | `scripts/` | 确定性支持工具和集成脚本 |

`.claude/`、`.codex/`、`.agents/`、`.agy/`、`.mimocode/`、`.opencode/` 等工具特定目录应只包含集成文件、原生配置以及指向规范资源的链接，而不是维护独立副本。

## 2. 自动发现 skills

`project-orchestrator` 是处理重要仓库任务时的顶层路由器。它应当：

1. 检查当前仓库和任务；
2. 读取 `.skill-index/skills.json` 作为发现目录；
3. 只选择最小且足够的 skill 集合；
4. 只有在确实有价值时才加载专家 agent 提示；
5. 避免把整个目录加载进上下文。

规范 skill 索引由 `skills/*/SKILL.md` 自动生成：

```bash
node scripts/build-skill-index.js
```

生成文件为：

```text
.skill-index/skills.json
```

GitHub Actions 会在规范 skill 定义或索引生成器发生变化时保持该文件同步。修改 skill 的 pull request 应保证生成后的索引没有未提交差异。

不要在工具特定目录中手工维护第二套 skill 列表。

## 3. 选择正确的 skill

优先按真实意图匹配，而不是只比较名称。创建新 skill 之前：

1. 搜索 `.skill-index/skills.json`；
2. 与结果相近的现有 skill 比较；
3. 如果意图明显重叠，优先扩展已有规范 skill；
4. 只有在提供独立、可复用工作流时才创建新 skill；
5. 在适用时使用 `skill-scout`、`skill-builder`、`skill-stocktake` 和 `skill-comply`。

高质量 skill 应具有清晰触发条件、可执行流程、可验证结果，以及与相邻 skill 明确不同的边界。

## 4. 当前高价值工作流 skills

### 系统化调试

当问题原因不明确、间歇出现、跨多层系统，或此前已经尝试过多个修复仍未解决时，使用 `systematic-debugging`。

工作流以证据为核心：

```text
复现
  ↓
收集证据
  ↓
提出可证伪假设
  ↓
缩小故障范围
  ↓
测试假设
  ↓
修复根因
  ↓
验证回归
```

不要因为某个修改“看起来合理”就直接改代码。该 skill 要求先形成具体假设，并定义能够推翻该假设的测试，再把补丁视为根因修复。

### 完成前验证

在声称实现、调试、迁移、重构或自动化任务已经完成之前，使用 `verification-before-completion`。

完成声明应由当前证据支持，例如：

- 预期产物存在，并包含目标改动；
- 已直接执行用户要求的行为；
- 针对性测试通过；
- 在相关情况下，更广泛的测试、静态检查或 build 通过；
- 明确说明剩余风险和未验证区域。

该 skill 与 `verification-loop` 互补：后者定义广泛的项目检查，而 `verification-before-completion` 规定在宣称“已经完成”之前必须具备什么证据。

### 组件组合模式

当 UI 组件开始积累大量互相影响的布尔 props，或者需要更灵活的扩展点时，使用 `composition-patterns`。

优先采用：

- 使用 `children` 和显式 slots 表达结构；
- 明确 controlled / uncontrolled 状态契约；
- 当多个子部件属于同一概念 API 时使用 compound components；
- 缩小 context 的作用边界；
- 使用明确扩展点，而不是不断增加 props。

在 React 项目中，应与 `react-patterns` 和 `react-performance` 配合使用，而不是再创建一个宽泛的 “React best practices” skill。

## 5. 常见工作流

### 开始新功能

```text
project-orchestrator
  ↓
意图 / 规划 skill
  ↓
实现 + 相关框架 skills
  ↓
测试
  ↓
需要时进行代码 / 安全审查
  ↓
verification-before-completion
```

对于较大的工作，应优先使用现有 `orch-*` 家族或其他编排 skill，而不是另建一套独立流水线。

### 修复 bug

```text
systematic-debugging
  ↓
复现故障
  ↓
在可行时加入回归测试
  ↓
实现根因修复
  ↓
执行针对性与更广泛检查
  ↓
verification-before-completion
```

### 上线前准备

只组合当前项目真正需要的能力，例如：

```text
security-review / security-scan
production-audit
E2E 或框架特定验证
需要验证部署时使用 canary-watch
verification-before-completion
```

## 6. 组合 agents 与 skills

Agents 是角色定义；skills 是可复用能力。应保持两者职责分离。

审查 agent 可以加载安全或框架审查 skill。开发 agent 可以加载实现、测试和验证 skill。不要把同一份领域知识复制到每个 agent prompt 中。

在多 agent 执行中，应优先使用明确任务所有权、产物、验证 gate 和受限 handoff，而不是让多个 agent 进行没有边界的开放式对话。

## 7. 上下文与成本纪律

- 只加载当前任务真正需要的 skills；
- 先读取索引元数据，再打开完整 `SKILL.md`；
- 只为项目真实使用的技术加载特定规则；
- 关闭无关 MCP 服务器，以减少上下文和攻击面；
- 在明确阶段切换点压缩上下文，不要在正在进行的调试或实现中压缩；
- 在可用时复用项目 profile 和持久记忆，而不是每轮重新发现稳定事实。

## 8. 从外部仓库加入内容

导入或改编外部能力之前：

1. 先检查本地目录；
2. 比较真实意图，而不是只比较名称；
3. 检查来源仓库当前许可证；
4. 审查脚本、hooks、依赖、MCP 配置以及数据访问行为；
5. 当许可证缺失或不明确时，优先独立实现；
6. 如果实际复制或改编受版权保护内容，保留所需署名；
7. 必要时更新对应 NOTICE 文件；
8. 新增规范 skill 后重新生成 skill 索引。

调研方法和已评估的生态记录在 [`ECOSYSTEM.zh-CN.md`](./ECOSYSTEM.zh-CN.md)。

## 9. 文档语言策略

面向用户的仓库文档应始终提供三种语言：

1. 英语 — 规范来源；
2. 葡萄牙语（`pt-BR`）；
3. 简体中文（`zh-CN`）。

当面向用户的文档发生实质变化时，应在同一组变更中更新三种语言版本。代码标识符、命令名称、文件路径、API 名称和配置键默认保持英语，除非底层工具明确要求本地化。

等价文档顶部应提供语言切换链接。

## 10. 维护目录

应定期检查：

- 重复或近似重复的意图；
- 过时的框架或版本说明；
- 截断或质量较差的 frontmatter description；
- 要求不必要或不安全权限的 skill；
- 已不再可执行的工作流；
- 许可证或维护状态发生变化的外部引用。

热度只是发现候选能力的信号，而不是自动导入标准。一个较小但路由清晰的目录，比一个充满重复 prompt 的大目录更有价值。
