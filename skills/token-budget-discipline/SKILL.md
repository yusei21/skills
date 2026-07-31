---
name: token-budget-discipline
description: Establish explicit per-task and per-session budgets for model tokens, tool calls, retries, context growth, and autonomous iterations. Use for long-running, multi-step, agentic, research, debugging, optimization, or delegated workflows where uncontrolled loops can waste cost and reduce reliability.
metadata:
  origin: local
---

# Token Budget Discipline

## Objective

Turn token and iteration limits into execution controls rather than vague optimization advice.

This skill creates a bounded operating envelope for an agent session. It requires the agent to define budgets, measure progress through observable proxies, stop unproductive loops, preserve capacity for verification and the final answer, and ask for scope changes instead of silently consuming unlimited resources.

The central rule is:

> Every non-trivial agent task must have a finite budget, explicit checkpoints, and a stop condition.

## When to Use

Apply automatically when a task is expected to involve any of the following:

- more than three substantive tool calls;
- repository-wide investigation or implementation;
- web or document research across multiple sources;
- iterative debugging, optimization, repair, or benchmark loops;
- subagents, delegated work, or parallel branches;
- large context inputs or many loaded skills and tools;
- repeated retries against an API, test suite, build, browser, or external system;
- autonomous execution where the user is not approving each step;
- expensive models or metered external services;
- a risk of repeatedly revisiting the same evidence without progress.

For simple tasks, use the lightweight default budget and do not burden the user with bookkeeping.

## Budget Dimensions

Do not manage only output tokens. Define limits across the resources that actually drive cost and loops.

| Dimension | What it limits |
| --- | --- |
| Input/context budget | Files, tool schemas, conversation history, retrieved documents, and prompts loaded into context |
| Reasoning/output budget | Model generation used for analysis, synthesis, code, and final response |
| Tool-call budget | Total calls and calls per tool category |
| Iteration budget | Number of plan-execute-observe cycles |
| Retry budget | Repeated attempts after the same failure class |
| Delegation budget | Number of subagents and their allowed scope |
| Time budget | Wall-clock or phase duration when measurable |
| External-cost budget | Paid APIs, model tiers, cloud jobs, or other metered services |

When exact token telemetry is unavailable, use conservative proxies such as line count, character count, file count, document count, tool-call count, elapsed phases, and retry count. Never pretend an estimate is exact.

## Default Budget Profiles

Choose the smallest profile that fits the task. User-provided limits override these defaults.

### Small

Use for focused questions or edits.

```yaml
max_iterations: 3
max_tool_calls: 8
max_same_failure_retries: 1
max_files_opened: 8
reserve_for_verification_percent: 15
reserve_for_final_percent: 20
```

### Standard

Use for normal repository tasks, moderate research, and multi-file implementation.

```yaml
max_iterations: 6
max_tool_calls: 20
max_same_failure_retries: 2
max_files_opened: 20
max_subagents: 2
reserve_for_verification_percent: 15
reserve_for_final_percent: 15
checkpoint_percentages: [40, 70, 90]
```

### Extended

Use only for genuinely large work with clear milestones.

```yaml
max_iterations: 10
max_tool_calls: 40
max_same_failure_retries: 2
max_files_opened: 40
max_subagents: 4
reserve_for_verification_percent: 15
reserve_for_final_percent: 15
checkpoint_percentages: [25, 50, 75, 90]
```

Extended is not permission for open-ended execution. Larger work should be decomposed into separately budgeted tasks.

## Required Budget Header

At the start of a substantial task, create an internal budget record:

```yaml
budget:
  profile: standard
  objective: <single measurable outcome>
  scope_in: [<included work>]
  scope_out: [<explicit exclusions>]
  max_iterations: 6
  max_tool_calls: 20
  max_same_failure_retries: 2
  max_subagents: 2
  verification_reserve_percent: 15
  final_response_reserve_percent: 15
  stop_conditions:
    - objective_met
    - budget_exhausted
    - blocked_by_missing_authority_or_input
    - repeated_failure_without_new_evidence
```

Do not expose this header unless it helps the user understand a long or constrained workflow.

## Execution Algorithm

### 1. Define a measurable objective

Replace broad goals such as “improve the code” with a finite result such as:

- fix the failing test and preserve the existing suite;
- identify the three highest-confidence root causes;
- implement the requested endpoint in the named modules;
- compare five candidates using stated criteria;
- produce a verified migration plan without executing it.

A budget cannot control work whose completion condition is undefined.

### 2. Partition the budget by phase

A recommended allocation is:

| Phase | Typical share |
| --- | ---: |
| Scope and plan | 10% |
| Evidence gathering | 25% |
| Implementation or synthesis | 35% |
| Verification and repair | 15% |
| Final response and handoff | 15% |

Adjust based on task type, but never consume the verification or final-response reserve during early exploration.

### 3. Use progressive disclosure

Load context in layers:

1. indexes, manifests, directory summaries, and metadata;
2. only the most relevant files or sources;
3. neighboring implementation details when evidence requires them;
4. broad scans only after targeted inspection fails.

Do not recursively read an entire repository, load every skill, or retrieve every search result by default.

### 4. Track progress by evidence gained

After each iteration, record internally:

```text
iteration: N
calls_used: X / limit
new_evidence: <what became known>
objective_progress: <observable change>
open_risks: <remaining blockers>
next_action: <single highest-value step>
```

An iteration is productive only if it adds evidence, changes the artifact, eliminates a hypothesis, or completes a verification gate.

### 5. Enforce retry discipline

Classify failures by signature: same command, same error class, same endpoint response, same test failure, or same unmet assumption.

