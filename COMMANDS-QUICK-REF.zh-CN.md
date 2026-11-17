# 命令速查

[English](COMMANDS-QUICK-REF.md) | [Português](COMMANDS-QUICK-REF.pt-BR.md) | **中文**

> 全局安装了 94 个斜杠命令。在任意 Claude Code 会话中输入 `/` 即可调用。

---

## 核心工作流

| 命令 | 作用 |
|------|------|
| `/plan` | 复述需求、评估风险并写出分步实现计划——**在改动代码前会等待你确认** |
| `/plan-canvas` | 在浏览器的 Plan Canvas 中打开计划或 HTML 产物，进行批注和审批 |
| `/plan-prd` | 生成精简、以问题为先的 PRD，并交给 `/plan` 做实现规划 |
| `/feature-dev` | 在理解代码库、关注架构的前提下引导功能开发 |
| `/code-review` | 代码评审——本地未提交的改动或 GitHub PR（传入 PR 编号/URL 进入 PR 模式） |
| `/review-pr` | 使用专用代理进行全面的 PR 评审 |
| `/build-fix` | 检测并修复构建错误——自动委派给合适的 build-resolver 代理 |
| `/quality-gate` | 按项目标准进行质量门禁检查 |
| `/santa-loop` | 对抗式双评审收敛循环——两个独立的模型评审都通过后代码才能交付 |
| `/astra-review` | 把 Claude 写的代码发给 GPT-6-Astra（ChatGPT，经 Codex CLI）做独立的跨厂商评审，再修复它发现的问题 |

---

## 测试

| 命令 | 作用 |
|------|------|
| `/test-coverage` | 分析覆盖率、找出缺口，并生成缺失的测试以达到目标阈值 |
| `/go-test` | Go 的 TDD 工作流（表驱动，用 `go test -cover` 达到 80%+ 覆盖率） |
| `/kotlin-test` | Kotlin 的 TDD（Kotest + Kover） |
| `/rust-test` | Rust 的 TDD（cargo test、`cargo-llvm-cov`） |
| `/cpp-test` | C++ 的 TDD（GoogleTest + gcov/lcov） |
| `/flutter-test` | 运行 Flutter/Dart 测试（单元、组件、golden、集成），报告并修复失败 |
| `/react-test` | React 的 TDD（React Testing Library、Vitest 或 Jest，带覆盖率目标） |

---

## 代码评审

| 命令 | 作用 |
|------|------|
| `/code-review` | 代码评审——本地未提交的改动或 GitHub PR（传入 PR 编号/URL 进入 PR 模式） |
| `/issue-review` | GitHub issue 评审——对照代码库核实报告，查找重复和以往修复，评定严重程度，起草回复（是否发布可选） |
| `/python-review` | Python——PEP 8、类型注解、安全、惯用写法 |
| `/go-review` | Go——惯用写法、并发安全、错误处理 |
| `/kotlin-review` | Kotlin——空安全、协程安全、整洁架构 |
| `/rust-review` | Rust——所有权、生命周期、unsafe 的使用 |
| `/cpp-review` | C++——内存安全、现代惯用法、并发 |
| `/flutter-review` | Flutter/Dart——组件最佳实践、状态管理、无障碍、安全 |
| `/react-review` | React/JSX——hook 正确性、渲染性能、服务端/客户端边界、无障碍 |
| `/vue-review` | Vue.js——Composition API 正确性、响应式、composable 模式、模板安全、无障碍、性能 |
| `/fastapi-review` | FastAPI——async 正确性、依赖注入、Pydantic 模型、安全 |

---

## 构建修复

| 命令 | 作用 |
|------|------|
| `/build-fix` | 检测并修复构建错误——自动委派给合适的 build-resolver 代理 |
| `/go-build` | 修复 Go 构建错误和 `go vet` 警告 |
| `/kotlin-build` | 修复 Kotlin/Gradle 编译错误 |
| `/rust-build` | 修复 Rust 构建和借用检查器问题 |
| `/cpp-build` | 修复 C++ 的 CMake 和链接器问题 |
| `/gradle-build` | 修复 Android / KMP 的 Gradle 错误 |
| `/flutter-build` | 修复 Dart 分析器错误和 Flutter 构建失败 |
| `/react-build` | 修复 React 构建失败（Vite、webpack、Next.js、CRA、Parcel、esbuild、Bun） |

---

## 编排式功能工作流

| 命令 | 作用 |
|------|------|
| `/orch-add-feature` | 端到端构建全新功能——调研、计划、TDD、评审、受控提交 |
| `/orch-build-mvp` | 从设计/规格文档搭建可运行的 MVP——读取、切片、搭架子、TDD、评审、受控提交 |
| `/orch-change-feature` | 把已有功能改为新的期望行为——按新规格更新测试、修改实现、评审、受控提交 |
| `/orch-fix-defect` | 修复缺陷——先写出失败的回归测试复现问题，修到通过，评审，受控提交 |
| `/orch-refine-code` | 保持行为不变的重构——确认测试通过、重构结构、保持通过、评审、受控提交 |
| `/orch-review` | 对一个 diff（本地改动或 GitHub PR）运行 orch-review 原生工作流，并区分阻塞问题与建议 |

