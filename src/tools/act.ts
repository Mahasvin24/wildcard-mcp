/**
 * ACT phase tools — "what's the highest-impact fix, and make it."
 *
 * `list_opportunities` turns tracked-prompt gaps into a prioritized to-do list.
 * `enrich_product` is a WRITE tool: it mutates the in-memory catalog so the fix
 * is real within the session — a follow-up `list_opportunities` shows the gap
 * closed. This demonstrates that an MCP server exposes *actions*, not just reads.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AttributeValue } from "../types.js";
import { catalog, getProduct, getMissingAttributes } from "../data/catalog.js";
import { computeOpportunities, applyCatalogUnlocks } from "../opportunities.js";
import { textResult, money, attrValue, positionLabel } from "./helpers.js";

/**
 * Sensible "correct" values for each product's missing attributes, so an agent
 * can call `enrich_product({ sku })` with no attributes and the tool fills in
 * the right data. (In the real product these would come from the catalog-
 * enrichment engine / operator input.) Passing explicit `attributes` overrides.
 */
const SUGGESTED_ENRICHMENT: Record<string, Record<string, AttributeValue>> = {
  "DZ-SLEEP-01": {
    active_ingredients: ["Magnesium Glycinate", "L-Theanine", "Glycine", "Apigenin"],
    melatonin_free: true,
    third_party_tested: true,
    certifications: ["NSF Certified for Sport", "cGMP"],
  },
  "DZ-MAG-02": {
    melatonin_free: true,
    third_party_tested: true,
    certifications: ["cGMP"],
  },
  "DZ-CALM-03": {
    dosage_mg: 300,
    melatonin_free: true,
    third_party_tested: true,
    vegan: true,
    certifications: ["cGMP"],
  },
};

