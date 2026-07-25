/**
 * TRACK phase tools — "where do we show up in AI shopping answers?"
 *
 * Each tool is registered with `server.registerTool(name, config, handler)`:
 *   - `name`        the tool id the agent calls (e.g. "track_visibility")
 *   - `config`      { title, description, inputSchema } — inputSchema is a zod
 *                   "raw shape" (a plain object of zod validators). The SDK turns
 *                   it into the JSON Schema the model sees, and validates inputs.
 *   - `handler`     async fn receiving the parsed args, returning { content: [...] }
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { brands, clientBrand, getBrand } from "../data/brands.js";
import { trackedPrompts } from "../data/prompts-data.js";
import {
  textResult,
  surfaceLabel,
  pct,
  positionLabel,
  movement,
} from "./helpers.js";

/** Loose match so "melatonin free" finds "natural sleep aid without melatonin". */
function findPrompt(query: string) {
  const q = query.toLowerCase().trim();
  return (
    trackedPrompts.find((p) => p.text.toLowerCase() === q) ??
    trackedPrompts.find(
      (p) => p.text.toLowerCase().includes(q) || q.includes(p.text.toLowerCase()),
    ) ??
    trackedPrompts.find((p) =>
      q.split(/\s+/).some((w) => w.length > 3 && p.text.toLowerCase().includes(w)),
    )
  );
}

