# Advanced Usage Guide

**English** | [Português](./GUIA.md) | [简体中文](./GUIDE.zh-CN.md)

This guide assumes the repository is already installed (see
[`README.md`](../README.md) for installation instructions). The focus here
is how to use every piece of the repository as efficiently as possible.

## 1. When to use each type of resource

| Resource | What it's for | When to trigger it |
|---|---|---|
| **Agents** (`agents/`) | Delegated, scoped tasks (e.g. code review, build error resolution) | When the task is well-defined and isolated — let the agent run without cluttering the main context |
| **Skills** (`skills/`) | Reusable workflows and domain knowledge | The main day-to-day surface — call directly or let Claude Code suggest one automatically |
| **Rules** (`rules/`) | Always-on guidelines (code style, testing, security) | Loaded at all times — use to standardize behavior without repeating instructions |
| **Hooks** (`hooks/`) | Event-triggered automation (e.g. block a commit with an exposed secret) | Set up once, runs on its own from then on |
| **Commands** (`commands/`) | `/slash` shortcuts for specific skills/flows | When you want to trigger something quickly without spelling out the task |

## 2. Common workflows

### Starting a new feature
```
/plan "feature description"   → planning agent produces a blueprint
TDD skill                      → write the test before the implementation
/code-review                   → quality and security review
```

### Fixing a bug
```
TDD skill      → write a test that reproduces the bug (fails first)
                 → implement the fix, confirm the test passes
/code-review   → check nothing else broke
```

### Getting ready for production
```
/security-scan     → security checklist
E2E testing skill  → test critical user flows
/test-coverage     → confirm test coverage
```

Adjust the command/skill names above to whatever actually exists in this
repository — use `/plugin list skills@skills` to see the real list.

## 3. Combining agents and skills

An agent can invoke a skill as part of its process. For example, a code
review agent might consult a security-patterns skill before giving its
final verdict. When creating your own agents, reference existing skills
instead of duplicating knowledge — it keeps the repository easier to
maintain.

## 4. Rules: common vs. language-specific

Always install the `rules/common/` folder (universal) and add **only** the
language(s) you actually use. This avoids:
- Unnecessary context eating up tokens
- Convention conflicts between languages you don't use

## 5. Token/cost optimization

- Prefer the default model (`sonnet`) for most tasks; switch to a more
  expensive model only when you need deeper reasoning.
- Use `/clear` between unrelated tasks — it's instant and free.
- Use `/compact` at logical breakpoints (after research, before
  implementation; after finishing a milestone) — not mid-implementation,
  or you'll lose variable names and partial state.
- Don't enable too many MCP servers at once — each one consumes context
  window tokens just by being listed as a tool.

## 6. Adding content from other repositories

Whenever you bring in code, skills, or configs from another repository:

1. Check the source's license before copying:
   - **MIT / Apache-2.0 / BSD:** generally permissive; preserve required notices
   - **GPL / AGPL:** review redistribution and copyleft obligations carefully
   - **No declared license:** don't copy without explicit permission
2. Review the skill and any scripts, dependencies, assets, hooks, or MCP config before trusting it
3. Prefer implementing a needed capability from public patterns rather than copying unrelated source material
4. Put the content in the matching canonical folder here (`agents/`, `skills/`, `rules/`, etc.)
5. If copyrighted third-party material is actually copied or adapted, update [`NOTICE.md`](../NOTICE.md), [`NOTICE.en.md`](../NOTICE.en.md), and [`NOTICE.zh-CN.md`](../NOTICE.zh-CN.md) with source, copyright, license, and adaptation notes

## 7. Customizing what's already here

The inherited content is a starting point, not a final destination:

1. Start with what already fits your workflow
2. Adapt rules and skills to your actual stack
3. Remove what you never use (less loaded context = more efficiency)
4. Document your own patterns as new skills as you learn them
