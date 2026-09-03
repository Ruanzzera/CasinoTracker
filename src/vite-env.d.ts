/// <reference types="vite/client" />

// MCP tool handlers run in Deno at runtime; declare `process.env` so the
// shared TS build accepts the standard SDK pattern.
declare const process: { env: Record<string, string | undefined> };
