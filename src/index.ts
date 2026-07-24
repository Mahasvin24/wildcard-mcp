#!/usr/bin/env node
/**
 * Wildcard MCP server — entry point.
 *
 * WHAT THIS FILE DOES (the MCP lifecycle in one place):
 *   1. Create an McpServer — the high-level object that holds our tools,
 *      resources, and prompts and speaks the MCP wire protocol for us.
 *   2. Register capabilities (the four phases + resources + the audit prompt).
 *   3. Connect a StdioServerTransport — MCP over stdin/stdout. This is exactly
 *      what Claude Desktop uses: it launches this file as a subprocess and talks
 *      to it over the process's stdio. No network, no ports.
 *
 * IMPORTANT: because stdout is the protocol channel, we must never print
 * anything to stdout ourselves — all logging goes to stderr (console.error).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTrackTools } from "./tools/track.js";
import { registerActTools } from "./tools/act.js";
import { registerPublishTools } from "./tools/publish.js";
import { registerMeasureTools } from "./tools/measure.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";

async function main(): Promise<void> {
  const server = new McpServer({
    name: "wildcard-mcp",
    version: "0.1.0",
  });

  // Each phase of Wildcard's loop is a group of tools. Reading this list is
  // itself the pitch: the founder sees their product's loop exposed to agents.
  registerTrackTools(server); //   TRACK   — where do we show up?
  registerActTools(server); //     ACT     — what's the fix, and make it
  registerPublishTools(server); // PUBLISH — brief the content to close the gap
  registerMeasureTools(server); // MEASURE — what was it worth?

  registerResources(server); //    read-only catalog + prompt data
  registerPrompts(server); //      one-click full_audit template

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // stderr is safe to log to; stdout is reserved for the MCP protocol.
  console.error("wildcard-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting wildcard-mcp:", err);
  process.exit(1);
});
