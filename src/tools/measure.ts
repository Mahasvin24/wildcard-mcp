/**
 * MEASURE phase tools — "what was the visibility worth?"
 *
 * Closes the loop by tying AI-surface visibility back to referral revenue, and
 * showing the trend so improvement is legible.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { currentWindow, previousWindow, firstClickWeight } from "../data/attribution.js";
import { trackedPrompts } from "../data/prompts-data.js";
import { textResult, surfaceLabel, money, movement, positionLabel } from "./helpers.js";

export function registerMeasureTools(server: McpServer): void {
  server.registerTool(
    "get_revenue_attribution",
    {
      title: "Get revenue attributed to AI surfaces",
      description:
        "Revenue, orders, and funnel by AI surface for the last 30 days, with growth vs the prior 30 days. Choose first-click (credits discovery) or last-click (default) attribution.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        model: z
          .enum(["first_click", "last_click"])
          .optional()
          .describe("Attribution model. Default last_click."),
      },
    },
    async ({ model }) => {
      const useFirstClick = model === "first_click";
      const adj = (surface: string, revenue: number) =>
        useFirstClick ? Math.round(revenue * (firstClickWeight[surface] ?? 1)) : revenue;

      const prevBySurface = new Map(previousWindow.map((s) => [s.surface, s.revenue]));

      let curTotal = 0;
      let prevTotal = 0;
      let md = `## Revenue attribution — last 30 days (${
        useFirstClick ? "first-click" : "last-click"
      })\n\n`;
      md += `| Surface | Orders | Revenue | vs prior 30d |\n|---|---:|---:|---:|\n`;

      for (const s of [...currentWindow].sort((a, b) => b.revenue - a.revenue)) {
        const cur = adj(s.surface, s.revenue);
        const prev = adj(s.surface, prevBySurface.get(s.surface) ?? 0);
        curTotal += cur;
        prevTotal += prev;
        const growth = prev > 0 ? `${(cur / prev).toFixed(1)}x` : "new";
        md += `| ${surfaceLabel(s.surface)} | ${s.orders} | ${money(cur)} | ${growth} |\n`;
      }

      const mult = prevTotal > 0 ? (curTotal / prevTotal).toFixed(1) : "—";
      md += `\n**Total AI-attributed revenue: ${money(curTotal)}** (prior 30d: ${money(
        prevTotal,
      )} → **${mult}x**).\n`;
      md += `ChatGPT is the dominant surface. ${
        useFirstClick
          ? "Under first-click, discovery surfaces (ChatGPT, Perplexity) get more credit."
          : "Switch to first_click to see discovery-surface credit."
      }\n`;
      return textResult(md);
    },
  );

  server.registerTool(
    "get_visibility_trend",
    {
      title: "Get visibility trend (position over time)",
      description:
        "Week-over-week position movement for a specific prompt, or all tracked prompts. Shows whether optimization work is moving rankings.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        prompt: z
          .string()
          .optional()
          .describe("Optional prompt text to filter to. Omit for all prompts."),
      },
    },
    async ({ prompt }) => {
      const q = prompt?.toLowerCase().trim();
      const rows = q
        ? trackedPrompts.filter((p) => p.text.toLowerCase().includes(q))
        : trackedPrompts;
      if (rows.length === 0) return textResult(`No tracked prompt matching "${prompt}".`);

      let md = `## Visibility trend (week over week)\n\n`;
      md += `| Prompt | Last week | Now | Movement |\n|---|---|---|---|\n`;
      for (const p of rows) {
        md += `| ${p.text} | ${positionLabel(p.clientPositionPrevWeek)} | ${positionLabel(
          p.clientPosition,
        )} | ${movement(p.clientPosition, p.clientPositionPrevWeek)} |\n`;
      }
      return textResult(md);
    },
  );
}
