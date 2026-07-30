# ECC for Antigravity CLI (`agy`)

> **Antigravity CLI** is Google's successor to the Gemini CLI. Google stopped
> serving the `gemini` CLI for individual accounts on **2026-06-18**; the
> replacement is the `agy` command (a closed-source Go binary announced at
> Google I/O 2026). `agy` still reads its configuration from `~/.gemini/`, but
> with a new sub-structure:
>
> - **General config / instructions:** `~/.gemini/antigravity-cli/`
> - **Centralized MCP config:** `~/.gemini/config/mcp_config.json`
>   (replaces the old `~/.gemini/settings.json`)
>
> Legacy Gemini CLI plugins can be migrated with `agy plugin import gemini`.

This file provides Antigravity CLI (`agy`) with the baseline ECC workflow,
review standards, and security checks for repositories that install the
Antigravity target.

## Overview

Everything Claude Code (ECC) is a cross-harness coding system with specialized
agents, skills, and commands. On Antigravity, support is focused on a strong
project-local instruction layer (this file), plus the shared MCP catalog in
`.gemini/config/mcp_config.json` and the package-manager setup assets.

## Core Workflow

1. Plan before editing large features.
2. Prefer test-first changes for bug fixes and new functionality.
3. Review for security before shipping.
4. Keep changes self-contained, readable, and easy to revert.

## Coding Standards

- Prefer immutable updates over in-place mutation.
- Keep functions small and files focused.
- Validate user input at boundaries.
- Never hardcode secrets.
- Fail loudly with clear error messages instead of silently swallowing problems.

## Security Checklist

Before any commit:

- No hardcoded API keys, passwords, or tokens
- All external input validated
- Parameterized queries for database writes
- Sanitized HTML output where applicable
- Authz/authn checked for sensitive paths
- Error messages scrubbed of sensitive internals

## Delivery Standards

- Use conventional commits: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`
- Run targeted verification for touched areas before shipping
- Prefer contained local implementations over adding new third-party runtime dependencies

## ECC Areas To Reuse

- `AGENTS.md` for repo-wide operating rules
- `skills/` for deep workflow guidance
- `commands/` for slash-command patterns worth adapting into prompts/macros
- `.gemini/config/mcp_config.json` for shared connector baselines (agy MCP config)
