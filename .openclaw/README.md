# yus for OpenClaw

This directory contains the yus configuration for the OpenClaw harness.

## What is installed

- `rules/yus/` — shared coding rules and guidelines
- `skills/yus/` — reusable skills
- `commands/` — slash commands
- `AGENTS.md` — agent instructions

## Manual install

```bash
bash ./install.sh --target openclaw --profile minimal
```

## Notes

- OpenClaw config files (`openclaw.json`, `config.toml`, `.env`, etc.) are **not** touched by yus install.
- Use `npx yus-universal doctor --target openclaw` to check install health.
