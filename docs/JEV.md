# Jev AI — usage guide

**English** | [Português](./JEV.pt-BR.md) | [简体中文](./JEV.zh-CN.md)

The canonical [`jev-agent`](../skills/jev-agent/SKILL.md) skill provides original project-local guidance for the Jev AI typed-decision API. Upstream reference: https://github.com/jev-ai/jev-agent-skill. Upstream source files are not redistributed.

## Setup

Start your coding agent from this repository's root. Generate an API key at https://thejevai.com/settings/apikeys and configure it in your local execution environment:

```bash
export JEV_API_KEY="sk_your_key_here"
export JEV_LANGUAGE="en-US"
```

Upstream documents `en-US` and `zh-CN`. Optional defaults: `JEV_API_BASE_URL=https://thejevai.com` and `JEV_MODEL=typesafe/jev-1.13`. Never commit, log, or paste your real key into a conversation.

## Agent prompt

```text
Use jev-agent to classify this support ticket as billing, technical, or
sales. Return the choice and confidence, but take no action.
Ticket: "I was billed twice."
```

Use `choice` to choose from known categories, `score` for an ordered rubric, and `noul` for a yes/no probability. The [skill definition](../skills/jev-agent/SKILL.md) includes a request example.

The request can consume credits and send data to an external service. Minimize transmitted data, obtain required approval, check API failures, and retain deterministic permissions and human review. Live operation requires an API key and API access. API docs: https://thejevai.com/docs.
