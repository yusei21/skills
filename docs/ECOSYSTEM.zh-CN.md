# Agent Skills 生态研究

[English](./ECOSYSTEM.md) | [Português](./ECOSYSTEM.pt-BR.md) | **简体中文**

本文档记录在演进本仓库时所调研的外部 skill 生态，以及决定哪些能力应在本仓库中实现时采用的标准。

> 调研快照日期：2026-08-10。仓库热度与活跃度会随时间变化。

## 目标

目标不是镜像所有公开 skill 仓库。过大的 skill 目录很容易积累重复指令，增加维护成本，并降低自动路由的精确度。

新增 skill 应提供明确且可复用的新能力，适配本仓库的多工具架构，并尽可能避免绑定单一模型供应商。

## 已调研仓库

### obra/superpowers

这是一个采用度很高的 agentic 软件开发方法论，重点覆盖 brainstorming、debugging、计划执行、代码审查、测试、worktree 与完成前验证等纪律化工作流。

本次调研观察到的特点：

- GitHub 采用度非常高；
- MIT 许可证；
- 重点是开发流程，而不仅仅是某个框架的参考资料；
- 2026 年仍保持活跃开发。

本仓库选择进行原创实现的概念：

- `systematic-debugging`
- `verification-before-completion`

本地 skill 按照本仓库的约定独立编写，没有复制上游文本。

### anthropics/skills

Anthropic 官方公开的 Agent Skills 仓库，是 `SKILL.md` 规范实践的重要参考。其能力覆盖文档处理、MCP 构建、前端设计、Web 应用测试、API 使用以及 artifact 创建等领域。

其中许多高价值能力在本仓库中已经存在。尤其是，在本次调研之前，本仓库已经拥有 `mcp-builder`，因此没有再添加重复能力。

### vercel-labs/agent-skills

Vercel 官方的 agent skill 集合，是现代 React 与 Web 开发的重要参考。调研期间，该仓库包含 React 最佳实践、组件组合、React Native、Vercel 部署、Web 设计等相关 skill。

本仓库选择进行原创实现的概念：

- `react-best-practices`
- `composition-patterns`
- `web-design-guidelines`

没有复制任何上游文字。在本次快照时，GitHub 未为 `vercel-labs/agent-skills` 显示仓库许可证，因此这里只把能力缺口和高层主题作为研究信号，并采用独立实现。

### trailofbits/skills

Trail of Bits 维护了一套以安全研究为中心的 skill 生态，涵盖审计上下文构建、代码审查、漏洞研究、静态/动态分析、安全合约以及专用安全工具。

本仓库已经包含内容较完整的 `security-review` 以及其他安全相关材料，因此本轮没有再添加一个泛化的 security review skill，以避免意图层面的重复。

## Registry 与生态信号

2026 年的公开 skill registry 显示，agent skill 生态增长非常快，主要采用集中在软件工程、前端/UI、信息检索和内容创作等类别。

同时，生态中也存在明显冗余：很多 skill 的真实意图几乎相同，只是 prompt 表述不同。因此在本仓库中，热度只是发现候选能力的信号，而不是自动导入的理由。

## 选择标准

候选 skill 通常应满足以下条件：

1. **意图独立** — 不与现有规范 skill 大幅重复。
2. **可重复使用** — 能用于多个仓库或经常出现的任务。
3. **触发条件清晰** — agent 能判断何时应加载该 skill。
4. **流程可执行** — 提供实际工作流或决策框架，而不仅是泛泛建议。
5. **结果可验证** — 鼓励使用证据、测试、审查或可度量的完成条件。
6. **工具可移植** — 在可行情况下支持 Claude Code、Codex、OpenCode、Antigravity 等多种集成。
7. **安全边界明确** — 高影响操作需要显式控制，避免盲目执行。
8. **许可证规范** — 复制或改编内容必须具有兼容许可证并正确署名；许可证缺失或不明确时应独立实现能力。

## 本轮新增 skills

| Skill | 主要能力缺口 | 调研信号 |
|---|---|---|
| `systematic-debugging` | 基于证据的根因分析 | obra/superpowers |
| `verification-before-completion` | 防止在缺乏证据时声称任务完成 | obra/superpowers |
| `react-best-practices` | 现代 React 正确性与性能审查 | vercel-labs/agent-skills |
| `composition-patterns` | 可复用组件 API 设计 | vercel-labs/agent-skills |
| `web-design-guidelines` | 结构化 Web UI / 设计审查 | vercel-labs/agent-skills |

## 有意暂缓的候选能力

以下领域可能有价值，但本轮没有加入：

- test-driven development — 很有价值，但应先与现有测试类 skills 做更细的重叠分析；
- Git worktree 工作流 — 对并行 agent 很有用，但应与现有 orchestration 和 DevFleet 相关内容整合；
- Vercel 部署 — 供应商特定能力，应在真实需求足够明显时再增加专门 skill；
- 专业安全分析 skills — 价值很高，但应逐个引入，并明确与 `security-review` 的边界；
- 文档生成 skills — 当前目录和已有上游集成已经覆盖较多相关能力。

## 维护策略

未来调研外部 skill 生态时：

1. 先检查现有本地索引；
2. 比较 skill 的真实意图，而不仅是名称；
3. 优先扩展已有 skill，而不是添加近似重复项；
4. 记录作为研究信号的外部来源；
5. 改编内容前先检查仓库许可证；
6. 当许可证缺失或不明确时使用原创实现；
7. 新增规范 skill 后更新 `.skill-index/skills.json`；
8. 保持多语言文档在语义上对齐。
