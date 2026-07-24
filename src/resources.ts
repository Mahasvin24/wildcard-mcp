/**
 * MCP RESOURCES — read-only data the client can pull in by URI.
 *
 * Tools are actions the model *calls*; resources are documents the client can
 * *read* (like files). We expose the raw catalog and tracked-prompt list as
 * JSON resources so a client can load the full dataset as context without a
 * tool call. Registered via:
 *   server.registerResource(name, uri, config, readCallback)
 * The readCallback returns { contents: [{ uri, mimeType, text }] }.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { catalog } from "./data/catalog.js";
import { trackedPrompts } from "./data/prompts-data.js";

export function registerResources(server: McpServer): void {
  server.registerResource(
    "dosaze-catalog",
    "wildcard://brand/dosaze/catalog",
    {
      title: "Dosaze product catalog",
      description: "The client's full product catalog with attributes (JSON).",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(catalog, null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "dosaze-prompts",
    "wildcard://brand/dosaze/prompts",
    {
      title: "Dosaze tracked prompts",
      description: "All tracked buyer questions with volume and rankings (JSON).",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(trackedPrompts, null, 2),
        },
      ],
    }),
  );
}
