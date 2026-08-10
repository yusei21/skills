---
name: composition-patterns
description: Design reusable component APIs with composition, slots, controlled and uncontrolled state, context boundaries, compound components, and explicit extension points instead of brittle prop explosions.
metadata:
  origin: original
  references:
    - vercel-labs/agent-skills
---

# Component Composition Patterns

Use this skill when a UI component is becoming difficult to extend, has too many boolean props, or must support multiple layouts and interaction modes without duplicating implementation.

## Goal

Prefer small explicit extension points over components that try to predict every future use case.

A good component API communicates:

- what the component owns
- what callers may customize
- which state can be controlled externally
- which subparts are replaceable
- which invariants must remain internal

## Detect Prop Explosion

A component is often over-configured when it accumulates many related flags:

```tsx
<Card
  compact
  horizontal
  showImage
  showActions
  imageLeft
  bordered
  clickable
/>
```

When flags interact combinatorially, move toward composition.

## Prefer Children for Structure

When callers need to control structure, expose content boundaries instead of adding formatting flags.

```tsx
<Card>
  <Card.Header>...</Card.Header>
  <Card.Body>...</Card.Body>
  <Card.Actions>...</Card.Actions>
</Card>
```

This is usually easier to extend than one component with many conditional branches.

## Slots

Use named slots when the parent must preserve layout while callers supply specific content.

```tsx
<PageHeader
  title="Projects"
  leading={<BackButton />}
  actions={<CreateProjectButton />}
/>
```

Slots are useful when structure is fixed but content varies.

Do not create a slot for every DOM node; expose only meaningful extension points.

## Compound Components

Compound components are useful when several pieces share state and semantics but callers need control over arrangement.

Examples:

- tabs
- accordions
- menus
- command palettes
- form field groups

A compound API can combine context with subcomponents:

```tsx
<Tabs value={tab} onValueChange={setTab}>
  <Tabs.List>
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">...</Tabs.Content>
</Tabs>
```

Keep the shared context private to the component family unless external access is explicitly part of the contract.

## Controlled and Uncontrolled State

For reusable interactive components, decide whether state is:

- internally owned
- externally controlled
- optionally controlled

An optionally controlled API commonly provides both:

```text
value / onValueChange
defaultValue
```

Document precedence and do not switch unpredictably between controlled and uncontrolled modes at runtime.

## Render Props and Function Children

Use function children when the caller needs access to internal state to render custom output.

```tsx
<Upload>
  {({ progress, cancel }) => (
    <UploadProgress progress={progress} onCancel={cancel} />
  )}
</Upload>
```

Prefer simpler children/slots when no state needs to be exposed.

## Headless Components

Separate behavior from presentation when the same interaction model must support different designs.

A headless component or hook may own:

- state machine
- keyboard behavior
- ARIA relationships
- focus management
- event coordination

while callers own markup and styling.

Headless APIs should still protect accessibility invariants.

## Context Boundaries

Use context to coordinate a component family, not as a substitute for ordinary props across the entire application.

Keep context values minimal and stable.

Large frequently changing context objects can cause unrelated descendants to update together.

## Polymorphism

Allow changing the rendered element only when there is a real design-system need.

If supporting `as` or `asChild` patterns, preserve:

- ref forwarding
- event composition
- accessibility semantics
- type safety

Do not let polymorphism turn invalid semantics into an easy default.

## Separate Policy From Presentation

If a component contains business rules such as permissions, entitlement checks, or workflow decisions, consider moving those rules outside the reusable presentation component.

Prefer:

```text
feature policy -> decides what is allowed
component      -> renders the allowed state
```

This keeps component APIs reusable and testable.

## Review Checklist

When reviewing a component API, ask:

- Are boolean props creating combinatorial states?
- Could children or slots express structure more naturally?
- Is shared state scoped to the smallest component family?
- Is controlled state behavior explicit?
- Are accessibility invariants preserved across customization?
- Can callers extend the component without forking it?
- Is business policy leaking into generic presentation code?
- Are extension points stable enough to become public API?

## Migration Strategy

When replacing a prop-heavy API:

1. identify existing usage patterns
2. define the smallest compositional primitives
3. preserve old behavior temporarily if compatibility matters
4. migrate representative call sites
5. remove obsolete flags only after adoption is proven

Do not introduce a new abstraction without testing it against real call sites.