export function registerActTools(server: McpServer): void {
  server.registerTool(
    "list_opportunities",
    {
      title: "List prioritized optimization opportunities",
      description:
        "Turn visibility gaps into a prioritized to-do list. Each opportunity names the losing prompt, the root cause (usually a missing catalog attribute), an estimated monthly revenue impact, and a priority score. Recomputed live — fixed gaps drop off. Safe to call during a read-only audit.",
      annotations: { readOnlyHint: true },
      inputSchema: {},
    },
    async () => {
      const opps = computeOpportunities();
      if (opps.length === 0) {
        return textResult(
          "🎉 No open opportunities — every tracked gap has been closed this session.",
        );
      }

      let md = `## Prioritized opportunities (${opps.length})\n\n`;
      opps.forEach((o, i) => {
        md += `### ${i + 1}. ${o.title}  \n`;
        md += `Priority **${o.priorityScore}/100** · Est. **${money(
          o.estimatedMonthlyRevenue,
        )}/mo** · Prompt: "${o.promptText}" (${positionLabel(o.currentPosition)})  \n`;
        md += `Type: \`${o.type}\` · Suggested format: \`${o.recommendedFormat}\` · id: \`${o.id}\`  \n`;
        if (o.targetSku) md += `Target SKU: \`${o.targetSku}\``;
        if (o.missingAttributes?.length)
          md += ` · Missing: \`${o.missingAttributes.join("`, `")}\``;
        md += `  \n_${o.reason}_\n\n`;
      });

      // Highlight the shared root cause so the agent sees the leverage point.
      const bySku = new Map<string, number>();
      for (const o of opps)
        if (o.type === "catalog_gap" && o.targetSku)
          bySku.set(o.targetSku, (bySku.get(o.targetSku) ?? 0) + 1);
      const hero = [...bySku.entries()].sort((a, b) => b[1] - a[1])[0];
      if (hero && hero[1] > 1) {
        md += `> 💡 **Leverage point:** ${hero[1]} of these gaps share one root cause — \`${hero[0]}\` is missing attributes. Enriching that single product closes them all. Call \`enrich_product\` with sku \`${hero[0]}\`.\n`;
      }
      return textResult(md);
    },
  );

  server.registerTool(
    "get_catalog",
    {
      title: "Get the product catalog",
      description:
        "List the client's products with how many required attributes each is missing (the AEO completeness view).",
      annotations: { readOnlyHint: true },
      inputSchema: {},
    },
    async () => {
      let md = `## Dosaze catalog (${catalog.length} products)\n\n`;
      for (const p of catalog) {
        const missing = getMissingAttributes(p);
        md += `- **${p.title}** (\`${p.sku}\`) — ${money(p.price)} · ${
          missing.length === 0
            ? "✅ complete"
            : `⚠️ missing ${missing.length}: \`${missing.join("`, `")}\``
        }\n`;
      }
      return textResult(md);
    },
  );

  server.registerTool(
    "get_product",
    {
      title: "Get one product's details",
      description:
        "Full attribute detail for one SKU, including which required attributes are still missing.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        sku: z.string().describe("Product SKU, e.g. 'DZ-SLEEP-01'"),
      },
    },
    async ({ sku }) => {
      const p = getProduct(sku);
      if (!p) return textResult(`No product with SKU "${sku}".`);
      const missing = getMissingAttributes(p);
      let md = `## ${p.title} (\`${p.sku}\`)\n${p.description}\nPrice: ${money(
        p.price,
      )}\n\n**Attributes present:**\n`;
      for (const [k, v] of Object.entries(p.attributes))
        md += `- \`${k}\`: ${attrValue(v)}\n`;
      md += `\n**Missing required attributes:** ${
        missing.length ? "`" + missing.join("`, `") + "`" : "none ✅"
      }\n`;
      return textResult(md);
    },
  );

  server.registerTool(
    "enrich_product",
    {
      title: "Enrich a product's catalog attributes (write)",
      description:
        "Fill in missing catalog attributes for a SKU. Pass `attributes` to set specific values, or omit it to auto-fill the recommended values for whatever is missing. This MUTATES the catalog for the session, so re-running list_opportunities reflects the fix. (Real product would sync back to Shopify/BigCommerce.) This is a WRITE — only call it after the operator has approved the change.",
      // MCP tool annotations: the protocol-level declaration that this tool
      // changes state. Clients can use these hints to gate or confirm calls —
      // it's the structural counterpart to the approval gate in our prompt.
      annotations: {
        readOnlyHint: false,
        destructiveHint: false, // additive: it fills blanks, doesn't delete data
        idempotentHint: true, // applying the same attributes twice is a no-op
      },
      inputSchema: {
        sku: z.string().describe("Product SKU to enrich, e.g. 'DZ-SLEEP-01'"),
        attributes: z
          .record(z.string(), z.any())
          .optional()
          .describe(
            "Optional map of attribute -> value, e.g. { melatonin_free: true }. Omit to auto-fill recommended values for all missing attributes.",
          ),
      },
    },
    async ({ sku, attributes }) => {
      const p = getProduct(sku);
      if (!p) return textResult(`No product with SKU "${sku}".`);

      const before = getMissingAttributes(p);
      const toApply: Record<string, AttributeValue> =
        attributes && Object.keys(attributes).length
          ? (attributes as Record<string, AttributeValue>)
          : Object.fromEntries(
              before
                .filter((a) => a in (SUGGESTED_ENRICHMENT[sku] ?? {}))
                .map((a) => [a, SUGGESTED_ENRICHMENT[sku][a]]),
            );

      if (Object.keys(toApply).length === 0)
        return textResult(
          `Nothing to enrich for \`${sku}\` — no missing attributes have recommended values. It may already be complete.`,
        );

      for (const [k, v] of Object.entries(toApply)) p.attributes[k] = v;
      const after = getMissingAttributes(p);

      // Propagate the fix into the tracked-prompt rankings, so the Track-phase
      // tools stop reporting these prompts as gaps. Without this, the catalog
      // and the rankings would disagree.
      const unlocked = applyCatalogUnlocks(sku);

      let md = `## Enriched ${p.title} (\`${sku}\`)\n\nApplied:\n`;
      for (const [k, v] of Object.entries(toApply)) md += `- \`${k}\`: ${attrValue(v)}\n`;
      md += `\nMissing attributes: ${before.length} → **${after.length}**${
        after.length === 0 ? " ✅ complete" : ` (\`${after.join("`, `")}\`)`
      }\n`;

      if (unlocked.length) {
        const volume = unlocked.reduce((sum, u) => sum + u.searchVolumeMonthly, 0);
        md += `\n🔓 **Dosaze now ranks for ${unlocked.length} previously-invisible ${
          unlocked.length === 1 ? "prompt" : "prompts"
        }** (${volume.toLocaleString()} searches/mo unlocked):\n`;
        for (const u of unlocked)
          md += `- "${u.promptText}" — not mentioned → **#${u.newPosition}**\n`;
        md += `\nVerify with \`track_visibility\` or \`list_tracked_prompts\`, then \`draft_content\` to publish supporting content and climb further.\n`;
      }
      return textResult(md);
    },
  );
}