---

## PRP 工作流

| 命令 | 作用 |
|------|------|
| `/prp-prd` | 交互式 PRD 生成器——以问题为先、假设驱动、来回提问 |
| `/prp-plan` | 结合代码库分析和模式提取，制定完整的功能实现计划 |
| `/prp-implement` | 以严格的验证循环执行实现计划 |
| `/prp-commit` | 用自然语言指定文件，快速提交 |
| `/prp-pr` | 从当前分支（含未推送的提交）创建 GitHub PR |

---

## 史诗协调（基于 GitHub）

| 命令 | 作用 |
|------|------|
| `/epic-decompose` | 把史诗拆成子任务，但不为任务创建分支 |
| `/epic-validate` | 检查史诗是否就绪、依赖关系和协调策略 |
| `/epic-claim` | 认领史诗 issue，记录协调状态并同步本地归属 |
| `/epic-sync` | 从 GitHub 同步史诗 issue 的正文、标签和本地协调快照 |
| `/epic-review` | 把史诗评审标记为已请求、已批准或需要修改 |
| `/epic-publish` | 把经过验证的史诗更新发布回 issue 和本地缓存 |
| `/epic-unblock` | 扫描被阻塞的史诗 issue，重新打开依赖都已关闭的条目 |

---

## 规划与架构

| 命令 | 作用 |
|------|------|
| `/plan` | 复述需求、评估风险并写出分步实现计划——**在改动代码前会等待你确认** |
| `/multi-plan` | 多模型协作规划 |
| `/multi-workflow` | 多模型协作开发 |
| `/multi-backend` | 以后端为主的多模型开发 |
| `/multi-frontend` | 以前端为主的多模型开发 |
| `/multi-execute` | 多模型协作执行 |

---

## 会话管理

| 命令 | 作用 |
|------|------|
| `/save-session` | 把当前会话状态保存到 `~/.claude/session-data/` |
| `/resume-session` | 从规范的会话存储中加载最近保存的会话，从上次中断处继续 |
| `/sessions` | 浏览、搜索和管理 `~/.claude/session-data/` 中带别名的会话历史（也会读取旧的 `~/.claude/sessions/`） |
| `/checkpoint` | 运行验证检查后，创建、校验或列出工作流检查点 |
| `/aside` | 快速回答一个旁支问题，而不丢失当前任务的上下文 |

---

## 跨环境记忆 CLI

以下是 `ecc` CLI 命令，不是斜杠命令。它们在 Claude、Codex、Hermes、OpenClaw、Kimi 等
环境之间共用一个可检查的 Markdown 记忆库。

| 命令 | 作用 |
|------|------|
| `ecc memory init` | 创建项目、团队或用户的记忆库目录 |
| `ecc memory save` | 新建一条未经评审的上下文、决策、事实、经验、笔记、偏好或运行手册 |
| `ecc memory handoff` | 把一段有界的工作状态从一个环境移交给另一个环境 |
| `ecc memory search` | 按文本、范围、类型或目标环境搜索记忆 |
| `ecc memory read` | 按稳定 ID 读取一条记忆及其反向链接 |
| `ecc memory doctor` | 报告格式错误的文件、重复的 ID、失效的链接和被跳过的符号链接 |
| `ecc-memory-mcp` | 启动可选的本地 stdio MCP 服务器 |

用 `--stdin` 或 `--body-file` 传入记忆内容；为安全起见，它不接受命令行参数形式的内容。
召回的记忆是不受信任的上下文，不是可执行的指令或策略。

---

## 安装健康与反馈 CLI

这些生命周期命令也可以通过 `ecc` CLI 使用。

| 命令 | 作用 |
|------|------|
| `ecc list-installed` | 显示 ECC 托管状态中记录的安装 |
| `ecc doctor` | 诊断缺失或被改动的托管文件，并把失败指向简短的问题反馈表单 |
| `ecc repair` | 恢复缺失或被改动的托管文件 |
| `ecc uninstall` | 只删除由安装状态管理的文件，并可选显示 20 秒的退出反馈入口 |
| `ecc feedback` | 显示公开的问题、快速反馈和功能建议入口，不读取文件也不上传诊断信息 |

---

## 学习与改进

