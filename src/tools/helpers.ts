/**
 * Small formatting helpers shared by every tool.
 *
 * MCP tool callbacks must return a result whose `content` is an array of typed
 * blocks. We return a single markdown text block per call — markdown is ideal
 * because the MCP client (Claude) reads it precisely AND a human watching the
 * raw tool output in the demo can read it too.
 */

/** Wrap a markdown string in the shape an MCP tool must return. */
export function textResult(markdown: string) {
  return { content: [{ type: "text" as const, text: markdown }] };
}

const SURFACE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  google_ai_overviews: "Google AI Overviews",
  perplexity: "Perplexity",
  claude: "Claude",
  amazon_rufus: "Amazon Rufus",
  walmart_sparky: "Walmart Sparky",
  alexa: "Alexa",
};

export function surfaceLabel(surface: string): string {
  return SURFACE_LABELS[surface] ?? surface;
}

export function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function pct(fraction: number): string {
  return Math.round(fraction * 100) + "%";
}

/** "#6", or "not mentioned" for a null position. */
export function positionLabel(position: number | null): string {
  return position === null ? "not mentioned" : "#" + position;
}

/** A ▲/▼/– movement indicator given current vs previous position. */
export function movement(
  current: number | null,
  previous: number | null,
): string {
  if (current === null && previous === null) return "–";
  if (current === null) return "▼ dropped off";
  if (previous === null) return "▲ newly ranking";
  if (current < previous) return `▲ +${previous - current}`;
  if (current > previous) return `▼ -${current - previous}`;
  return "– no change";
}

/** Render an attribute value for display. */
export function attrValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
