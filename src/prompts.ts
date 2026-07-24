/**
 * MCP PROMPTS — reusable, parameterized message templates the user can trigger
 * from the client UI (in Claude Desktop they appear in the "+" / slash menu).
 *
 * This is the demo's one-click on-ramp: `full_audit` drops in a single message
 * that tells the model to run the entire Track -> Act -> Publish -> Measure loop
 * using this server's tools, so the founder doesn't have to type a paragraph.
 *
 * Registered via server.registerPrompt(name, { title, description, argsSchema }, cb).
 * The cb returns { messages: [...] } — the messages seeded into the conversation.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "full_audit",
    {
      title: "Run a full AI-shopping audit (Track → Act → Publish → Measure)",
      description:
        "One-click: audit the brand's AI shopping visibility, fix the highest-impact gap, draft the content to close it, and report the revenue impact.",
      argsSchema: {
        brand: z
          .string()
          .optional()
          .describe("Brand to audit. Defaults to Dosaze."),
      },
    },
    ({ brand }) => {
      const b = brand?.trim() || "Dosaze";
      const text = [
        `You have access to the Wildcard MCP server, which exposes an ecommerce brand's AI-shopping-visibility data and workflow as tools. Our brand is ${b}.`,
        ``,
        `Run the full loop and narrate each step as you go:`,
        `1. TRACK — Use compare_competitors and list_tracked_prompts to summarize where ${b} stands in AI shopping answers and where the biggest gaps are.`,
        `2. ACT — Call list_opportunities to find the single highest-impact fix. Explain the root cause, then call enrich_product to actually make the fix.`,
        `3. Re-run list_opportunities to confirm the gap closed.`,
        `4. PUBLISH — Call draft_content for the top opportunity, then WRITE the actual content from the brief it returns.`,
        `5. MEASURE — Call get_revenue_attribution to show what AI-surface visibility is currently worth, and get_visibility_trend to show momentum.`,
        ``,
        `Finish with a short recommendation of what to do next.`,
      ].join("\n");

      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text },
          },
        ],
      };
    },
  );
}
