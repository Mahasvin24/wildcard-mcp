/**
 * Shared data model for the Wildcard MCP prototype.
 *
 * These types mirror the fields Wildcard actually exposes in their dashboard
 * (Brand Rank, Share of Voice, tracked prompts with search volume, per-surface
 * product rankings, sentiment, and revenue attribution). We model them as plain
 * TypeScript so the tools in src/tools/* can return clean, structured data that
 * an AI agent (the MCP client) can reason over.
 *
 * NOTE: this is mock data by design. Wildcard's real moat is *actually* querying
 * live AI surfaces at scale — we don't reproduce that. We model the shape of the
 * answer so the interface layer (the MCP server) can be demonstrated end-to-end.
 */

/** The AI shopping surfaces Wildcard tracks. Mirrors their live site. */
export type Surface =
  | "chatgpt"
  | "gemini"
  | "google_ai_overviews"
  | "perplexity"
  | "claude"
  | "amazon_rufus" // beta on their real product
  | "walmart_sparky"
  | "alexa";

export const ALL_SURFACES: Surface[] = [
  "chatgpt",
  "gemini",
  "google_ai_overviews",
  "perplexity",
  "claude",
  "amazon_rufus",
  "walmart_sparky",
  "alexa",
];

/** A brand competing for visibility in AI shopping answers. */
export interface Brand {
  id: string;
  name: string;
  /** True for the brand we're optimizing in this demo (Dosaze). */
  isClient: boolean;
  category: string;
  /** Overall rank across all tracked prompts (1 = most-recommended brand). */
  brandRank: number;
  /** Fraction of AI answers (0..1) that mention this brand. Wildcard's "Share of Voice". */
  shareOfVoice: number;
  /** Sentiment split of how the AI describes the brand. Sums to ~1. */
  sentiment: Sentiment;
}

export interface Sentiment {
  positive: number;
  neutral: number;
  negative: number;
  /** A few representative phrases the AI uses about the brand. */
  sampleLanguage: string[];
}

/** Where a brand/product landed for one prompt on one surface. */
export interface Ranking {
  surface: Surface;
  brandId: string;
  /** SKU if a specific product was named; omitted if only the brand was named. */
  sku?: string;
  /** 1-based position in the AI's answer. null = not mentioned at all. */
  position: number | null;
}

/** A real buyer question Wildcard monitors, with its rankings. */
export interface TrackedPrompt {
  id: string;
  text: string;
  /** Estimated monthly search/ask volume across surfaces. Drives prioritization. */
  searchVolumeMonthly: number;
  category: string;
  rankings: Ranking[];
  /** The client's current best position for this prompt (null = invisible). */
  clientPosition: number | null;
  /** The client's position a week ago (for movement indicators). */
  clientPositionPrevWeek: number | null;
}

/**
 * A product in the client's catalog. The heart of the "Act" phase: AI shopping
 * engines can only recommend products whose attributes they can trust/parse.
 * `requiredAttributes` is the schema AI surfaces expect; anything in that list
 * missing from `attributes` is a catalog gap we can fix with `enrich_product`.
 */
export interface Product {
  sku: string;
  brandId: string;
  title: string;
  price: number;
  description: string;
  attributes: Record<string, AttributeValue>;
  requiredAttributes: string[];
}

export type AttributeValue = string | number | boolean | string[];

/** The kind of gap an opportunity represents. */
export type OpportunityType = "catalog_gap" | "content_gap" | "sentiment_gap";

/** Content formats Wildcard's "Publish" phase produces. */
export type ContentFormat =
  | "blog_post"
  | "collection_page"
  | "reddit_reply"
  | "press_outreach"
  | "product_description";

/**
 * A prioritized gap between where the brand is and where it could be — the
 * output of the "Act" phase. Each opportunity ties a tracked prompt to a
 * concrete, fixable reason (usually a missing catalog attribute) and an
 * estimated revenue impact so an agent can prioritize.
 */
export interface Opportunity {
  id: string;
  type: OpportunityType;
  promptId: string;
  promptText: string;
  title: string;
  /** Plain-language explanation of *why* the brand is losing this prompt. */
  reason: string;
  /** Current position for the linked prompt (null = invisible). */
  currentPosition: number | null;
  /** SKU to fix, when the gap is a catalog gap. */
  targetSku?: string;
  /** Attributes missing from the catalog that are blocking visibility. */
  missingAttributes?: string[];
  /** Rough monthly revenue unlocked by closing the gap. */
  estimatedMonthlyRevenue: number;
  /** 0..100 priority (higher = do first). Blends volume, gap size, and revenue. */
  priorityScore: number;
  /** Content format Wildcard would produce to close the gap. */
  recommendedFormat: ContentFormat;
}

/** Revenue attributed to one AI surface over a window. */
export interface SurfaceAttribution {
  surface: Surface;
  orders: number;
  addToCarts: number;
  checkouts: number;
  revenue: number;
}

/** First- vs last-click attribution model, mirroring their real product. */
export type AttributionModel = "first_click" | "last_click";
