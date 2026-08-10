---
name: mcp-builder
description: Design, implement, test, and review Model Context Protocol servers with clear tool/resource boundaries, typed schemas, least-privilege access, safe transports, and host integration. Use when building a new MCP server, exposing an API or local capability through MCP, reviewing an existing server, or deciding how capabilities should be modeled.
metadata:
  origin: original
---

# MCP Builder

Build Model Context Protocol servers as stable interfaces for agents rather than thin wrappers around arbitrary code.

## When to activate

Use this skill when the task involves:

- creating a new MCP server;
- exposing local files, databases, APIs, or services to an AI host;
- deciding whether a capability belongs in a tool, resource, or prompt;
- adding an MCP integration to Claude Code, Codex, another MCP host, or a custom agent runtime;
- reviewing MCP schemas, authorization, transport, error handling, or security;
- migrating an ad-hoc tool integration to a reusable MCP interface.

## Core principles

1. **Design the model-facing contract first.** A good MCP interface is optimized for reliable agent use, not for mirroring every internal function.
2. **Expose the smallest useful capability surface.** Fewer, well-scoped capabilities are easier to understand, authorize, test, and audit.
3. **Prefer deterministic structured outputs.** Return stable fields and explicit states instead of prose when downstream automation depends on the result.
4. **Keep destructive actions explicit.** Separate read operations from writes and make irreversible actions easy to recognize.
5. **Treat all model-provided arguments as untrusted input.** Validate types, ranges, paths, identifiers, URLs, and authorization before execution.
6. **Do not expose secrets through resources, errors, logs, or tool results.**
7. **Keep the MCP layer thin.** Business logic should live in reusable services where possible; the MCP server adapts those services to the protocol.

## Capability modeling

### Tools

Use tools for operations that perform an action, query a system dynamically, or may have side effects.

Good examples:

- `search_issues(query, state)`
- `run_tests(target)`
- `create_note(path, content)`
- `deploy_preview(ref)`

Avoid vague catch-all tools such as:

- `execute(command)`
- `do_action(payload)`
- `request(url, body)`

unless the server is intentionally a low-level infrastructure interface and its permissions are tightly constrained.

A tool should have:

- a verb-oriented name;
- one clear responsibility;
- a narrow input schema;
- documented side effects;
- predictable errors;
- structured output when practical.

### Resources

Use resources for addressable context that clients can read without modeling the read as an action.

Examples:

- project documentation;
- configuration snapshots;
- knowledge-base entries;
- repository metadata;
- generated reports;
- read-only file or record views.

Use stable URIs and prevent path traversal or unauthorized cross-tenant access.

### Prompts

Use prompts for reusable, intentionally exposed interaction templates when the host benefits from discovering a guided workflow. Do not move ordinary server logic into prompts.

## Build workflow

### 1. Define the user outcome

Write down:

- who will use the server;
- which host or clients must work with it;
- which systems it can access;
- which operations are read-only;
- which operations change state;
- what authentication or local trust boundary exists;
- what must never be exposed.

Do not start by generating dozens of tools from an API specification.

### 2. Create a capability map

For each desired capability, classify it:

```text
Capability
├── read/addressable context -> resource
├── action/query with arguments -> tool
├── reusable guided interaction -> prompt
└── internal implementation detail -> do not expose
```

Merge capabilities that are semantically identical, but do not combine unrelated operations just to reduce tool count.

### 3. Design schemas

For every tool:

- make required and optional fields explicit;
- use enums for small closed sets;
- constrain numeric ranges and string lengths where appropriate;
- avoid deeply nested generic objects;
- distinguish IDs from human-readable names;
- use clear defaults only when they are safe and unsurprising;
- make pagination explicit for potentially large results.

Bad:

```json
{"data": {"anything": "goes"}}
```

Better:

```json
{
  "repository": "owner/name",
  "query": "authentication failure",
  "limit": 20
}
```