| 命令 | 作用 |
|------|------|
| `/learn` | 从当前会话中提取可复用的模式 |
| `/learn-eval` | 提取模式并在保存前自评质量 |
| `/evolve` | 分析已学到的本能，建议演进后的技能结构 |
| `/promote` | 把项目范围的本能提升到全局范围 |
| `/prune` | 删除超过 30 天且从未被提升的待定本能 |
| `/instinct-status` | 显示所有已学到的本能（项目 + 全局）及其置信度 |
| `/instinct-export` | 把本能导出到文件 |
| `/instinct-import` | 从文件或 URL 导入本能 |
| `/skill-create` | 分析本地 git 历史 → 生成可复用的技能 |
| `/skill-health` | 带分析的技能组合健康仪表盘 |
| `/skill-host-compat` | 检查技能的 frontmatter 是否对 Codex 安全，以及 Claude 替换项 |

---

## 重构与清理

| 命令 | 作用 |
|------|------|
| `/refactor-clean` | 删除死代码、合并重复、整理结构 |

---

## 文档与研究

对于从零散线索开始的公开来源调查，使用
[`osint-investigation` 技能](skills/research/osint-investigation/SKILL.md)，以挖掘被忽视的线索、
串联零碎的证据，并通过有意的证伪和可视化核验来检验相互竞争的解释。

| 命令 | 作用 |
|------|------|
| `/ecc-guide` | 基于当前仓库内容浏览 ECC 的代理、技能、命令、钩子、安装配置档和文档 |
| `/update-docs` | 从脚本、schema、路由、导出等事实来源同步文档 |
| `/update-codemaps` | 重新生成代码库的代码地图 |

---

## 循环与自动化

| 命令 | 作用 |
|------|------|
| `/loop-start` | 按时间间隔启动一个周期性代理循环 |
| `/loop-status` | 查看运行中的循环状态 |
| `/gan-build` | 用于实现任务的生成器/评估器构建循环，迭代次数有限并带评分 |
| `/gan-design` | 用于前端或视觉工作的生成器/评估器设计循环，迭代次数有限并带评分 |

---

## 项目与基础设施

| 命令 | 作用 |
|------|------|
| `/projects` | 列出已知项目及其本能统计 |
| `/project-init` | 检测项目的技术栈，生成一份试运行（dry-run）的 ECC 接入计划 |
| `/harness-audit` | 审计智能体环境配置的可靠性和成本 |
| `/model-route` | 把任务路由到合适的模型（Haiku / Sonnet / Opus） |
| `/pm2` | 初始化 PM2 进程管理器 |
| `/setup-pm` | 配置包管理器（npm / pnpm / yarn / bun） |
| `/auto-update` | 拉取 ECC 仓库的最新改动并重新安装当前托管的目标 |
| `/cost-report` | 从 cost-tracker 的 SQLite 数据库生成本地 Claude Code 成本报告 |
| `/token-card` | 从本地会话日志生成 token 用量统计卡片，并提交到仓库 |
| `/security-scan` | 对代理、钩子、MCP、权限和密钥运行 AgentShield |
| `/jira` | 获取 Jira 工单、分析需求、更新状态或添加评论 |
| `/pr` | 从当前分支（含未推送的提交）创建 GitHub PR |
| `/hookify` | 根据对话分析或明确指令创建钩子，阻止不想要的行为 |
| `/hookify-configure` | 交互式启用或禁用 hookify 规则 |
| `/hookify-list` | 列出所有已配置的 hookify 规则 |
| `/hookify-help` | 获取 hookify 系统的帮助 |

---

## 市场营销

| 命令 | 作用 |
|------|------|
| `/marketing-campaign` | 策划并执行完整的营销活动——定位、落地页文案、邮件序列、社交帖子、广告变体、视频脚本、内容日历 |

---

## 已停用的命令

以下斜杠命令已停用，改由技能取代。为了向后兼容，命令文件仍保留在
`legacy-command-shims/commands/` 下（不在默认安装范围内），但持续维护的工作流现在位于所列
技能中——请直接调用技能：

| 已停用的命令 | 改用此技能 |
|---|---|
| `/tdd` | `tdd-workflow` |
| `/eval` | `eval-harness` |
| `/verify` | `verification-loop` |
| `/e2e` | `e2e-testing` |
| `/docs` | `documentation-lookup` |
| `/claw` | `nanoclaw-repl` |
| `/context-budget` | `context-budget` |
| `/devfleet` | `claude-devfleet` |
| `/orchestrate` | `dmux-workflows` 和 `autonomous-agent-harness` |
| `/prompt-optimize` | `prompt-optimizer` |
| `/rules-distill` | `rules-distill` |
| `/agent-sort` | `agent-sort` |

---

## 快速决策指南

```
开始一个新功能？         → 先 /plan，再用 tdd-workflow 技能做 TDD
刚写完代码？             → /code-review
处理 GitHub issue？      → /issue-review <编号>
构建失败？               → /build-fix
需要最新文档？           → documentation-lookup 技能
会话快要结束？           → /save-session 或 /learn-eval
第二天继续？             → /resume-session
上下文越来越重？         → context-budget 技能
想提炼学到的东西？       → 先 /learn-eval，再 /evolve
要重复执行任务？         → /loop-start
```
