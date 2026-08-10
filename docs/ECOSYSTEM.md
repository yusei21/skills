# Agent Skills Ecosystem Research

**English** | [Português](./ECOSYSTEM.pt-BR.md) | [简体中文](./ECOSYSTEM.zh-CN.md)

This document records the external skill ecosystems reviewed when evolving this repository and the criteria used to decide what should be implemented locally.

> Snapshot date: 2026-08-10. Popularity and repository activity change over time.

## Goal

The goal is not to mirror every public skill repository. Large skill catalogs quickly accumulate overlapping instructions, increase maintenance cost, and make routing less precise.

New skills should add a distinct reusable capability, fit the repository's multi-tool architecture, and be useful without depending on a single model vendor whenever possible.

## Repositories reviewed

### obra/superpowers

A highly adopted agentic software-development methodology focused on disciplined workflows such as brainstorming, debugging, planning, review, testing, worktrees, and verification.

Repository characteristics observed during this review:

- very high GitHub adoption;
- MIT license;
- strong focus on software-development process rather than framework-specific reference material;
- active development in 2026.

Concepts selected for original local implementations:

- `systematic-debugging`
- `verification-before-completion`

The local skills are independently written for this repository's conventions rather than copied from upstream text.

### anthropics/skills

Anthropic's official public Agent Skills repository. It provides a useful reference for the canonical `SKILL.md` model and includes areas such as document handling, MCP construction, frontend design, web-app testing, API usage, and artifact creation.

Many of its high-value capability areas are already represented here. In particular, this repository already had `mcp-builder` before this research pass, so duplicating that capability was rejected.

### vercel-labs/agent-skills

Vercel's official agent-skill collection is a strong reference for modern React and web development. During this review the repository exposed skills around React practices, component composition, React Native, Vercel deployment, web design, and related frontend workflows.

One concept was selected for an original local implementation:

- `composition-patterns`

Two additional candidates were implemented temporarily during the review and then removed after the full local catalog was inspected:

- `react-best-practices` overlapped substantially with the existing `react-patterns` and `react-performance` skills;
- `web-design-guidelines` overlapped substantially with `design-system`, `frontend-design-direction`, `make-interfaces-feel-better`, and accessibility-oriented material.

No upstream prose was copied. At the time of this snapshot GitHub did not expose a repository license for `vercel-labs/agent-skills`, so only capability gaps and high-level topics were used as research signals.

### trailofbits/skills

Trail of Bits maintains a security-focused skill ecosystem covering audit context, code review, vulnerability research, static/dynamic analysis, secure contracts, and specialized security tooling.

This repository already contains a substantial `security-review` skill and related security material. A new broad security-review skill was therefore not added in this pass to avoid intent-level duplication.

## Registry and ecosystem signals

Public skill registries in 2026 show very rapid growth and heavy concentration around software engineering, frontend/UI work, information retrieval, and content creation.

The ecosystem also shows significant redundancy: many skills describe nearly identical intents with slightly different prompts. For this repository, popularity is therefore a discovery signal, not a reason to import a skill automatically.

## Selection criteria

A candidate skill should normally satisfy all of the following:

1. **Distinct intent** — it does not substantially duplicate an existing canonical skill.
2. **Repeated utility** — it applies to many repositories or recurring tasks.
3. **Clear activation** — an agent can tell when to load it.
4. **Actionable procedure** — it contains a workflow or decision framework, not generic advice.
5. **Verifiable outcome** — the skill encourages evidence, tests, review, or measurable completion criteria.
6. **Tool portability** — it can work across Claude Code, Codex, OpenCode, Antigravity, and other integrations where practical.
7. **Safe scope** — high-impact actions require explicit controls and do not encourage blind execution.
8. **License hygiene** — copied or adapted material must have compatible licensing and attribution; otherwise implement the capability independently.

## Skills added in this research pass

| Skill | Primary gap | Research signal |
|---|---|---|
| `systematic-debugging` | Evidence-first, falsifiable root-cause analysis | obra/superpowers |
| `verification-before-completion` | Evidence discipline before completion claims | obra/superpowers |
| `composition-patterns` | Reusable component API and extension-point design | vercel-labs/agent-skills |

These three were retained because their activation intent remains distinct enough from the existing catalog after a second-pass overlap review.

## Candidates intentionally not added

The following areas were reviewed but rejected or deferred:

- broad React best practices — already covered by `react-patterns`, `react-performance`, and related React skills;
- broad web-design review — already covered by `design-system`, `frontend-design-direction`, `make-interfaces-feel-better`, accessibility, and related UI skills;
- test-driven development — already represented by `tdd-workflow` and language/framework-specific TDD skills;
- Git worktree workflows — useful for parallel agents, but should be integrated with the repository's existing orchestration and DevFleet material instead of added as an isolated duplicate;
- Vercel deployment — provider-specific and should be added only if demand justifies a dedicated skill;
- broad security review — already represented by `security-review`; future security additions should be narrower specialist capabilities;
- document-generation skills — already substantially represented by the current catalog and upstream integrations.

## Maintenance policy

When reviewing external skill ecosystems in the future:

1. inspect the existing local index first;
2. compare intent, not only skill names;
3. prefer extending an existing skill over adding a near-duplicate;
4. record the source used as a research signal;
5. check repository licensing before adaptation;
6. write original material when licensing is absent or uncertain;
7. update `.skill-index/skills.json` after adding canonical skills;
8. keep multilingual documentation semantically aligned.
