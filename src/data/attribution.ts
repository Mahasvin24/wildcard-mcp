/**
 * Revenue attribution — the "Measure" phase. Ties orders/revenue back to the AI
 * surface that drove them, so visibility work can be connected to dollars.
 *
 * Two windows are provided (current 30 days vs the prior 30 days) so the tool
 * can show growth. The totals are tuned to echo Wildcard's real headline — a
 * ~5x increase in AI-search revenue within 30 days.
 *
 * Numbers stored here are the last-click model (the surface of the final click
 * before purchase). The measure tool derives a first-click view from these
 * (first-click shifts credit toward discovery surfaces like ChatGPT/Perplexity).
 */
import type { SurfaceAttribution } from "../types.js";

/** Last 30 days. */
export const currentWindow: SurfaceAttribution[] = [
  { surface: "chatgpt", orders: 412, addToCarts: 1840, checkouts: 520, revenue: 14204 },
  { surface: "google_ai_overviews", orders: 130, addToCarts: 610, checkouts: 172, revenue: 4420 },
  { surface: "gemini", orders: 168, addToCarts: 720, checkouts: 214, revenue: 5712 },
  { surface: "perplexity", orders: 96, addToCarts: 430, checkouts: 128, revenue: 3264 },
  { surface: "claude", orders: 74, addToCarts: 330, checkouts: 98, revenue: 2516 },
  { surface: "amazon_rufus", orders: 44, addToCarts: 210, checkouts: 60, revenue: 1496 },
  { surface: "walmart_sparky", orders: 12, addToCarts: 58, checkouts: 16, revenue: 408 },
  { surface: "alexa", orders: 6, addToCarts: 28, checkouts: 8, revenue: 204 },
];

/** The 30 days before that (pre-optimization baseline). */
export const previousWindow: SurfaceAttribution[] = [
  { surface: "chatgpt", orders: 82, addToCarts: 410, checkouts: 108, revenue: 2788 },
  { surface: "google_ai_overviews", orders: 34, addToCarts: 170, checkouts: 46, revenue: 1156 },
  { surface: "gemini", orders: 40, addToCarts: 190, checkouts: 54, revenue: 1360 },
  { surface: "perplexity", orders: 22, addToCarts: 100, checkouts: 30, revenue: 748 },
  { surface: "claude", orders: 16, addToCarts: 72, checkouts: 22, revenue: 544 },
  { surface: "amazon_rufus", orders: 10, addToCarts: 48, checkouts: 14, revenue: 340 },
  { surface: "walmart_sparky", orders: 4, addToCarts: 18, checkouts: 6, revenue: 136 },
  { surface: "alexa", orders: 2, addToCarts: 10, checkouts: 3, revenue: 68 },
];

/**
 * Discovery-weighting used to derive a first-click view from the last-click
 * data above. Surfaces where people *discover* products (answer engines) get
 * more credit under first-click; marketplace assistants get less.
 */
export const firstClickWeight: Record<string, number> = {
  chatgpt: 1.35,
  perplexity: 1.4,
  gemini: 1.25,
  claude: 1.3,
  google_ai_overviews: 1.2,
  amazon_rufus: 0.7,
  walmart_sparky: 0.7,
  alexa: 0.8,
};
