---
name: systematic-debugging
description: Diagnose software failures with an evidence-first workflow that reproduces the issue, narrows the fault domain, tests hypotheses, fixes the root cause, and verifies against regressions.
metadata:
  origin: original
  references:
    - obra/superpowers
---

# Systematic Debugging

Use this skill when a bug is unclear, intermittent, cross-layer, or has already resisted one or more attempted fixes.

## When to Activate

- A test fails for an unknown reason
- A production incident has multiple plausible causes
- A previous patch treated a symptom but the failure returned
- Logs, traces, database state, and code disagree
- A bug appears only under concurrency, load, timing, or specific environments
- The user asks for root-cause analysis rather than a speculative patch

## Core Rule

Do not modify code until you can state a falsifiable hypothesis about the failure.

A good hypothesis has four parts:

1. **Observed failure** — what is actually wrong.
2. **Suspected mechanism** — what could produce that failure.
3. **Evidence** — what currently supports the mechanism.
4. **Disproof test** — what observation would prove the hypothesis wrong.

## Workflow

### 1. Reproduce

Create the smallest reliable reproduction possible.

Record:

- exact command or request
- environment and configuration
- input data
- expected result
- actual result
- frequency: always, intermittent, load-dependent, environment-specific

If the issue cannot be reproduced, improve observability before changing behavior.

### 2. Establish the Boundary

Identify where correct behavior becomes incorrect.

Trace the path through relevant layers, for example:

```text
request
  -> validation
  -> domain logic
  -> persistence
  -> external dependency
  -> response
```

At each boundary compare expected and actual values.

Prefer inspecting real values over inferring them from code.

### 3. Reduce the Search Space

Use binary isolation where possible:

- disable one subsystem at a time
- replace external dependencies with deterministic fixtures
- compare known-good and failing inputs
- compare known-good and failing commits
- bisect data transformations
- isolate concurrency from business logic

Do not change several variables simultaneously.

### 4. Form Ranked Hypotheses

List the most plausible causes in order.

Example:

```text
H1: stale cache returns pre-update data
H2: transaction commits after response serialization
H3: read replica lag exposes old state
```

Rank by evidence, not intuition.

### 5. Test One Hypothesis

Design the cheapest discriminating test.

Good tests answer one question clearly:

- add a focused assertion
- inspect one trace span
- force a deterministic schedule
- bypass one cache
- pin one dependency version
- compare one database transaction boundary

If the test disproves the hypothesis, remove any temporary diagnostic changes and move to the next hypothesis.

### 6. Fix the Root Cause

The fix should target the mechanism that produced the failure.

Avoid patches such as:

- arbitrary retries without understanding the failure mode
- sleeps added to timing-sensitive code
- broad exception swallowing
- duplicated validation at unrelated layers
- state resets that hide corruption

When a guard or retry is genuinely required, document the condition it protects against.

### 7. Add a Regression Test

A root-cause fix is incomplete without a test that fails on the old behavior and passes on the new behavior when practical.

Prefer the narrowest test that captures the invariant.

### 8. Verify the System

Run:

1. the focused reproduction
2. related unit/integration tests
3. lint/type checks where relevant
4. the broader test suite when risk justifies it

Check logs for new warnings or hidden retries.

## Debugging Evidence Table

For complex failures maintain a compact table:

| Observation | Supports | Weakens | Confidence |
|---|---|---|---|
| stale value only after cache hit | H1 | H2 | high |
| primary DB contains new value | H1/H3 | H2 | medium |
| bypassing cache fixes response | H1 | H2/H3 | very high |

This prevents circular reasoning and repeated experiments.

## Concurrency Bugs

For race conditions, capture ordering explicitly.

Look for:

- shared mutable state
- check-then-act sequences
- missing transaction boundaries
- non-idempotent retries
- lock scope mismatches
- event ordering assumptions
- time-of-check/time-of-use gaps

Create deterministic scheduling tests when possible instead of relying on repeated stress runs alone.

## Dependency Regressions

When a failure follows a dependency or toolchain update:

1. confirm the version boundary
2. read the relevant changelog or migration notes
3. reproduce with old and new versions
4. identify changed behavior before pinning or downgrading

A version pin is a containment action, not a root-cause explanation.

## Completion Criteria

Do not declare the bug fixed until you can answer:

- What was the root cause?
- What evidence proved it?
- Why does the fix address that mechanism?
- What test prevents regression?
- What adjacent behavior was verified?

If any answer is missing, report the remaining uncertainty explicitly.
