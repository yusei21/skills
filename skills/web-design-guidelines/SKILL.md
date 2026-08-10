---
name: web-design-guidelines
description: Review and improve web interfaces for visual hierarchy, responsive layout, accessibility, interaction clarity, content density, consistency, and implementation-ready design quality.
metadata:
  origin: original
  references:
    - vercel-labs/agent-skills
---

# Web Design Guidelines

Use this skill when designing or reviewing web interfaces, dashboards, landing pages, application screens, design-system components, or responsive layouts.

## Objective

Produce interfaces that are clear before they are decorative.

Prioritize in this order:

1. task clarity
2. information hierarchy
3. accessibility
4. interaction predictability
5. responsive behavior
6. visual consistency
7. polish

## Start With the User Task

For each screen identify:

- primary user goal
- primary action
- supporting information
- secondary actions
- destructive or irreversible actions
- likely error/empty/loading states

If every element appears equally important, the hierarchy is failing.

## Visual Hierarchy

Use size, weight, spacing, grouping, and contrast to communicate structure.

A page should usually make these relationships obvious without reading every word:

```text
Page purpose
  -> current section
     -> primary content
        -> supporting details
           -> secondary metadata
```

Avoid solving hierarchy only by adding more colors.

## Spacing

Use a consistent spacing system rather than arbitrary values.

Think in relationships:

- tighter spacing inside a component
- larger spacing between component groups
- largest spacing between page sections

Inconsistent spacing makes related content look unrelated and unrelated content look grouped.

## Typography

Keep the number of text roles small and intentional.

Typical roles:

- display/page title
- section heading
- body
- label
- metadata/caption
- code/monospace where necessary

Use line length and line height for readability. Avoid long dense paragraphs inside narrow application layouts.

## Color and Contrast

Color should reinforce meaning, not carry meaning alone.

Check:

- text contrast
- interactive-state contrast
- disabled-state legibility
- error/success/warning meaning beyond color
- dark-mode behavior when supported

Reserve strong accent colors for actions and information that deserve attention.

## Interaction Design

Interactive controls should look interactive and behave consistently.

Verify:

- buttons have clear labels
- links are distinguishable
- hover is not the only state indicator
- keyboard focus is visible
- destructive actions are visually and behaviorally distinct
- disabled controls communicate why when the reason is not obvious

Avoid hiding essential actions behind hover-only UI on touch-capable layouts.

## Forms

Forms should minimize interpretation cost.

Prefer:

- persistent labels
- useful defaults
- examples only when necessary
- inline validation near the field
- actionable error messages
- grouping by user intent

Do not use placeholder text as the only field label.

For long forms, consider progressive disclosure or logical sections instead of a single uninterrupted stack.

## Responsive Layout

Responsive design is not just shrinking desktop UI.

At each breakpoint decide explicitly:

- what remains visible
- what stacks
- what changes order
- what becomes scrollable
- what may collapse behind a deliberate control
- which interaction changes for touch

Avoid horizontal overflow except for content where horizontal navigation is intrinsic, such as wide data tables or timelines.

## Data-Dense Interfaces

For dashboards and admin tools:

- align comparable values
- reduce decorative noise
- keep filters close to the data they affect
- distinguish status from action
- preserve scanability
- provide empty, loading, partial, and error states

For tables, prioritize meaningful columns rather than trying to display every available field.

## Navigation

Navigation should answer:

- Where am I?
- What can I do here?
- How do I go back or move elsewhere?

Use consistent active states and labels.

Do not mix different navigation models without a clear reason.

## Accessibility Baseline

Review at minimum:

- semantic landmarks
- heading order
- keyboard navigation
- visible focus
- form labels
- alternative text where meaningful
- accessible names for icon-only controls
- target sizes suitable for touch
- motion reduction when animation is non-essential

Semantic HTML is preferred over reproducing native behavior with generic elements.

## Loading, Empty, and Error States

Every data-driven surface should define:

### Loading

Communicate that work is in progress without causing unnecessary layout shift.

### Empty

Explain why there is no content and offer the next useful action when appropriate.

### Error

State what failed, what the user can do, and whether retrying is safe.

Do not replace all errors with generic "Something went wrong" messages when more useful guidance is available.

## Motion

Animation should explain change, preserve spatial context, or provide feedback.

Avoid motion that:

- delays task completion
- runs continuously without purpose
- causes large layout movement
- conflicts with reduced-motion preferences

## Review Process

For a design review, inspect in this order:

1. purpose and primary action
2. hierarchy
3. responsive behavior
4. interaction states
5. accessibility
6. consistency with the design system
7. visual polish

This prevents spending time polishing a fundamentally confusing layout.

## Output Format for Reviews

When asked to review an interface, report findings by severity:

```text
Critical
- blocks task completion or accessibility

High
- likely causes user error or major confusion

Medium
- weak hierarchy, inconsistency, or responsive issue

Low
- polish opportunity
```

For each finding include:

- location
- problem
- impact
- recommended change

Prefer concrete implementation guidance over aesthetic adjectives.