export function registerTrackTools(server: McpServer): void {
  server.registerTool(
    "track_visibility",
    {
      title: "Track visibility for a buyer question",
      description:
        "Run a real buyer question against AI shopping surfaces and see which brands/products get named, each one's rank, plus the client brand's Share of Voice. This is the core 'where do we show up?' tool.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        prompt: z
          .string()
          .describe("A buyer question, e.g. 'natural sleep aid without melatonin'"),
        surfaces: z
          .array(z.string())
          .optional()
          .describe("Optional filter, e.g. ['chatgpt','gemini']. Omit for all."),
      },
    },
    async ({ prompt, surfaces }) => {
      const tracked = findPrompt(prompt);
      if (!tracked) {
        return textResult(
          `No tracked data for "${prompt}". Tracked prompts include:\n` +
            trackedPrompts.map((p) => `- ${p.text}`).join("\n"),
        );
      }

      let rankings = tracked.rankings;
      if (surfaces?.length) {
        const wanted = new Set(surfaces.map((s) => s.toLowerCase()));
        rankings = rankings.filter((r) => wanted.has(r.surface));
      }

      const bySurface = new Map<string, typeof rankings>();
      for (const r of rankings) {
        const list = bySurface.get(r.surface);
        if (list) list.push(r);
        else bySurface.set(r.surface, [r]);
      }

      let md = `## Visibility — "${tracked.text}"\n`;
      md += `Monthly volume: **${tracked.searchVolumeMonthly.toLocaleString()}** · Category: ${tracked.category}\n`;
      md += `Dosaze position: **${positionLabel(tracked.clientPosition)}** (${movement(
        tracked.clientPosition,
        tracked.clientPositionPrevWeek,
      )})\n\n`;

      for (const [surface, rs] of bySurface) {
        md += `**${surfaceLabel(surface)}**\n`;
        const sorted = [...rs].sort(
          (a, b) => (a.position ?? 99) - (b.position ?? 99),
        );
        for (const r of sorted) {
          const brand = getBrand(r.brandId);
          const isClient = brand?.isClient ? " ⬅ Dosaze" : "";
          md += `- ${positionLabel(r.position)} ${brand?.name ?? r.brandId}${
            r.sku ? ` (${r.sku})` : ""
          }${isClient}\n`;
        }
        md += "\n";
      }

      if (tracked.clientPosition === null) {
        md += `> ⚠️ Dosaze is **not mentioned at all** for this prompt — a total visibility gap. Run \`list_opportunities\` to see the root cause.\n`;
      }
      return textResult(md);
    },
  );

  server.registerTool(
    "list_tracked_prompts",
    {
      title: "List tracked buyer questions",
      description:
        "List every buyer question Wildcard monitors for the client, with monthly volume, current position, and week-over-week movement. Good for a quick 'state of visibility' overview.",
      annotations: { readOnlyHint: true },
      inputSchema: {},
    },
    async () => {
      let md = `## Tracked prompts for Dosaze (${trackedPrompts.length})\n\n`;
      md += `| Prompt | Volume/mo | Position | Movement |\n|---|---:|---|---|\n`;
      for (const p of [...trackedPrompts].sort(
        (a, b) => b.searchVolumeMonthly - a.searchVolumeMonthly,
      )) {
        md += `| ${p.text} | ${p.searchVolumeMonthly.toLocaleString()} | ${positionLabel(
          p.clientPosition,
        )} | ${movement(p.clientPosition, p.clientPositionPrevWeek)} |\n`;
      }
      const invisible = trackedPrompts.filter((p) => p.clientPosition === null);
      md += invisible.length
        ? `\n**${invisible.length} ${
            invisible.length === 1 ? "prompt is a total gap" : "prompts are total gaps"
          }** (Dosaze not mentioned): ${invisible.map((p) => `"${p.text}"`).join(", ")}.\n`
        : `\n✅ **No total gaps** — Dosaze now appears for every tracked prompt.\n`;
      return textResult(md);
    },
  );

  server.registerTool(
    "compare_competitors",
    {
      title: "Compare against competitors",
      description:
        "Compare the client against competitors — for a specific prompt if given, otherwise overall Brand Rank and Share of Voice across all AI surfaces.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        prompt: z
          .string()
          .optional()
          .describe("Optional buyer question to compare on. Omit for overall standings."),
      },
    },
    async ({ prompt }) => {
      if (prompt) {
        const tracked = findPrompt(prompt);
        if (!tracked) return textResult(`No tracked data for "${prompt}".`);
        let md = `## Competitor comparison — "${tracked.text}"\n\n`;
        const best = new Map<string, number | null>();
        for (const r of tracked.rankings) {
          const cur = best.get(r.brandId);
          if (cur === undefined || (r.position ?? 99) < (cur ?? 99))
            best.set(r.brandId, r.position);
        }
        const rows = [...best.entries()].sort(
          (a, b) => (a[1] ?? 99) - (b[1] ?? 99),
        );
        for (const [brandId, position] of rows) {
          const brand = getBrand(brandId);
          md += `- ${positionLabel(position)} ${brand?.name ?? brandId}${
            brand?.isClient ? " ⬅ Dosaze" : ""
          }\n`;
        }
        return textResult(md);
      }

      let md = `## Overall standings (Brand Rank & Share of Voice)\n\n`;
      md += `| Rank | Brand | Share of Voice |\n|---:|---|---:|\n`;
      for (const b of [...brands].sort((a, b) => a.brandRank - b.brandRank)) {
        md += `| ${b.brandRank} | ${b.name}${b.isClient ? " ⬅ Dosaze" : ""} | ${pct(
          b.shareOfVoice,
        )} |\n`;
      }
      md += `\nDosaze is **#${clientBrand.brandRank}** with **${pct(
        clientBrand.shareOfVoice,
      )}** Share of Voice — strong sentiment, but under-surfaced vs the leaders.\n`;
      return textResult(md);
    },
  );

  server.registerTool(
    "get_sentiment",
    {
      title: "Get brand sentiment in AI answers",
      description:
        "How favorably AI surfaces describe a brand: positive/neutral/negative split plus sample language. Defaults to the client (Dosaze).",
      annotations: { readOnlyHint: true },
      inputSchema: {
        brand: z
          .string()
          .optional()
          .describe("Brand name or id. Omit for the client brand (Dosaze)."),
      },
    },
    async ({ brand }) => {
      const target = brand
        ? brands.find(
            (b) =>
              b.id === brand.toLowerCase() ||
              b.name.toLowerCase().includes(brand.toLowerCase()),
          )
        : clientBrand;
      if (!target) return textResult(`No brand found for "${brand}".`);
      const s = target.sentiment;
      let md = `## Sentiment — ${target.name}\n\n`;
      md += `- 🟢 Positive: **${pct(s.positive)}**\n- ⚪ Neutral: ${pct(
        s.neutral,
      )}\n- 🔴 Negative: ${pct(s.negative)}\n\n`;
      md += `How the AIs describe it:\n${s.sampleLanguage.map((q) => `- "${q}"`).join("\n")}\n`;
      return textResult(md);
    },
  );
}
