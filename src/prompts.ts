/**
 * MCP PROMPTS — reusable, parameterized message templates the user can trigger
 * from the client UI (in Claude Desktop they appear in the "+" / slash menu).
 *
 * Registered via server.registerPrompt(name, { title, description, argsSchema }, cb).
 * The cb returns { messages: [...] } — the messages seeded into the conversation.
 *
 * DESIGN: `full_audit` drives a deliberate TWO-BEAT flow:
 *
 *   Beat 1 (automatic, READ-ONLY) — the agent runs the entire diagnostic in one
 *   pass with clear section headers, then stops at a "Proposed Action" block
 *   (Problem / Solution / Changes / Expected impact) and asks permission.
 *
 *   Beat 2 (only after the user confirms) — the agent performs the writes,
 *   drafts the content, and gives a short recap.
 *
 * This mirrors how Wildcard's real product works (operators review and approve
 * work before it ships) and it makes the demo safe to run live: nothing mutates
 * until the founder says go.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "full_audit",
    {
      title: "Run a full AI-shopping audit (diagnose → propose → approve → fix)",
      description:
        "One click: runs the complete read-only audit of the brand's AI shopping visibility with clear section headers, then proposes a fix and waits for your approval before changing anything.",
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
        `You have access to the Wildcard MCP server, which exposes an ecommerce brand's AI-shopping-visibility data and workflow as tools. Our brand is **${b}**.`,
        ``,
        `Run the complete audit **in one pass, without stopping to ask me anything**, then stop at the Proposed Action gate.`,
        ``,
        `## Rules`,
        `- Complete every step below in a single response. Do not ask clarifying questions first.`,
        `- Use the exact section headers given below, in order, so the output is easy to follow.`,
        `- Under each header, state plainly which tool you are calling and what it told you. Lead with the finding, not the mechanics.`,
        `- **This phase is READ-ONLY. Do NOT call \`enrich_product\` or \`draft_content\` yet** — those change things and need my approval first.`,
        `- Keep each section tight: a few sentences or a short table. No filler.`,
        ``,
        `## Step 1 — Where ${b} stands today`,
        `Call \`compare_competitors\` and \`get_sentiment\`. Report ${b}'s Brand Rank, Share of Voice, who is beating it, and how AI surfaces describe it.`,
        ``,
        `## Step 2 — Prompt-by-prompt visibility`,
        `Call \`list_tracked_prompts\`. Show the table and call out which high-volume buyer questions ${b} is invisible for. Then call \`track_visibility\` on the single highest-volume question it is losing, to show exactly who wins it instead.`,
        ``,
        `## Step 3 — Root cause`,
        `Call \`list_opportunities\`. Explain the prioritized gaps and, most importantly, identify the shared root cause. Call \`get_product\` on the SKU behind the biggest gaps to show precisely which catalog attributes are missing.`,
        ``,
        `## Step 4 — What AI visibility is worth today`,
        `Call \`get_revenue_attribution\` and \`get_visibility_trend\`. Report current AI-attributed revenue, which surfaces drive it, growth vs the prior period, and whether rankings are trending up.`,
        ``,
        `## Proposed Action`,
        `Now stop and write this section using exactly these four bold labels:`,
        `- **Problem** — one or two sentences naming the specific visibility gap and what it is costing.`,
        `- **Solution** — the single highest-leverage fix, and why it is the right one.`,
        `- **Changes I want to make** — an explicit numbered list of every tool call you intend to run (tool name + arguments + what it will change). Be concrete: name the SKU, the attributes, and the content you would draft.`,
        `- **Expected impact** — the prompts it unlocks and the estimated monthly revenue.`,
        ``,
        `End your response with exactly this line and nothing after it:`,
        `**Want me to go ahead and make these changes?**`,
        ``,
        `## After I confirm (do not do this until I say yes)`,
        `Once I approve, execute the changes: call \`enrich_product\`, re-run \`list_opportunities\` to prove the gaps closed, call \`draft_content\` for the top remaining opportunity, and write the actual content from the brief it returns. Then finish with a short **Recap** — what changed, and the expected improvement.`,
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
