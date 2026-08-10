---
name: webapp-testing
description: Plan and execute browser-based web application testing across critical user journeys, regression risks, forms, authentication, accessibility, responsive layouts, and network failures. Use when validating a web feature, reproducing a browser bug, designing E2E coverage, or producing evidence-rich test reports.
metadata:
  origin: original
---

# Web Application Testing

Test web applications as user-facing systems, not only as collections of selectors and assertions.

## When to activate

Use this skill when the task involves:

- validating a web feature before release;
- reproducing a UI or browser-specific bug;
- creating or improving end-to-end tests;
- reviewing critical user journeys;
- testing authentication, forms, navigation, permissions, or checkout-like flows;
- checking responsive behavior or accessibility;
- investigating flaky browser tests;
- collecting actionable evidence for a web defect.

## Core principles

1. **Test outcomes, not implementation details.** Prefer user-visible behavior and stable semantics over fragile CSS structure.
2. **Start from risk.** Critical flows, state transitions, money, permissions, data loss, and authentication deserve deeper coverage.
3. **Keep tests deterministic.** Control data, time, network dependencies, and environment assumptions whenever possible.
4. **Capture evidence.** A failed assertion without URL, steps, console/network context, and expected behavior is often not enough to debug efficiently.
5. **Do not mutate production unintentionally.** Use dedicated test environments and safe accounts for destructive flows.
6. **Separate product bugs from test bugs.** Diagnose selector instability, timing, fixtures, and environment failures before changing application code.

## Testing workflow

### 1. Establish the test target

Record:

- base URL and environment;
- browser(s) and viewport(s);
- authentication state and test accounts;
- feature/commit/build under test;
- required services or feature flags;
- whether actions can safely create, edit, purchase, send, or delete data.

Do not guess whether a production system is safe to mutate.

### 2. Build a risk map

Classify relevant behavior:

```text
Critical
- login / account recovery
- authorization boundaries
- purchase / payment confirmation
- destructive actions
- data persistence

High
- primary product workflow
- forms with important data
- uploads / downloads
- invitations / sharing

Normal
- navigation
- filtering / sorting
- visual states
- secondary settings
```

Test the highest-risk paths first.

### 3. Define user journeys

Write each journey as a short sequence with a clear outcome.

Example:

```text
Given a registered user
When they sign in with valid credentials
And open account settings
And update the display name
Then the new name is visible after reload
```

Cover at least:

- happy path;
- invalid or missing input;
- permission denial;
- retry/reload behavior where relevant;
- interrupted network or upstream failure for critical actions;
- persistence after navigation or refresh if state should survive.

## Selector strategy

Prefer selectors based on accessible meaning and stable test contracts.

Priority:

1. role + accessible name;
2. label text for form controls;
3. intentionally stable test IDs when semantic selectors are insufficient;
4. stable text when localization/content changes are not expected.

Avoid relying on:

- generated class names;
- deep DOM ancestry;
- `nth-child` when item identity matters;
- layout-only selectors;
- arbitrary sleeps used to hide synchronization problems.

## Synchronization

Wait for meaningful states rather than fixed timeouts.

Prefer waiting for:

- a specific response;
- navigation completion;
- an element becoming visible/enabled;
- a loading indicator disappearing;
- a known application state.

If a test requires a long fixed sleep to pass, treat that as a flakiness signal.

## Test data

Good browser tests control their data lifecycle.

Prefer:

- unique generated identifiers;
- API/database fixtures prepared before browser steps when appropriate;
- isolated accounts or tenants;
- cleanup that is safe to retry;
- seeded deterministic data for read-only scenarios.

Do not make unrelated E2E tests depend on execution order.

## Coverage areas

### Authentication and session

Check:

- successful sign-in and sign-out;
- invalid credentials;
- expired/revoked sessions;
- protected page redirects;
- role or tenant boundaries;
- back/forward and reload behavior;
- sensitive state after logout.

### Forms

Check:

- required fields;
- invalid formats and boundaries;
- server-side validation errors;
- disabled/loading submit states;
- duplicate submission protection;
- preservation or intentional clearing of values after errors;
- keyboard submission where expected.

### Navigation

Check:

- direct deep links;
- client-side navigation;
- browser back/forward;
- unknown routes / 404 behavior;
- external links when business-critical;
- state encoded in query parameters where applicable.

### Responsive behavior

For important screens, test representative widths rather than every device.

Verify:

- no inaccessible off-screen controls;
- menus remain operable;
- forms do not overflow;
- primary actions remain reachable;
- tables/cards degrade intentionally;
- orientation/viewport changes do not corrupt state when relevant.

### Accessibility

Include basic interaction checks even when a dedicated accessibility audit exists:

- important controls have accessible names;
- keyboard navigation reaches interactive elements;
- focus is visible and moves logically;
- dialogs manage focus appropriately;
- form errors are associated with inputs;
- critical flows do not require a pointer only.

Use automated accessibility scanners as evidence, not as proof that the UI is fully accessible.

### Network and failure states

For critical flows, simulate or observe:

- slow responses;
- timeout/offline state;
- 4xx validation/permission failures;
- 5xx upstream failure;
- duplicate/retried requests;
- partial loading.

Verify the user sees an actionable state and that unsafe duplicate mutations do not occur.

## Browser diagnostics

When a test fails, capture what materially helps diagnosis:

- current URL;
- screenshot at failure;
- trace/video when supported and useful;
- browser console errors;
- failed network requests and status codes;
- relevant request identifiers;
- visible UI state;
- test data identifiers;
- exact browser/viewport.

Do not include passwords, session tokens, authorization headers, private customer data, or unrelated secrets in reports or artifacts.

## Flaky test diagnosis

Classify flakes before fixing them:

```text
Timing/synchronization
Selector instability
Shared state/test ordering
Uncontrolled external service
Animation/transition
Browser-specific behavior
Resource exhaustion/CI environment
Actual race condition in product code
```

Never solve flakiness by increasing every timeout without identifying the cause.

Useful remediation patterns:

- replace sleeps with state-based waits;
- isolate test data;
- mock only unstable external dependencies, not the behavior being tested;
- use resilient semantic selectors;
- disable irrelevant animations in test mode;
- expose deterministic backend setup APIs for tests;
- preserve traces for retries so first-failure evidence is not lost.

## Bug report format

For each product defect, report:

```text
Title: concise observable failure
Severity: critical | high | medium | low
Environment: URL/build/browser/viewport
Preconditions: account/data/flags
Steps:
1. ...
2. ...
Expected: ...
Actual: ...
Reproducibility: always | intermittent | once
Evidence: screenshot/trace/console/network identifiers
Suspected scope: optional, only when evidence supports it
```

Do not present a suspected root cause as fact unless it has been verified.

## E2E implementation checklist

- [ ] test name describes user outcome;
- [ ] setup creates only required state;
- [ ] selectors are stable and semantic;
- [ ] assertions verify meaningful behavior;
- [ ] no unnecessary fixed sleeps;
- [ ] test can run independently;
- [ ] destructive actions use safe test data/environment;
- [ ] failure artifacts are available;
- [ ] secrets are redacted;
- [ ] cleanup is safe or data is disposable;
- [ ] retries do not hide a consistently failing first attempt.

## Deliverable

For a testing request, provide:

```text
Web Test Report
- scope and environment
- risk-ranked journeys tested
- passed scenarios
- failed scenarios
- blocked/not-tested scenarios
- defects with reproduction steps
- console/network evidence
- accessibility/responsive observations
- flakiness observations
- recommended next tests
```

When writing automated tests, keep the report brief and point to the exact test files and scenarios added.
