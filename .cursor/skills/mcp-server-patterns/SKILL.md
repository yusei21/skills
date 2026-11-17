---
name: mcp-server-patterns
description: Build MCP servers with Node/TypeScript SDK — tools, resources, prompts, Zod validation, stdio vs Streamable HTTP. Use Context7 or official MCP docs for latest API.
origin: yus
---

# MCP Server Patterns

The Model Context Protocol (MCP) lets AI assistants call tools, read resources, and use prompts from your server. Use this skill when building or maintaining MCP servers. The SDK API evolves; check Context7 (query-docs for "MCP") or the official MCP documentation for current method names and signatures.

## When to Use

Use when: implementing a new MCP server, adding tools or resources, choosing stdio vs HTTP, upgrading the SDK, or debugging MCP registration and transport issues.

## How It Works

### Core concepts

- **Tools**: Actions the model can invoke (e.g. search, run a command). Register with `registerTool()`.
- **Resources**: Read-only data the model can fetch (e.g. file contents, API responses). Register with `registerResource()`; handlers receive the resolved `uri`.
- **Prompts**: Reusable, parameterised prompt templates the client can surface (e.g. in Claude Desktop). Register with `registerPrompt()`.
- **Transport**: stdio for local clients (e.g. Claude Desktop); Streamable HTTP is preferred for remote (Cursor, cloud). Legacy HTTP/SSE is for backward compatibility.

In `@modelcontextprotocol/sdk` 1.x the `register*` methods are current; the older positional `tool()`, `resource()` and `prompt()` are deprecated. Check the [MCP docs](https://modelcontextprotocol.io) or Context7 when you pin a different major.

### Connecting with stdio

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

await server.connect(new StdioServerTransport());
```

A stdio server owns stdout for protocol messages: log to stderr (`console.error`), never `console.log`.

Keep server logic (tools + resources) independent of transport so you can plug in stdio or HTTP in the entrypoint.

### Remote (Streamable HTTP)

For Cursor, cloud, or other remote clients, use **Streamable HTTP** (single MCP HTTP endpoint per current spec) through `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk/server/streamableHttp.js`. The SSE transport is deprecated; support it only for old clients.

## Examples

### Install and server setup

```bash
npm install @modelcontextprotocol/sdk zod
```

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({ name: "my-server", version: "1.0.0" });
```

### Register a tool and a resource

```typescript
server.registerTool(
  "search_issues",
  {
    title: "Search issues",
    description: "Search open issues by text. Returns at most `limit` results.",
    inputSchema: { query: z.string().min(1), limit: z.number().int().max(50).default(10) },
  },
  async ({ query, limit }) => {
    const issues = await searchIssues(query, limit);
    return { content: [{ type: "text", text: JSON.stringify(issues) }] };
  },
);

server.registerResource(
  "config",
  "config://app",
  { title: "App config", mimeType: "application/json" },
  async (uri) => ({ contents: [{ uri: uri.href, text: JSON.stringify(await loadConfig()) }] }),
);
```

`inputSchema` is a shape of Zod fields, not a `z.object()`. Report a failure the model should see with `{ isError: true, content: [...] }` instead of throwing.

## Best Practices

- **Schema first**: Define input schemas for every tool; document parameters and return shape.
- **Errors**: Return structured errors or messages the model can interpret; avoid raw stack traces.
- **Idempotency**: Prefer idempotent tools where possible so retries are safe.
- **Rate and cost**: For tools that call external APIs, consider rate limits and cost; document in the tool description.
- **Versioning**: Pin SDK version in package.json; check release notes when upgrading.

## Official SDKs and Docs

- **JavaScript/TypeScript**: `@modelcontextprotocol/sdk` (npm). Use Context7 with library name "MCP" for current registration and transport patterns.
- **Go**: Official Go SDK on GitHub (`modelcontextprotocol/go-sdk`).
- **C#**: Official C# SDK for .NET.
