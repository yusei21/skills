# Notice

**English** | [Português](NOTICE.pt-BR.md) | [中文](NOTICE.zh-CN.md)

## Origin

yus is a modernized fork of [affaan-m/ECC](https://github.com/affaan-m/ECC)
(Everything Claude Code), renamed to yus.
It splits the skill library into departments you install one at a time,
type-checks the Node.js runtime with TypeScript 7 and runs on current
Node.js, Rust and Python toolchains.

ECC is created by Affaan Mustafa and the ECC contributors and is released
under the MIT License; see [LICENSE](LICENSE). This fork starts from upstream
merge commit `d2ef268` and keeps the same license.

## Third-party skills

These skills are vendored from other projects at pinned commits, with their
licenses kept beside them:

| Skill | Source | License |
|-------|--------|---------|
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | MIT |
| `agent-desktop` | [vercel-labs/agent-desktop](https://github.com/vercel-labs/agent-desktop) | Apache-2.0 |
| `untangle-codebase` | [caldoai/skills](https://github.com/caldoai/skills) | MIT |
| `ponytail`, `ponytail-*` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | MIT |
| `graphify` | [safishamsi/graphify](https://github.com/safishamsi/graphify) | Apache-2.0 |
| `taste-skill` (installer pointer) | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | MIT |
| `design-md-library` (reference pointer) | [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | MIT |

Each vendored skill keeps its own license; the MIT License of this
repository does not replace it.
