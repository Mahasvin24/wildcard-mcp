/**
 * Tracked buyer questions — the "Track" phase. Each is a real-sounding shopping
 * query with monthly volume and per-surface rankings for the client (Dosaze)
 * and competitors.
 *
 * The story baked into this data: Dosaze is INVISIBLE (position null) for three
 * high-value prompts — p2, p7, p8 — and in every case the root cause is a
 * missing attribute on the DZ-SLEEP-01 product (melatonin_free, third_party_tested,
 * and active_ingredients respectively). That makes DZ-SLEEP-01 the single
 * highest-leverage fix: enriching one product unlocks three lost prompts.
 */
import type { TrackedPrompt } from "../types.js";

export const trackedPrompts: TrackedPrompt[] = [
  {
    id: "p1",
    text: "best magnesium supplement for sleep",
    searchVolumeMonthly: 40500,
    category: "magnesium",
    clientPosition: 6,
    clientPositionPrevWeek: 8,
    rankings: [
      { surface: "chatgpt", brandId: "calm", position: 1 },
      { surface: "chatgpt", brandId: "nested", position: 2 },
      { surface: "chatgpt", brandId: "natrol", position: 4 },
      { surface: "chatgpt", brandId: "dosaze", sku: "DZ-MAG-02", position: 6 },
      { surface: "gemini", brandId: "calm", position: 1 },
      { surface: "gemini", brandId: "dosaze", sku: "DZ-MAG-02", position: 5 },
      { surface: "perplexity", brandId: "nested", position: 1 },
      { surface: "perplexity", brandId: "dosaze", sku: "DZ-MAG-02", position: 6 },
    ],
  },
  {
    id: "p2",
    text: "natural sleep aid without melatonin",
    searchVolumeMonthly: 22000,
    category: "melatonin-free",
    clientPosition: null, // INVISIBLE — flagship gap
    clientPositionPrevWeek: null,
    rankings: [
      { surface: "chatgpt", brandId: "nested", position: 1 },
      { surface: "chatgpt", brandId: "calm", position: 2 },
      { surface: "chatgpt", brandId: "dosaze", position: null },
      { surface: "gemini", brandId: "nested", position: 1 },
      { surface: "gemini", brandId: "dosaze", position: null },
      { surface: "perplexity", brandId: "calm", position: 1 },
      { surface: "perplexity", brandId: "dosaze", position: null },
      { surface: "claude", brandId: "nested", position: 1 },
      { surface: "claude", brandId: "dosaze", position: null },
    ],
  },
  {
    id: "p3",
    text: "supplement for staying asleep through the night",
    searchVolumeMonthly: 14800,
    category: "sleep-quality",
    clientPosition: 7,
    clientPositionPrevWeek: 8,
    rankings: [
      { surface: "chatgpt", brandId: "olly", position: 1 },
      { surface: "chatgpt", brandId: "natrol", position: 3 },
      { surface: "chatgpt", brandId: "dosaze", sku: "DZ-SLEEP-01", position: 7 },
      { surface: "gemini", brandId: "olly", position: 2 },
      { surface: "gemini", brandId: "dosaze", sku: "DZ-SLEEP-01", position: 6 },
    ],
  },
  {
    id: "p4",
    text: "best sleep supplement for anxiety",
    searchVolumeMonthly: 12100,
    category: "anxiety",
    clientPosition: 4,
    clientPositionPrevWeek: 4,
    rankings: [
      { surface: "chatgpt", brandId: "calm", position: 1 },
      { surface: "chatgpt", brandId: "dosaze", sku: "DZ-CALM-03", position: 4 },
      { surface: "perplexity", brandId: "dosaze", sku: "DZ-CALM-03", position: 3 },
      { surface: "claude", brandId: "dosaze", sku: "DZ-CALM-03", position: 4 },
    ],
  },
  {
    id: "p5",
    text: "magnesium glycinate vs melatonin for sleep",
    searchVolumeMonthly: 8100,
    category: "magnesium",
    clientPosition: 3,
    clientPositionPrevWeek: 5,
    rankings: [
      { surface: "chatgpt", brandId: "calm", position: 1 },
      { surface: "chatgpt", brandId: "dosaze", sku: "DZ-MAG-02", position: 3 },
      { surface: "gemini", brandId: "dosaze", sku: "DZ-MAG-02", position: 2 },
    ],
  },
  {
    id: "p6",
    text: "non habit forming sleep aid",
    searchVolumeMonthly: 6600,
    category: "safety",
    clientPosition: 5,
    clientPositionPrevWeek: 6,
    rankings: [
      { surface: "chatgpt", brandId: "nested", position: 1 },
      { surface: "chatgpt", brandId: "dosaze", sku: "DZ-SLEEP-01", position: 5 },
      { surface: "claude", brandId: "dosaze", sku: "DZ-SLEEP-01", position: 4 },
    ],
  },
  {
    id: "p7",
    text: "third party tested sleep supplements",
    searchVolumeMonthly: 3200,
    category: "quality-assurance",
    clientPosition: null, // INVISIBLE — missing third_party_tested attribute
    clientPositionPrevWeek: null,
    rankings: [
      { surface: "chatgpt", brandId: "nested", position: 1 },
      { surface: "chatgpt", brandId: "dosaze", position: null },
      { surface: "perplexity", brandId: "nested", position: 1 },
      { surface: "perplexity", brandId: "dosaze", position: null },
    ],
  },
  {
    id: "p8",
    text: "sleep supplement with l-theanine",
    searchVolumeMonthly: 2400,
    category: "ingredient",
    clientPosition: null, // INVISIBLE — DZ-SLEEP-01's active_ingredients not exposed
    clientPositionPrevWeek: null,
    rankings: [
      { surface: "chatgpt", brandId: "nested", position: 1 },
      { surface: "chatgpt", brandId: "dosaze", position: null },
      { surface: "gemini", brandId: "dosaze", position: null },
    ],
  },
];

export function getPrompt(id: string): TrackedPrompt | undefined {
  return trackedPrompts.find((p) => p.id === id);
}
