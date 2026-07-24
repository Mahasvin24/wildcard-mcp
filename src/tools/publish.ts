/**
 * PUBLISH phase tool — "make the content that gets us recommended."
 *
 * Key design choice that shows you understand MCP: `draft_content` does NOT
 * write the prose. It returns a structured *content brief* — the grounded facts
 * (target prompt, keywords, the now-filled attributes, competitor angle,
 * outline). The CLIENT model (Claude) writes the actual blog post / Reddit reply
 * from that brief. Server = grounded data + actions; client = intelligence.
 * That division is why this server needs no LLM and costs nothing to run.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ContentFormat } from "../types.js";
import { computeOpportunities } from "../opportunities.js";
import { getProduct } from "../data/catalog.js";
import { getBrand } from "../data/brands.js";
import { getPrompt } from "../data/prompts-data.js";
import { textResult, attrValue } from "./helpers.js";

const FORMAT_GUIDANCE: Record<ContentFormat, string> = {
  blog_post:
    "800–1,200 word educational article. Answer the buyer question directly in the first paragraph (AI engines quote the direct answer). Use H2s per sub-question.",
  collection_page:
    "A shoppable category page. Lead with the qualifying attribute in the H1, list matching products with the key attributes visible as structured text.",
  reddit_reply:
    "A genuine, non-promotional community reply. Lead with helpful advice; mention the product once, naturally, with a concrete reason it fits.",
  press_outreach:
    "A short pitch email to a relevant publication/creator. One-line hook, the proof point, a clear ask.",
  product_description:
    "Rewritten PDP copy that surfaces the structured attributes in prose so engines can extract them.",
};

export function registerPublishTools(server: McpServer): void {
  server.registerTool(
    "draft_content",
    {
      title: "Draft a content brief to close an opportunity",
      description:
        "Given an opportunity id, return a structured content brief (target keywords, attributes to feature, competitor angle, outline, format guidance). The calling model then writes the actual copy from this brief. Use `list_opportunities` first to get an id.",
      inputSchema: {
        opportunity_id: z
          .string()
          .describe("Opportunity id from list_opportunities, e.g. 'opp-p2'"),
        format: z
          .enum([
            "blog_post",
            "collection_page",
            "reddit_reply",
            "press_outreach",
            "product_description",
          ])
          .optional()
          .describe("Override the recommended content format."),
      },
    },
    async ({ opportunity_id, format }) => {
      const opp = computeOpportunities().find((o) => o.id === opportunity_id);
      if (!opp) {
        const ids = computeOpportunities().map((o) => o.id);
        return textResult(
          `No open opportunity "${opportunity_id}". Current ids: ${
            ids.length ? ids.map((i) => `\`${i}\``).join(", ") : "none (all closed)"
          }.`,
        );
      }

      const chosen: ContentFormat = format ?? opp.recommendedFormat;
      const prompt = getPrompt(opp.promptId);
      const product = opp.targetSku ? getProduct(opp.targetSku) : undefined;

      // Competitors currently winning this prompt — the angle to differentiate against.
      const competitors = prompt
        ? [...new Set(prompt.rankings
            .filter((r) => r.position !== null && !getBrand(r.brandId)?.isClient)
            .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
            .map((r) => getBrand(r.brandId)?.name ?? r.brandId))]
        : [];

      let md = `## Content brief — ${opp.title}\n\n`;
      md += `- **Format:** \`${chosen}\`\n`;
      md += `- **Target buyer question:** "${opp.promptText}"\n`;
      md += `- **Why it matters:** ${opp.reason}\n`;
      if (product) {
        md += `- **Product to feature:** ${product.title} (\`${product.sku}\`)\n`;
        md += `- **Attributes to surface as structured text:**\n`;
        for (const [k, v] of Object.entries(product.attributes))
          md += `    - \`${k}\`: ${attrValue(v)}\n`;
      }
      if (competitors.length)
        md += `- **Competitors to differentiate against:** ${competitors.join(", ")}\n`;
      md += `- **Format guidance:** ${FORMAT_GUIDANCE[chosen]}\n\n`;
      md += `---\n**Now write the ${chosen.replace("_", " ")} from this brief.** Ground every claim in the attributes above; open by directly answering the buyer question so AI engines can quote it.\n`;
      return textResult(md);
    },
  );
}
