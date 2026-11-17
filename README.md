# ECC

**English** | [Português](README.pt-BR.md) | [中文](README.zh-CN.md)

Agents, skills, hooks, rules and slash commands for Claude Code and other
coding-agent harnesses (Codex, Cursor, OpenCode, Gemini, Kimi and more).

Access to 71 agents, 326 skills, and 98 legacy command shims, plus hooks,
rules, memory and continuous-learning workflows.

| Surface  | Count | What it is |
|----------|-------|------------|
| Agents   | 71 agents | Subagents for planning, review, build repair, security and domain work |
| Commands | 98 commands | Slash-command shims that route to agents and skills |
| Skills   | 326 skills | Workflows and domain knowledge, grouped into 18 departments |

## Install with Claude Code

Add this repository as a marketplace, then install the core plugin. Anyone
who wants the plugins runs this in their own Claude Code:

```text
/plugin marketplace add yusei21/skills
/plugin install ecc@ecc
```

`ecc` carries the runtime (agents, commands, hooks, MCP settings) and the
**core** department only. Add the departments you work in:

```text
/plugin install ecc-frontend@ecc
/plugin install ecc-backend@ecc
```

Or install every department at once with `ecc-all-departments@ecc`. Use either
the individual departments or `ecc-all-departments`, not both: they list the
same skills.

Plugin commands are namespaced by the plugin name, for example `/ecc:plan`.
The plugin path and the installer below are alternatives: after
`/plugin install`, do not run the full installer (`--profile full`) on top of
it, or every skill and hook is installed twice.

### Why departments

Claude Code puts every installed skill's name and description into each
session. Measured with `claude plugin details`:

| Setup | Always-on context |
|-------|-------------------|
| Upstream ECC (all skills in one plugin) | ~33,800 tokens |
| `ecc` (runtime + core) | ~9,500 tokens |
| `ecc` + `ecc-frontend` | ~11,400 tokens |
| `ecc` + `ecc-all-departments` | ~36,700 tokens |

### Departments

| Plugin | Department | Skills | Scope |
|--------|------------|--------|-------|
| `ecc` | Core engineering | 18 | TDD, verification, git, code standards, context management |
| `ecc-frontend` | Frontend and design | 23 | Web UI, design systems, accessibility, motion, UI frameworks |
| `ecc-backend` | Backend and APIs | 29 | Service architecture, API contracts, server frameworks |
| `ecc-languages` | Languages | 18 | Per-language idioms and testing |
| `ecc-mobile` | Mobile and Apple | 12 | Android, iOS/Swift, Flutter, React Native |
| `ecc-data` | Data and databases | 9 | SQL, ORMs, caching, analytics, data movement |
| `ecc-ai-agents` | AI and agents | 41 | Agent architecture, orchestration, prompts, LLM cost, computer use |
| `ecc-ml` | Machine learning | 5 | Training, evaluation and adoption of models |
| `ecc-quality` | Quality, testing and performance | 24 | E2E, evals, benchmarks, audits, minimal-code review |
| `ecc-security` | Security | 10 | Security review, scanning, agent hardening |
| `ecc-devops` | DevOps and infrastructure | 18 | Containers, deployment, environments, networking |
| `ecc-docs-product` | Docs, product and knowledge | 12 | Documentation governance, decisions, product planning, code graphs |
| `ecc-research` | Research | 10 | Deep research, search, OSINT, scientific databases |
| `ecc-business` | Business, content and marketing | 17 | Writing, brand, SEO, market research, social |
| `ecc-media` | Media and video | 11 | Video generation and editing |
| `ecc-operations` | Operations and integrations | 20 | Email, billing, GitHub, Jira, Google Workspace |
| `ecc-verticals` | Industry verticals | 25 | Healthcare, supply chain, web3, prediction markets |
| `ecc-admin` | ECC administration | 24 | Setup, continuous learning, memory, cost, skill maintenance |

The taxonomy lives in [`manifests/skill-departments.json`](manifests/skill-departments.json).

## Install without the plugin

The selective installer copies chosen modules into a harness's own
directories (`~/.claude`, `~/.codex`, `.cursor`, and others). Installed skills
are always flat (`skills/<skill>/`), whatever the source layout.

```bash
node scripts/ecc.js setup                      # guided Claude Code setup
node scripts/ecc.js install --profile developer
node scripts/ecc.js catalog                    # list profiles and components
node scripts/ecc.js doctor                     # check an existing install
```

To copy a single skill by hand, copy its folder directly under
`~/.claude/skills/`, for example
`cp -r skills/core/tdd-workflow ~/.claude/skills/`. Claude Code does not look
inside nested folders there.

## Repository layout

```text
|-- agents/    # 71 specialized subagents for delegation
|-- commands/  # 98 maintained slash-command shims
|-- skills/    # 326 reusable workflows loaded on demand
|   |-- core/            one folder per department,
|   |-- frontend/        one folder per skill inside it:
|   `-- ...              skills/<department>/<skill>/SKILL.md
|-- hooks/       hook definitions for each harness
|-- rules/       always-on guidelines
|-- manifests/   install modules, profiles, components, departments
|-- scripts/     Node.js runtime: hooks, installer, CI validators
|-- ecc2/        Rust TUI and control plane
|-- src/llm/     Python provider-abstraction package
`-- tests/       Node.js and Python test suites
```

## Development

Requirements: Node.js 22.12 or newer (Node 26 LTS recommended), Git. Rust
and Python are only needed for `ecc2/` and `src/llm/`.

```bash
npm ci
npm test            # validators + full JS suite
npm run typecheck   # TypeScript 7 over files marked // @ts-check
npm run lint
```

- Runtime code stays CommonJS `.js`, because hooks run under whatever `node`
  the user has installed. Type safety comes from JSDoc checked by TypeScript:
  add `// @ts-check` to a file to hold it to `strict`.
- New tests use `node:test`. `scripts/dev/migrate-test-to-node-test.js`
  converts legacy hand-rolled suites.
- Adding a skill: create `skills/<department>/<skill>/SKILL.md`, list it in
  `manifests/skill-departments.json` and an install module, then run
  `node scripts/ci/generate-department-plugins.js --write`.

## License

MIT; see [LICENSE](LICENSE). Origin, attribution and the licenses of
third-party skills are in [NOTICE.md](NOTICE.md).
