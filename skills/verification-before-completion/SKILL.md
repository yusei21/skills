---
name: verification-before-completion
description: Require concrete evidence before declaring implementation work complete by checking acceptance criteria, tests, static analysis, runtime behavior, artifacts, and remaining risks.
metadata:
  origin: original
  references:
    - obra/superpowers
---

# Verification Before Completion

Use this skill before claiming that a coding, debugging, migration, refactor, or automation task is complete.

## Principle

Completion is an evidence claim, not a confidence statement.

Do not say "done", "fixed", "working", "passed", or equivalent unless the evidence required for that claim has been gathered in the current work context.

## Verification Ladder

Run the narrowest checks first, then broaden based on risk.

### Level 1 — Artifact Verification

Confirm that expected outputs exist and contain the intended change.

Examples:

- file was created at the expected path
- configuration key is present
- generated artifact is not empty
- migration contains the intended operation
- API schema exposes the intended field

### Level 2 — Focused Behavioral Check

Exercise the exact behavior requested.

Examples:

- run the new unit test
- call the changed endpoint
- execute the CLI command
- render the affected UI state
- reproduce the original bug and confirm it no longer occurs

### Level 3 — Related Regression Checks

Run nearby tests and checks likely to be affected.

Examples:

- package or module test suite
- type checker
- linter
- schema validation
- contract tests
- migration dry run

### Level 4 — Broad Verification

Use for high-risk or cross-cutting changes.

Examples:

- full test suite
- build
- integration environment
- end-to-end tests
- security scan
- benchmark or load test

## Acceptance-Criteria Matrix

For non-trivial tasks, map requirements to evidence.

| Requirement | Verification | Result |
|---|---|---|
| User can reset password | API/e2e test | pass |
| Expired token rejected | unit/integration test | pass |
| Existing login unaffected | auth regression suite | pass |

Do not treat one passing test as proof of unrelated criteria.

## Never Infer Tool Results

Do not claim a command passed unless it was actually run and its result observed.

Bad:

```text
The tests should pass now.
```

Good:

```text
`pytest tests/auth/test_reset.py` passed: 8 tests.
```

If a tool cannot be run, say what remains unverified.

## Verify the Original Failure

For bug fixes, the original reproduction is the most important check.

A green general test suite is insufficient when it does not exercise the reported failure mode.

## Verify Negative Paths

For logic involving permissions, validation, security, payments, or state transitions, test rejection paths as well as success paths.

Examples:

- unauthenticated request denied
- malformed input rejected
- duplicate operation remains idempotent
- unauthorized role cannot perform action
- timeout does not corrupt state

## Check for Hidden Degradation

A change can satisfy the requested behavior while introducing another problem.

Inspect for:

- warnings in logs
- swallowed exceptions
- unexpected retries
- large latency increases
- dependency changes
- disabled validation
- skipped tests
- broadened permissions
- accidental debug output

## Environment Mismatch

If local verification differs from CI or production, record:

- runtime versions
- feature flags
- database/schema version
- OS/architecture when relevant
- dependency lock state
- required external services

Do not collapse environment-specific evidence into a universal claim.

## Completion Report

Before finalizing, summarize only what matters:

```text
Implemented:
- <change>

Verified:
- <command/check>: pass
- <command/check>: pass

Not verified:
- <item>, because <reason>

Remaining risk:
- <risk or none identified>
```

## Stop Conditions

Do not declare completion when:

- required tests are failing
- the requested behavior was not exercised
- generated artifacts were not inspected
- a migration was written but not validated
- a security-sensitive negative path is untested
- the only evidence is code inspection for behavior that can be executed

In these cases, report partial completion and the exact missing verification.
