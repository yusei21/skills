---
name: react-best-practices
description: Build and review React applications for correctness, performance, maintainability, accessibility, and predictable rendering using modern component, state, data-fetching, and profiling practices.
metadata:
  origin: original
  references:
    - vercel-labs/agent-skills
---

# React Best Practices

Use this skill when implementing, reviewing, or optimizing React applications and component libraries.

## When to Activate

- Creating or refactoring React components
- Reviewing rendering or state-management problems
- Investigating unnecessary re-renders
- Designing data-fetching boundaries
- Improving perceived performance
- Reviewing React accessibility
- Migrating legacy component patterns

## Start With Correctness

Before optimizing, identify the component's contract:

- inputs (props, context, URL state, external stores)
- owned state
- derived state
- side effects
- rendered output
- user interactions
- loading, empty, error, and success states

Avoid performance work that obscures incorrect state ownership.

## State Ownership

Keep state as close as practical to the components that own it.

Prefer:

- local state for local interaction
- URL state for shareable/navigation state
- server/cache state for remote resources
- context for stable cross-tree dependencies
- external stores only when coordination genuinely requires them

Avoid duplicating the same logical state in multiple places.

### Derived State

If a value can be computed from current props/state during render, usually compute it instead of storing it separately.

Bad pattern:

```tsx
const [fullName, setFullName] = useState('')

useEffect(() => {
  setFullName(`${firstName} ${lastName}`)
}, [firstName, lastName])
```

Prefer:

```tsx
const fullName = `${firstName} ${lastName}`
```

## Effects Are for Synchronization

Use effects to synchronize React with something outside React:

- browser APIs
- subscriptions
- timers
- analytics
- imperative widgets
- network/resource lifecycles when the framework does not provide a better primitive

Do not use effects as a general-purpose way to derive values or sequence ordinary application logic.

When using an effect, define:

1. what external system is being synchronized
2. what starts the synchronization
3. how it is cleaned up
4. what happens when dependencies change

## Component Boundaries

A component should have a coherent responsibility.

Split when:

- independent parts re-render for unrelated reasons
- a section has its own state or data lifecycle
- a branch is reusable or independently testable
- the component mixes orchestration and detailed presentation

Do not split purely to reduce line count.

## Rendering Performance

Measure before adding memoization.

Investigate:

- large component subtrees re-rendering on every keystroke
- unstable object/function props crossing expensive boundaries
- expensive calculations repeated during render
- lists without stable keys
- state lifted higher than necessary
- context values recreated every render

Use profiling evidence to choose optimizations.

### Memoization

`memo`, `useMemo`, and `useCallback` are tools, not defaults.

Use them when they prevent measured work or provide a required stable identity.

Avoid wrapping trivial calculations or every function automatically; unnecessary memoization increases cognitive cost and can fail to improve runtime performance.

## Lists and Keys

Keys represent identity, not position.

Prefer stable IDs from the underlying data.

Avoid array indexes as keys when items can be inserted, deleted, reordered, or filtered, because state may attach to the wrong item.

## Data Fetching

Prefer framework/server primitives when available instead of manually reproducing caching, deduplication, loading boundaries, and request coordination in component effects.

For client-side fetching, define explicitly:

- cache key
- stale policy
- retry policy
- cancellation behavior
- loading/error state
- mutation invalidation

Prevent request waterfalls when independent data can be fetched concurrently.

## Async UI

Every asynchronous interaction should define:

- pending state
- success state
- recoverable error state
- disabled/repeated-action behavior
- stale-response handling where races are possible

For mutations, consider idempotency and double submission.

## Accessibility

Prefer semantic HTML before ARIA.

Verify:

- controls are keyboard reachable
- labels are associated with inputs
- focus remains understandable after dialogs/navigation
- status/error messages are perceivable
- interactive elements use the correct native element
- visual-only state is not the only communication channel

## Error Boundaries and Failure Isolation

Place failure boundaries around independently recoverable areas when supported by the application architecture.

Do not convert every error into a silent fallback. Preserve enough diagnostic context for monitoring and debugging.

## Forms

Keep validation rules consistent across client and server.

Client validation improves feedback; server validation remains authoritative.

For complex forms, avoid storing redundant copies of field state in multiple layers.

## Review Checklist

Before approving a React change, check:

- state has a single clear owner
- derived values are not unnecessarily stored
- effects synchronize with external systems rather than replace normal logic
- list keys are stable
- async states and races are handled
- accessibility is preserved
- profiling supports non-trivial performance optimizations
- error/loading/empty states exist where relevant
- tests cover user-visible behavior, not only implementation details

## Completion Evidence

For performance claims, provide profiler or benchmark evidence.

For correctness claims, run focused tests or reproduce the relevant interaction.

Do not claim that a React change is faster solely because memoization was added.