### 4. Implement behind a service boundary

Prefer:

```text
MCP handler
   -> validation / authorization
   -> application service
   -> filesystem / API / database
```

over embedding all behavior directly inside protocol handlers.

This lets the same logic be reused by a CLI, tests, HTTP API, or another integration.

### 5. Choose transport intentionally

For a local tool launched by a desktop or coding host, prefer a process-local transport such as stdio when supported by the selected SDK and host.

For a remote service, use the current remote transport supported by the SDK and client ecosystem and add explicit authentication, origin/network controls, TLS, request limits, and observability.

Do not assume a transport is safe merely because it is supported by MCP.

### 6. Add security boundaries

Review each server for:

#### Filesystem

- resolve requested paths against an allowed root;
- reject `..` escapes and unsafe symlink traversal;
- avoid arbitrary filesystem access unless that is explicitly the product;
- separate read and write roots when appropriate.

#### Network

- allowlist destinations for tools that call external services where practical;
- protect against SSRF when URLs or hosts can be influenced by the model;
- set timeouts and response-size limits;
- never forward ambient credentials to arbitrary destinations.

#### Credentials

- load secrets from environment variables or a secret manager;
- redact tokens and authorization headers in logs;
- never return secrets in tool output;
- use the narrowest service account or token scope possible.

#### Mutations

- make destructive operations separately named;
- require all identifiers needed to identify the target precisely;
- expose a dry-run or preview mode when useful;
- make idempotency explicit for operations that may be retried.

#### Multi-tenant data

- authorize every resource and operation against the active identity;
- do not trust tenant IDs supplied by the model without server-side verification.

### 7. Define errors for agents

Errors should tell the client what can be corrected without leaking internals.

Prefer categories such as:

```text
invalid_input
not_found
permission_denied
conflict
rate_limited
upstream_unavailable
internal_error
```

Include a concise remediation hint when useful. Do not dump stack traces, environment variables, SQL, tokens, or raw upstream error bodies by default.

## Testing strategy

Test the protocol boundary and the underlying service independently.

Minimum coverage:

- server startup and capability discovery;
- valid calls for every tool;
- invalid input and missing required fields;
- unauthorized access;
- filesystem boundary attempts if applicable;
- upstream timeout/failure behavior;
- large or paginated responses;
- destructive-operation safeguards;
- concurrent or repeated calls where relevant;
- clean shutdown.

For each high-risk tool, include at least one test proving the expected denial path.

## Host integration checklist

Before declaring the server ready:

- [ ] the host can start/connect to the server;
- [ ] advertised names and descriptions are understandable without repository context;
- [ ] schemas display correctly in the host;
- [ ] required environment variables are documented without including secret values;
- [ ] working directory assumptions are explicit;
- [ ] the server does not write protocol-breaking output to stdout when using stdio;
- [ ] logs go to an appropriate channel;
- [ ] failure to connect produces an actionable diagnostic;
- [ ] only necessary capabilities are enabled.

## Review existing servers

When reviewing an MCP server, produce findings in this order:

1. **Critical security issues** — credential exposure, arbitrary command execution, unrestricted filesystem/network access, authorization bypass.
2. **Contract problems** — ambiguous tools, unsafe defaults, unbounded results, unstable outputs.
3. **Reliability issues** — missing timeouts, retries without idempotency, weak error handling, blocking operations.
4. **Agent usability issues** — unclear descriptions, overlapping tools, excessive capability count, poor schemas.
5. **Maintainability issues** — protocol handlers containing business logic, duplicated adapters, missing tests.

## Deliverable

For a new server, provide:

```text
MCP Server Plan
- user outcome
- target hosts
- capability map
- tools
- resources
- prompts (if any)
- authentication/trust boundary
- transport
- security controls
- implementation structure
- test plan
- host configuration example
```

For a review, provide severity-ranked findings with the exact capability or code path affected and a concrete remediation.
