# 安全策略

[English](SECURITY.md) | [Português](SECURITY.pt-BR.md) | **中文**

## 支持的版本

| 版本 | 是否支持 |
| --- | --- |
| 2.x / rc 构建 | :white_check_mark: |
| 1.10.x | :white_check_mark: |
| 1.9.x | 仅修复严重问题 |
| < 1.9 | :x: |

安全修复先合入 `main`。回移植（backport）尽力而为，且仅针对当前仍受支持的版本线。

## 报告漏洞

请尽量使用 GitHub 的私密漏洞报告功能，它会直接送达维护者：

- <https://github.com/affaan-m/ECC/security/advisories/new>

也可以发邮件至 **<affaan@ecc.tools>**（`security@ecc.tools` 这个别名无人查看，请使用
`affaan@ecc.tools`）。

**不要**为安全漏洞创建公开的 GitHub issue。

请包含：

- 受影响的文件、包、版本、提交和安装路径
- 从干净检出开始的复现步骤
- 预期影响以及受影响的信任边界
- 利用是否需要本地 shell 访问、恶意仓库、恶意包、未经认证的远程攻击者或维护者凭据
- PoC 日志（请删去其中的令牌、密钥、本地路径和私人数据）

预期响应：

- **确认收到：** 48 小时内
- **初步评估：** 7 天内
- **严重问题的修复或缓解目标：** 当报告影响受支持版本并跨越真实的信任边界时，14 天内
- **协调披露：** 在发布公开公告之前进行

如果报告被拒绝，我们会说明原因：无法复现、不在范围内、已修复，或需要更有力的攻击路径。

## 范围

本策略涵盖：

- `affaan-m/ECC` 仓库
- `ecc-universal` npm 包
- 从本仓库发布的 ECC 插件、安装、修复、仪表盘、钩子、规则、技能、MCP 和命令
- 本仓库中的 GitHub Actions 工作流和发布自动化
- 本仓库文档中描述的 ECC Tools GitHub App 集成点
- 嵌入在本仓库中的 AgentShield 使用文档。AgentShield 代码问题请提交到
  <https://github.com/affaan-m/agentshield>

## 官方发布渠道

ECC 的官方渠道：

- GitHub 仓库：<https://github.com/affaan-m/ECC>
- npm 包：`ecc-universal`
- GitHub App：<https://github.com/apps/ecc-tools>
- 插件市场/插件标识：`ecc@ecc`
- 网站：<https://ecc.tools>

AgentShield 的官方渠道：

- npm 包：`ecc-agentshield`
- GitHub 仓库：<https://github.com/affaan-m/agentshield>

以下包被发现使用了 ECC 仓库的元数据，但**并非由 ECC 维护**：

- `@chil_ntl/ecc-cli`
- `ecc-100xprompt-plugin`

在核实之前，请把不在官方渠道列表中的任何包都视为非官方。除非本仓库明确说明它们是官方的，
否则不要安装名为 `opencode-ecc`、`everything-claude-code` 或其他类似 ECC 名称的包。

GitHub 依赖关系图还可能显示 Go 模块别名（如 `github.com/affaan-m/ecc`）或历史仓库路径。
ECC 目前不以受支持的 Go 模块形式发布。

## 不在范围内

以下情况的报告通常不在范围内：

- 用户本已控制本地 shell、且未跨越更高权限信任边界的本地命令执行
- 截图、过时的行号，或针对 `affaan-m/ECC` 但在当前 `affaan-m/ECC` 上无法复现的报告
- 没有仓库可控利用路径的 self-XSS 或社会工程
- 没有通往官方 ECC 包的安装路径的依赖关系图/包元数据混淆
- 第三方包中的漏洞，除非 ECC 以造成额外影响的方式固定、安装或执行了它们

当不受信任的仓库内容、包安装、生成的钩子或 CI 自动化能在用户没有明确意图时触发执行，
本地开发工具的问题仍可能是有效的安全问题。请在报告中说明这一信任边界。

## 供应链规则

ECC 把供应链风险视为一等安全面。

- 第三方 GitHub Actions 必须固定到提交 SHA。
- 工作流不得把不受信任的 GitHub 上下文直接传入 `run:` 块。
- 发布和安装文档只能指向官方包。
- 包元数据应指向 `affaan-m/ECC`，而不是历史仓库路径。
- 私密漏洞报告在公开披露前先私下分诊。
- 只有当受支持的版本受影响且适合协调披露时，才发布安全公告。

## 操作指南

### 处理密钥

`mcp-configs/mcp-servers.json` 是一个**模板**。所有 `YOUR_*_HERE` 值都必须在安装时用环境
变量或密钥管理器中的值替换。不要提交真实凭据。如果不小心提交了密钥，请立即轮换并重写
历史；不能只靠一次 revert。

同样的规则也适用于用户级 Claude Code 配置（`~/.claude/settings.json` 或
`%USERPROFILE%\.claude\settings.json`）。该文件不在本仓库中，但经常随 `claude doctor`
输出、截图和缺陷报告被分享。不要把 PAT、API 密钥或 OAuth 令牌硬编码进
`mcpServers[*].env` 块，而应在启动时从系统钥匙串或 MCP 服务器已支持的环境变量中读取。

快速审计：

```bash
# macOS / Linux
grep -EnH '(TOKEN|SECRET|KEY|PASSWORD)\s*"\s*:\s*"[A-Za-z0-9_-]{16,}"' ~/.claude/settings.json

# Windows PowerShell
Select-String -Path "$env:USERPROFILE\.claude\settings.json" -Pattern '(TOKEN|SECRET|KEY|PASSWORD)"\s*:\s*"[A-Za-z0-9_-]{16,}"'
```

如果审计有匹配，请先在签发方轮换该密钥，再把它移出文件。

### 本地 MCP 端口

部分内置 MCP 服务器通过明文 HTTP 连接到 localhost 端口。首次使用前，请确认正在监听的进程：

```bash
# Windows
netstat -ano | findstr :18801

# macOS / Linux
lsof -iTCP:18801 -sTCP:LISTEN
```

把 PID 与预期的程序对照。该端口上的任何其他进程都可能截获 MCP 流量。

## 分诊：可疑的 `<system-reminder>` 块

ECC 运行在智能体环境中，这些环境可能在每一轮都向模型输入注入临时的客户端系统提醒。这些块
并不一定是由仓库携带的内容。

在把它当作攻击之前，请确认：

1. 该块是否真的存在于本仓库的某个文件中？

   ```bash
   grep -rEn "system-reminder|NEVER mention|DO NOT mention" .
   ```

2. 该块是否作为工具结果的一部分记录在会话记录中？
3. 它是否与已知的客户端提醒一致，例如 TodoWrite 提示、日期提示或文件已修改提示？

只有当该块出现在工具结果或仓库文件中，且无法归因于实际读取的文件、URL 或命令时，才向上游
升级。

## 安全资源

- **AgentShield：** `npx ecc-agentshield scan`
- **安全指南：** [The Shorthand Guide to Everything Agentic Security](./the-security-guide.zh-CN.md)
- **供应链事件响应：** [npm/GitHub Actions 包注册表应对手册](./docs/security/supply-chain-incident-response.md)
- **OWASP MCP Top 10：** <https://owasp.org/www-project-mcp-top-10/>
- **OWASP Agentic Applications Top 10：** <https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/>
