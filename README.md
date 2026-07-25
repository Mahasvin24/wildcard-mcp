# Wildcard MCP Server (prototype)

An **MCP server** that exposes Wildcard's AI-shopping-visibility loop —
**Track → Act → Publish → Measure** — as tools any AI agent can call.

Wildcard's product today is a dashboard a human logs into. This prototype turns
that same loop into something an *agent* can drive programmatically: an AI can
audit a brand's visibility in ChatGPT/Gemini/etc., find the highest-impact gap,
fix the catalog, draft the content to close it, and report the revenue impact —
all through tool calls, no human clicking a UI.

It's a working answer to the "**API and MCP access — coming soon**" line on
Wildcard's own changelog, and to the "**command center for agentic commerce**"
vision: for Wildcard to serve *agents* and not just people, its product has to
be legible to agents. An MCP server is the first step.

> ⚠️ **Prototype, not the product.** All data here is realistic **mock data**
> (seeded for Dosaze, Wildcard's flagship case study). It deliberately does **not**
> reproduce Wildcard's actual moat — querying live AI surfaces at scale, the
> proprietary ranking/attribution data, or the catalog-enrichment engine. This
> is the *interface layer* on top of that engine. See
> ["Doesn't this cannibalize the product?"](#doesnt-this-cannibalize-the-product).

---

## What is an MCP server? (30-second version)

**MCP (Model Context Protocol)** is an open standard — think "USB-C for AI apps."
An AI app (the **client/host**, e.g. Claude Desktop) connects to **servers** that
expose three things:

| Primitive | What it is | In this repo |
|---|---|---|
| **Tools** | Functions the model can call | 11 tools across the 4 phases (`src/tools/`) |
| **Resources** | Read-only data the model can load | catalog + prompts as JSON (`src/resources.ts`) |
| **Prompts** | One-click prompt templates | `full_audit` (`src/prompts.ts`) |

The server never calls an LLM. It just returns grounded data and performs
actions. The **client's** model does the reasoning and writing. That division is
why this runs at **$0** — no API key, no per-call cost.

New to all of this? Read **[docs/HOW-MCP-WORKS.md](docs/HOW-MCP-WORKS.md)** — it
explains every concept and points at the exact file in this repo that shows it.

---

## Quickstart

```bash
npm install
npm run build      # compile TypeScript -> dist/
npm run smoke      # headless end-to-end test: drives the whole loop, no UI
```

The smoke test acts as an MCP *client*, spawns the server, and runs
Track → Act → Publish → Measure, asserting that `enrich_product` actually closes
gaps. It's the fastest way to see everything work.

To use it in **Claude Desktop** (the live demo), see
**[docs/CLAUDE-DESKTOP-SETUP.md](docs/CLAUDE-DESKTOP-SETUP.md)**.

To poke tools by hand with the official inspector:

```bash
npm run inspect    # opens the MCP Inspector in your browser
```

---

## The tools (they *are* the pitch)

Reading this list, you see Wildcard's product loop exposed to agents:

**TRACK — where do we show up?**
- `track_visibility(prompt, surfaces?)` — run a buyer question, see who gets named + ranks + Share of Voice
- `list_tracked_prompts()` — all monitored questions with volume + movement
- `compare_competitors(prompt?)` — brand-vs-competitor standings
- `get_sentiment(brand?)` — how AIs describe the brand

**ACT — what's the fix, and make it**
- `list_opportunities()` — prioritized gaps, each with root cause + est. revenue (recomputed live)
- `get_catalog()` / `get_product(sku)` — catalog completeness view
- `enrich_product(sku, attributes?)` — **write**: fill missing attributes; the to-do list shrinks

**PUBLISH — brief the content to close the gap**
- `draft_content(opportunity_id, format?)` — returns a structured brief; the *client model* writes the copy

**MEASURE — what was it worth?**
- `get_revenue_attribution(model?)` — revenue by surface, first/last-click, growth vs prior 30d
- `get_visibility_trend(prompt?)` — position over time

Plus resources (`wildcard://brand/dosaze/catalog`, `.../prompts`) and the
`full_audit` one-click prompt.

---

## The demo — two beats

In Claude Desktop, trigger the **`full_audit`** prompt. It runs in two beats:

**Beat 1 — one click, the whole audit, read-only.** Claude works through four
labelled sections on its own: where the brand stands → prompt-by-prompt
visibility → root cause → what AI visibility is worth. It changes nothing, then
stops at a **Proposed Action** block (Problem · Solution · Changes I want to
make · Expected impact) and asks *"Want me to go ahead and make these changes?"*

**Beat 2 — you approve, it executes.** `enrich_product` fixes the catalog,
`list_opportunities` re-runs to prove the gaps closed (**5 → 2**),
`draft_content` returns a brief and Claude writes the content, then it recaps.

That approval gate mirrors Wildcard's real operator-review model, and it's
enforced at the protocol level: `enrich_product` is annotated
`readOnlyHint: false` so clients can gate it. Full script + what to say:
**[docs/DEMO-SCRIPT.md](docs/DEMO-SCRIPT.md)** · visual storyboard:
**[docs/demo-walkthrough.html](docs/demo-walkthrough.html)**.

---

## Doesn't this cannibalize the product?

Short answer: **no — an MCP server is an interface, not the engine.**

- **We reproduce none of the moat.** Live-surface querying, the proprietary
  data, and the enrichment engine are all *mocked* here on purpose. This is the
  socket, not the power plant.
- **Different consumer.** The dashboard serves a human reviewing/approving. The
  MCP serves *software* — a brand's ops agent, an agency's automation, a
  third-party assistant. Same engine, new distribution. Every dashboard-SaaS
  that also ships an API expands who can consume it; the API doesn't kill the UI.
- **It's their own stated direction** ("API and MCP access — coming soon";
  "command center for agentic commerce").
- **The real risk is acknowledged, not hidden:** exposing data to agents raises
  auth/metering/scoping questions — an API-design problem to productize.

---

## Project layout

```
src/
  index.ts          entry: create server, register everything, connect stdio
  types.ts          the data model (mirrors Wildcard's schema)
  tools/            track.ts · act.ts · publish.ts · measure.ts · helpers.ts
  opportunities.ts  the "Act" brain — derives gaps from live catalog state
  resources.ts      catalog + prompts as MCP resources
  prompts.ts        the full_audit one-click prompt
  data/             brands · prompts-data · catalog · attribution (mock fixtures)
scripts/smoke.mjs   headless MCP client that drives the whole loop
docs/               HOW-MCP-WORKS · DEMO-SCRIPT · CLAUDE-DESKTOP-SETUP
```

## Not built (deliberate next steps, not gaps)

- Live querying of real AI surfaces (Wildcard's hard, proprietary part).
- Auth / multi-tenant / real Shopify etc. catalog sync.
- Remote/hosted transport (stdio local is correct for a prototype + Claude Desktop).
