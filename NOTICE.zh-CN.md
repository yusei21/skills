# 声明

[English](NOTICE.md) | [Português](NOTICE.pt-BR.md) | **中文**

## 来源

yus 是 [affaan-m/ECC](https://github.com/affaan-m/ECC)（Everything Claude Code）的现代化分支，并已更名为 yus。它把技能库
拆分为可以逐个安装的部门，用 TypeScript 7 对 Node.js 运行时做类型检查，并使用当前
版本的 Node.js、Rust 和 Python 工具链。

ECC 由 Affaan Mustafa 及 ECC 贡献者创建，以 MIT 许可证发布；见 [LICENSE](LICENSE)。
本分支从上游合并提交 `d2ef268` 开始，沿用相同的许可证。

## 第三方技能

以下技能从其他项目中按固定提交引入，各自的许可证放在技能旁边：

| 技能 | 来源 | 许可证 |
|------|------|--------|
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | MIT |
| `agent-desktop` | [vercel-labs/agent-desktop](https://github.com/vercel-labs/agent-desktop) | Apache-2.0 |
| `untangle-codebase` | [caldoai/skills](https://github.com/caldoai/skills) | MIT |
| `ponytail`, `ponytail-*` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | MIT |
| `graphify` | [safishamsi/graphify](https://github.com/safishamsi/graphify) | Apache-2.0 |
| `taste-skill`（安装指引） | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | MIT |
| `design-md-library`（参考指引） | [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | MIT |
| `pr-review-threads`、`human-attention-budget`（改编） | [deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) | MIT |
| `verification-loop` 中的前后对比部分（改编） | [deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) | MIT |

每个引入的技能保留其自身的许可证，本仓库的 MIT 许可证不会取代它。