For the same failure signature:

1. First failure: inspect evidence and make one targeted correction.
2. Second failure: change strategy, tool, assumption, or scope.
3. Third occurrence: stop that loop and report the blocker unless the user explicitly authorizes more attempts.

Changing superficial prompt wording does not count as a new strategy.

### 6. Run checkpoints

At each configured checkpoint, answer:

- Is the objective still reachable within the remaining budget?
- Which evidence or artifact justifies continuing?
- Is the current strategy producing new information?
- Has scope expanded beyond the original objective?
- Are verification and final-response reserves intact?
- Can deterministic tooling replace remaining model work?

Choose exactly one action:

```text
CONTINUE — progress is measurable and budget is sufficient.
NARROW — preserve the core outcome and drop lower-value scope.
CHANGE STRATEGY — current approach has stalled but another bounded route exists.
HAND OFF — provide completed work and a clearly defined remainder.
STOP — objective is met, blocked, unsafe, or budget-exhausted.
```

### 7. Terminate cleanly

Stop execution when any of these occurs:

- acceptance criteria pass;
- remaining work cannot fit inside the preserved reserve;
- the same failure recurs beyond the retry limit;
- two consecutive iterations add no material evidence or artifact progress;
- required access, authority, input, or external dependency is unavailable;
- continuing would exceed a user-defined cost or time constraint;
- the task has expanded into a materially different objective.

Do not hide budget exhaustion by producing an unverified answer.

## Loop Circuit Breakers

The following rules are mandatory for autonomous loops:

### No-progress breaker

Stop or change strategy after two consecutive iterations with no new evidence, no artifact change, and no hypothesis eliminated.

### Duplicate-call breaker

Do not repeat an identical tool call with identical inputs unless the underlying state is expected to have changed and that expectation is stated.

### Search saturation breaker

Stop broadening search when two consecutive queries return substantially overlapping evidence. Synthesize what is known or identify the precise missing fact.

### Repair breaker

After two failed repairs for the same error signature, revert to the last known-good state when possible and isolate the failure before attempting another change.

### Delegation breaker

Do not spawn a subagent whose scope duplicates active work. Every subagent must have a distinct deliverable, input boundary, and call or token allowance.

### Context breaker

When context grows faster than evidence, compact into a state summary containing decisions, facts, unresolved questions, changed files, and verification status. Discard redundant raw output rather than carrying it forward.

## Budget-Aware Model Routing

Use the least expensive model or mechanism that meets the quality requirement.

Route work as follows:

1. deterministic tools for exact computation and validation;
2. lightweight model for extraction, classification, formatting, and bounded transformations;
3. stronger reasoning model for architecture, ambiguous debugging, trade-offs, and synthesis;
4. additional model calls only when they provide independent evidence or a materially different capability.

Do not use multiple models merely to vote on facts that a tool can verify.

## Scope Expansion Protocol

When new work appears during execution:

- classify it as required, optional, or unrelated;
- absorb required work only if the original objective still fits the remaining budget;
- defer optional work to a follow-up item;
- reject unrelated scope from the current loop;
- re-budget explicitly when the user changes the objective.

Never let incidental findings silently convert a focused task into a repository-wide refactor.

## Verification Reserve

The verification reserve may be spent only on:

- builds, tests, type checks, lint, schema validation, or static analysis;
- reviewing the final diff or generated artifact;
- confirming cited sources and key claims;
- one bounded repair pass for verification failures.

If implementation consumes the reserve, stop adding features and report that verification is incomplete.

## Final Response Reserve

Always preserve enough capacity to communicate:

- what was completed;
- what was verified;
- what remains uncertain or blocked;
- files or systems changed;
- budget-triggered scope reductions;
- the next highest-value action, when relevant.

A task is not complete if the agent has no capacity left to produce a usable handoff.

## Status Formats

### Checkpoint

```text
Budget checkpoint: 70%
Progress: <completed milestones>
Evidence: <key verification or findings>
Remaining budget: <calls/iterations or estimated capacity>
Decision: CONTINUE | NARROW | CHANGE STRATEGY | HAND OFF | STOP
Next bounded action: <one action>
```

### Budget-constrained handoff

```text
Completed:
- <verified result>

Not completed:
- <remaining item and reason>

Verification:
- <checks run and status>

Stop reason:
- <budget, blocker, repeated failure, or scope change>

Recommended next task:
- <separately budgeted continuation>
```

## Interaction with Users

- Honor explicit user token, cost, time, or call limits exactly.
- For a destructive or costly continuation, request authorization before increasing the budget.
- Do not ask for approval at every checkpoint when work remains safe and inside the agreed scope.
- Do not claim exact token usage without telemetry.
- Report meaningful scope reduction or incomplete verification.
- Prefer a useful partial result over an unbounded loop.

## Integration

Use together with:

- `prefer-deterministic-code` to eliminate unnecessary inference;
- `context-budget` to measure static context overhead;
- `project-orchestrator` for minimal skill and file loading;
- `verification-loop` for the protected verification phase;
- `agent-self-evaluation` for a final bounded quality check;
- `autonomous-loops` or `continuous-agent-loop` as their execution guardrail.

## Anti-Patterns

- “Continue until solved” without a maximum iteration count.
- Repeating the same failing action with slightly different wording.
- Consuming the entire context on research before implementation begins.
- Loading all skills, agents, or source files preemptively.
- Spawning several agents with overlapping assignments.
- Reporting precise token counts derived from rough estimates.
- Spending the verification reserve on optional implementation.
- Continuing after the objective is met because budget remains.
- Hiding incomplete work behind confident prose.
