# yus for Hermes

This directory contains the yus configuration for the Hermes harness.

## What is installed

- `rules/yus/` — shared coding rules and guidelines
- `skills/yus/` — reusable skills
- `commands/` — slash commands
- `AGENTS.md` — agent instructions

## Manual install

```bash
bash ./install.sh --target hermes --profile minimal
```

## Notes

- Hermes config files (`config.yaml`, `.env`, etc.) are **not** touched by yus install.
- Use `npx yus-universal doctor --target hermes` to check install health.
