/**
 * The "Act" brain: turn tracked-prompt gaps into a prioritized, fixable list.
 *
 * This is computed *dynamically* from the current catalog state every time it's
 * called. That's what makes the demo feel real: once `enrich_product` fills a
 * missing attribute, the catalog gap that referenced it disappears from the
 * next `list_opportunities` call — the founder watches the to-do list shrink.
 */
import type { Opportunity, ContentFormat } from "./types.js";
import { trackedPrompts, getPrompt } from "./data/prompts-data.js";
import { getProduct, getMissingAttributes } from "./data/catalog.js";

/** Assumed average order value, used to size revenue estimates. */
const AOV = 31;

/**
 * Maps a tracked prompt to its root cause. `catalog_gap` opportunities point at
 * a specific product + the attribute whose absence is blocking visibility; they
 * only stay "open" while that attribute is still missing. `content_gap`
 * opportunities are ranking climbs that need published content, not a data fix.
 */
interface RootCause {
  type: "catalog_gap" | "content_gap";
  targetSku?: string;
  /** Attribute that must be present to close a catalog gap. */
  blockingAttribute?: string;
  recommendedFormat: ContentFormat;
  titleFor: (promptText: string) => string;
  reasonFor: (promptText: string) => string;
}

const ROOT_CAUSES: Record<string, RootCause> = {
  p2: {
    type: "catalog_gap",
    targetSku: "DZ-SLEEP-01",
    blockingAttribute: "melatonin_free",
    recommendedFormat: "collection_page",
    titleFor: () => "Tag DZ-SLEEP-01 as melatonin-free to win melatonin-free searches",
    reasonFor: (p) =>
      `Dosaze is invisible for "${p}" because DZ-SLEEP-01 has no \`melatonin_free\` attribute, so AI engines can't confirm it qualifies — even though it genuinely is melatonin-free.`,
  },
  p7: {
    type: "catalog_gap",
    targetSku: "DZ-SLEEP-01",
    blockingAttribute: "third_party_tested",
    recommendedFormat: "blog_post",
    titleFor: () => "Add third-party testing data to DZ-SLEEP-01",
    reasonFor: (p) =>
      `Dosaze is invisible for "${p}" because DZ-SLEEP-01 lacks a \`third_party_tested\` attribute and supporting proof, while Nested Naturals surfaces theirs.`,
  },
  p8: {
    type: "catalog_gap",
    targetSku: "DZ-SLEEP-01",
    blockingAttribute: "active_ingredients",
    recommendedFormat: "product_description",
    titleFor: () => "Expose DZ-SLEEP-01's active ingredients (incl. L-Theanine)",
    reasonFor: (p) =>
      `Dosaze is invisible for "${p}" because DZ-SLEEP-01 doesn't publish structured \`active_ingredients\`, so engines don't know it contains L-Theanine.`,
  },
  p1: {
    type: "content_gap",
    targetSku: "DZ-MAG-02",
    recommendedFormat: "blog_post",
    titleFor: () => "Climb the magnesium-for-sleep query with a comparison guide",
    reasonFor: (p) =>
      `Dosaze ranks #6 for "${p}". A comparison-style guide + enriched DZ-MAG-02 attributes would move it toward the top three where Calm and Nested sit.`,
  },
  p3: {
    type: "content_gap",
    targetSku: "DZ-SLEEP-01",
    recommendedFormat: "blog_post",
    titleFor: () => "Own the 'stay asleep through the night' question",
    reasonFor: (p) =>
      `Dosaze ranks #7 for "${p}", trailing OLLY and Natrol. Educational content on sleep maintenance would lift it.`,
  },
};

/** Rough monthly revenue unlocked by closing a gap. */
function estimateRevenue(volume: number, invisible: boolean): number {
  // Invisible prompts are worth capturing from zero; visible-but-weak prompts
  // only capture the incremental climb, so they convert at a lower rate.
  const captureRate = invisible ? 0.012 : 0.006;
  return Math.round(volume * captureRate * AOV);
}

/** Blend revenue and ease into a 0..100 priority. Catalog gaps are quick wins. */
function priority(estRevenue: number, type: RootCause["type"]): number {
  const revenueScore = Math.min(100, estRevenue / 120);
  const easeScore = type === "catalog_gap" ? 95 : 55;
  return Math.round(0.6 * revenueScore + 0.4 * easeScore);
}

/**
 * Build the current opportunity list from live catalog state.
 * A catalog gap is only included if its blocking attribute is still missing.
 */
export function computeOpportunities(): Opportunity[] {
  const opportunities: Opportunity[] = [];

  for (const [promptId, cause] of Object.entries(ROOT_CAUSES)) {
    const prompt = getPrompt(promptId);
    if (!prompt) continue;

    // Skip catalog gaps that have already been fixed this session.
    if (cause.type === "catalog_gap" && cause.targetSku && cause.blockingAttribute) {
      const product = getProduct(cause.targetSku);
      if (product && !getMissingAttributes(product).includes(cause.blockingAttribute)) {
        continue; // attribute now present -> gap closed
      }
    }

    const invisible = prompt.clientPosition === null;
    const estimatedMonthlyRevenue = estimateRevenue(prompt.searchVolumeMonthly, invisible);

    opportunities.push({
      id: `opp-${promptId}`,
      type: cause.type,
      promptId,
      promptText: prompt.text,
      title: cause.titleFor(prompt.text),
      reason: cause.reasonFor(prompt.text),
      currentPosition: prompt.clientPosition,
      targetSku: cause.targetSku,
      missingAttributes: cause.blockingAttribute ? [cause.blockingAttribute] : undefined,
      estimatedMonthlyRevenue,
      priorityScore: priority(estimatedMonthlyRevenue, cause.type),
      recommendedFormat: cause.recommendedFormat,
    });
  }

  return opportunities.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function getOpportunity(id: string): Opportunity | undefined {
  return computeOpportunities().find((o) => o.id === id);
}
