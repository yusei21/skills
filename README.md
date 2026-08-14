# Skills

**English** | [Português](./README.pt-BR.md) | [简体中文](./README.zh-CN.md)

A maintained and expanded collection of skills, agents, commands, rules, hooks, scripts, and MCP configurations for multiple AI coding tools.

The repository uses canonical sources at the root:

- `skills/` for reusable workflows and domain knowledge;
- `agents/` for reusable agent role definitions;
- `commands/`, `rules/`, `hooks/`, `scripts/`, and `mcp-configs/` for shared support resources.

Tool-specific directories such as `.claude/`, `.codex/`, `.agents/`, `.agy/`, `.mimocode/`, and `.opencode/` should contain only integration files, native configuration, and links to canonical resources. They should not contain independent physical copies of shared skills or agents.

This project incorporates and adapts open-source work from multiple sources. Attribution, licensing, and adaptation details are maintained in [`NOTICE.en.md`](./NOTICE.en.md).

For advanced usage, orchestration, skill routing, contribution guidance, and context-budget discipline, see [`docs/GUIDE.md`](./docs/GUIDE.md). For the current external skill-ecosystem review, selection criteria, deduplication decisions, and implementation notes, see [`docs/ECOSYSTEM.md`](./docs/ECOSYSTEM.md).

## Automatic routing

Three project-level skills coordinate discovery and creation:

- `project-orchestrator` inspects the repository and selects only the skills and specialist prompts needed for the current task;
- `skill-builder` searches for an existing capability before creating, extending, validating, and registering a skill;
- `subagent-builder` searches existing roles before creating or registering a specialist subagent.

Specialized skills remain in `skills/` and are loaded on demand. This avoids registering the entire catalog in every tool and exceeding context budgets.

The canonical skill index is generated from `skills/*/SKILL.md` by `scripts/build-skill-index.js` and kept synchronized by GitHub Actions:

```bash
node scripts/build-skill-index.js
```

Discovery data lives in `.skill-index/skills.json`. Do not maintain a second manual catalog in tool-specific directories.

## Featured workflow skills

The latest ecosystem review added three distinct capabilities after checking for overlap with the existing catalog:

- `systematic-debugging` — evidence-first root-cause analysis using reproducible failures, falsifiable hypotheses, isolation, and regression verification;
- `verification-before-completion` — requires current evidence before an agent claims that implementation, debugging, migration, or automation work is complete;
- `composition-patterns` — reusable UI component API design using composition, slots, controlled/uncontrolled state, compound components, and explicit extension points.

Broad React and web-design candidates were intentionally not kept because the repository already contains stronger overlapping coverage through skills such as `react-patterns`, `react-performance`, `design-system`, `frontend-design-direction`, and `make-interfaces-feel-better`. See [`docs/ECOSYSTEM.md`](./docs/ECOSYSTEM.md) for the decision record.

## Supported integrations

The repository includes integration surfaces for:

- Claude Code: `.claude/` and `CLAUDE.md`;
- OpenAI Codex CLI: `.codex/` and `.agents/skills/`;
- Antigravity CLI: `.agy/`;
- MiMo Code: `.mimocode/`;
- OpenCode: `.opencode/`;
- Kimi: `.kimi/`.

Legacy `.gemini/` content is retained for compatibility and migration history, but the active Antigravity integration is documented under `.agy/`.

## Installation

Clone the repository and start the tool from the repository root so it can load project-local instructions and links:

```bash
git clone git@github.com:yusei21/skills.git
cd skills
```

Examples:

```bash
claude
codex
agy
opencode
```

For Claude Code plugin installation, when supported by the current Claude Code version and this repository's plugin metadata:

```text
/plugin marketplace add git@github.com:yusei21/skills.git
/plugin install skills@skills
```

Do not copy all skills into a global tool directory by default. Use the project-local routing skills or install only the specific resources needed for another repository.

## MCP servers

The shared catalog is in [`mcp-configs/mcp-servers.json`](./mcp-configs/mcp-servers.json). Credentials must remain in environment variables or user-level configuration, never in the repository. Enable only the servers needed for a task to preserve context and reduce attack surface.

## Documentation policy

User-facing documentation is maintained in this order:

1. English — canonical source;
2. Portuguese (`pt-BR`);
3. Simplified Chinese (`zh-CN`).

Material documentation changes should update all three variants in the same change set. Code identifiers, command names, file paths, API names, and configuration keys remain in English unless an underlying tool requires localization.

## Structure

```text
skills/
├── skills/          # canonical skills
├── agents/          # canonical agent prompts
├── commands/        # shared commands
├── rules/           # shared rules
├── hooks/           # event-driven automations
├── scripts/         # supporting scripts and runtimes
├── mcp-configs/     # shared MCP catalog
├── .skill-index/    # generated canonical skill discovery index
├── .agents/         # Codex/native skill discovery links
├── .claude/         # Claude-specific integration
├── .codex/          # Codex-specific configuration and native roles
├── .agy/            # Antigravity-specific integration
├── .mimocode/       # MiMo Code-specific integration
├── .opencode/       # OpenCode plugin and integration
├── .kimi/           # Kimi-specific integration
├── .gemini/         # legacy compatibility content
├── docs/            # multilingual guides and ecosystem research
├── AGENTS.md        # shared automatic routing instructions
├── CLAUDE.md        # Claude-specific entry point
├── NOTICE.md        # Portuguese source and license notices
├── NOTICE.en.md     # English source and license notices
└── NOTICE.zh-CN.md  # Simplified Chinese source and license notices
```

## Contributing

Keep shared implementations in the canonical root directories. Integration folders should reference those resources rather than duplicate them.

Before adding a new skill:

1. search the current index and compare intent with existing skills;
2. prefer extending an existing canonical skill over adding a near-duplicate;
3. validate frontmatter, workflow boundaries, safety, and licensing;
4. regenerate the skill index;
5. update user-facing documentation in English, Portuguese, and Simplified Chinese when the change is material.

## License

MIT — see [`LICENSE`](./LICENSE) and [`NOTICE.en.md`](./NOTICE.en.md).
