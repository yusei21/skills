# Review and Instruction Integrity

**English** | [Português](./INTEGRIDADE-DE-REVISAO.md) | [简体中文](./REVIEW-INTEGRITY.zh-CN.md)

This document defines the repository-wide policy for evidence-based code review and for changes to the instruction/control plane used by supported AI coding tools.

The goals are to reduce false-positive review noise, keep shared behavior portable across runtimes, and prevent instruction drift or unsafe capability expansion.

## Review policy

Reviews should optimize for correctness and actionability rather than finding a large number of issues.

For substantial changes, use independent review lenses instead of relying on one undifferentiated pass:

1. **Correctness** — concrete bugs or regressions introduced by the change.
2. **Repository compliance** — applicable `AGENTS.md`, `CLAUDE.md`, rules, and established project conventions.
3. **Context/history** — callers, tests, blame, and targeted history when intent is ambiguous.
4. **Security** — only when the diff crosses a security boundary or changes the agent/tool control plane.

The primary `code-reviewer` already applies a confidence filter. Final orchestration should preserve that behavior:

- report only actionable findings above 80% confidence;
- collapse duplicate findings with the same root cause;
- distinguish newly introduced problems from unrelated pre-existing debt;
- require exact evidence and a concrete failure scenario for HIGH or CRITICAL findings;
- accept zero findings as a valid successful review.

A finding that cannot identify the affected location, trigger, and bad outcome should be downgraded or removed.

## Evidence hierarchy

Use the smallest amount of evidence necessary to verify a finding. Useful sources include:

- changed lines and surrounding implementation;
- callers and data-flow paths;
- tests and fixtures;
- type or schema constraints;
- applicable repository instructions;
- framework/runtime guarantees;
- `git blame` or targeted history for intent-sensitive behavior.

History should clarify context, not create speculative requirements that are absent from current code and documentation.

## Instruction/control-plane changes

Treat the following as control-plane resources because they can change how an agent behaves or what capabilities it uses:

- `AGENTS.md`, `CLAUDE.md`, and closer-scoped instruction files;
- canonical skills and agent prompts;
- rules and hooks;
- MCP/tool configuration;
- plugin or marketplace metadata;
- runtime adapters such as `.claude/`, `.codex/`, `.agy/`, `.mimocode/`, `.opencode/`, `.kimi/`, and compatibility content.

Changes to these files require an instruction-integrity pass in addition to normal prose/code review.

## Instruction-integrity checklist

When instruction or adapter behavior changes:

1. Establish the effective precedence for the affected runtime, including root and closer-scoped instructions.
2. Keep shared policy in canonical resources and native syntax/loading behavior in the relevant adapter.
3. Compare sibling runtimes for contradictions, stale references, accidental duplication, and undocumented divergence.
4. Do not propagate tool-specific directives across every runtime unless their semantics are genuinely portable.
5. Run `skill-security-audit` for prompt-injection risk, unexpected permission expansion, persistence, credential access, unsafe network/tool configuration, and externally sourced instructions.
6. Check whether hooks, MCP servers, scripts, or plugin metadata materially expand shell, filesystem, network, or credential scope.
7. Document intentional runtime-specific differences where a future maintainer would otherwise treat them as drift.

## External plugin and skill patterns

External ecosystems can be useful sources of architecture and workflow ideas. Prefer adapting concepts to this repository's canonical-source model instead of copying tool-specific implementations wholesale.

When content is copied or substantially adapted:

- verify the exact upstream license before adoption;
- preserve required notices and attribution;
- record provenance where repository policy requires it;
- avoid importing implementation details that bind shared behavior to one runtime unnecessarily.

Reimplementing a general workflow pattern in original wording and repository-native structure is preferred when that produces a cleaner portable design.

## Orchestration integration

`project-orchestrator` is responsible for detecting instruction/control-plane work and selecting the relevant audit/review resources.

`orch-pipeline` is responsible for enforcing evidence-based review before its commit gate. Standard and large changes should use separate review lenses when useful, then deduplicate and confidence-filter the resulting findings.

The expected flow is:

```text
inspect repository + instruction hierarchy
                │
                ├── implement / change
                │
                ├── correctness review
                ├── repository-rule review
                ├── context/history review (when needed)
                └── security/control-plane review (when triggered)
                                │
                                └── deduplicate + confidence filter (>80%)
                                                │
                                                └── resolve HIGH/CRITICAL → commit gate
```

## Maintenance rule

If a future change weakens the confidence threshold, removes instruction-precedence checks, or introduces a second physical source of truth in an adapter, it should include a documented reason and migration strategy.
