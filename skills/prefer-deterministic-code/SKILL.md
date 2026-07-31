---
name: prefer-deterministic-code
description: Prefer deterministic computation, repository inspection, parsers, tests, and direct tool results over model inference whenever the answer can be derived mechanically. Use for calculations, transformations, validation, extraction, codebase facts, and repeatable automation where an LLM call would add cost or variance without adding judgment.
metadata:
  origin: local
---

# Prefer Deterministic Code

## Objective

Minimize unnecessary model reasoning by routing work to the cheapest reliable mechanism that can produce a verifiable answer.

The governing principle is:

> Do not ask a model to infer what a deterministic tool can compute, parse, query, validate, or transform exactly.

This skill does not prohibit model use. It reserves model reasoning for ambiguity, synthesis, judgment, explanation, design, and cases where deterministic methods are unavailable or demonstrably insufficient.

## When to Use

Apply this skill automatically when a task includes one or more of the following:

- arithmetic, date math, unit conversion, sorting, filtering, deduplication, aggregation, or formatting;
- parsing structured data such as JSON, YAML, TOML, CSV, XML, logs, manifests, lockfiles, or ASTs;
- answering factual questions about a repository that can be established by reading files, Git metadata, tests, build output, or static analysis;
- transforming text or code according to explicit mechanical rules;
- checking syntax, types, schemas, invariants, hashes, signatures, checksums, constraints, or test expectations;
- generating repeatable artifacts from known inputs;
- deciding whether an external model call is necessary inside an agent workflow;
- replacing fragile prompt-based extraction with code or a parser.

Do not force deterministic handling for tasks whose core value is semantic judgment, creative generation, interpretation, prioritization, or synthesis across incomplete evidence.

## Execution Policy

Before using model inference for any subtask, classify the subtask into one of four routes.

| Route | Use when | Preferred mechanism |
| --- | --- | --- |
| D0: Direct fact | The answer is already present in trusted tool output or a file | Return or quote the source directly |
| D1: Mechanical derivation | The answer follows from explicit rules or structured inputs | Calculator, script, parser, query, compiler, test, linter, AST, schema validator |
| D2: Bounded heuristic | A deterministic approximation is acceptable and its limits are explicit | Regex, scoring rule, threshold, static heuristic |
| M: Model judgment | Meaning, ambiguity, synthesis, explanation, design, or uncertain intent is central | Model reasoning, grounded in evidence |

Use the lowest route that can satisfy the required correctness.

## Deterministic-First Procedure

### 1. Define the required output

State internally:

- what must be produced;
- what correctness means;
- which inputs are authoritative;
- whether the result must be exact, reproducible, explainable, or merely useful.

Do not begin with a model-generated guess and then search for support.

### 2. Identify deterministic operations

Look for operations that can be expressed as:

- a direct file or database lookup;
- a shell command or repository query;
- a pure function;
- a parser or serializer;
- a compiler, type checker, linter, test runner, or schema validator;
- a deterministic API endpoint;
- a stable transformation pipeline;
- a finite search over known candidates.

Prefer existing project scripts and native tooling before creating new dependencies.

### 3. Execute and capture evidence

Run the deterministic operation and preserve enough evidence to reproduce the result:

- command or function used;
- input scope;
- relevant output;
- exit status or validation result;
- assumptions and exclusions.

For repository claims, inspect the repository rather than relying on remembered conventions.

### 4. Validate the result

Use at least one appropriate check for non-trivial outputs:

- round-trip parse/serialize;
- independent recalculation;
- invariant assertion;
- test case;
- schema validation;
- checksum or count comparison;
- compiler or type-checker confirmation;
- comparison against a trusted source.

### 5. Escalate only when necessary

Escalate from deterministic execution to model reasoning only when one of these conditions holds:

- the deterministic method fails or cannot access required data;
- multiple valid interpretations remain;
- the task requires trade-offs or subjective judgment;
- the result needs explanation or synthesis beyond the raw computation;
- the deterministic approximation has unacceptable error risk;
- building the deterministic method would cost more than the task justifies.

When escalating, pass the deterministic evidence to the model. Do not ask the model to recompute what has already been established.

## Decision Test

Before any model-heavy step, ask:

1. Can the answer be read directly from a trusted source?
2. Can it be computed with a pure function or standard tool?
3. Can a parser, query, test, compiler, or validator settle it?
4. Can the candidate space be enumerated and checked?
5. Would repeated runs with identical inputs be expected to return exactly the same result?

If any answer is yes, attempt that route first.

## Cost and Complexity Guard

Deterministic-first does not mean overengineering.

Use this rule:

```text
Build deterministic machinery when:
expected reuse × avoided model cost and variance > implementation and maintenance cost
```

For one-off trivial tasks, a built-in calculator or short script is sufficient. Do not create a framework to avoid a single inexpensive inference.

## Failure and Fallback Rules

- Never silently replace a failed deterministic method with a model guess.
- Report the failure boundary and the fallback used.
- Distinguish verified facts from inferred conclusions.
- If a heuristic is used, name the heuristic and its known false-positive or false-negative risks.
- Do not use regex for structured languages when a maintained parser is available.
- Do not introduce a network dependency when local authoritative data exists.
- Do not install packages silently.
- Do not treat generated output as verified until a deterministic check passes.

## Common Patterns

### Repository question

Bad:

```text
Infer the framework from naming conventions.
```

Preferred:

```text
Inspect package manifests, imports, build configuration, and lockfiles; then summarize the evidence.
```

### Data extraction

Bad:

```text
Ask a model to extract fields from valid JSON.
```

Preferred:

```text
Parse JSON and select fields programmatically. Use a model only for interpreting free-text fields.
```

### Code transformation

Bad:

```text
Prompt a model to rename every symbol across a large codebase.
```

Preferred:

```text
Use language-server rename, AST codemod, or compiler-assisted refactoring; then use the model to review intent and edge cases.
```

### Validation

Bad:

```text
Ask whether code appears type-safe.
```

Preferred:

```text
Run the type checker and tests. Use the model to explain failures or propose fixes.
```

### Repeated classification

If classification criteria are explicit and stable, encode them as rules with test fixtures. If categories depend on context, nuance, or evolving language, retain model judgment and add evaluation examples.

## Output Contract

For substantial tasks, report the execution route concisely:

```text
Route: D1 — deterministic derivation
Mechanism: <tool, script, parser, query, or test>
Evidence: <key result>
Validation: <check performed>
Model use: <none, explanation only, or fallback reason>
```

Do not add this report when it would clutter a simple answer.

## Integration

Use together with:

- `token-budget-discipline` to avoid spending budget on mechanically solvable work;
- `project-orchestrator` to inspect only relevant repository surfaces;
- `verification-loop` to validate generated changes;
- `context-budget` to audit static context overhead;
- `content-hash-cache-pattern` to cache expensive deterministic processing.

## Anti-Patterns

- Using an LLM as a calculator, parser, database, grep replacement, or schema validator.
- Asking a model to predict test or compiler output instead of running it.
- Repeating model calls until one answer looks plausible.
- Converting a clear rule into a probabilistic prompt.
- Building complex deterministic infrastructure for a one-off low-risk task.
- Treating deterministic output as semantically sufficient when human or model judgment is actually required.
