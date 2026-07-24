# Demo script — pitching the Wildcard MCP server

A tight, ~4-minute live demo in Claude Desktop, plus what to say and how to
handle questions. Practice it once with `npm run smoke` open in a terminal as
your fallback.

---

## Before you start (2 min, off-camera)

- `npm run build` succeeds; `dist/index.js` exists.
- Claude Desktop shows **wildcard** connected (see CLAUDE-DESKTOP-SETUP.md).
- Start a **fresh chat** (so the catalog mutation state is clean — the
  `enrich_product` fix persists only within a running server session, and a
  fresh conversation makes the "before → after" land cleanly).
- Have the terminal ready with `npm run smoke` as a backup if the UI hiccups.

---

## The 15-second frame (say this first)

> "Wildcard today is a dashboard a human logs into. But your whole thesis is
> agentic commerce — serving AI agents, not just people. So I built the piece
> your changelog says is coming: an MCP server. It lets *any* AI agent run your
> Track → Act → Publish → Measure loop directly. Let me show you Claude doing
> your entire workflow by itself."

---

## The demo (one click)

Open the **"+"** menu → run the **"Run a full AI-shopping audit"** prompt
(that's the `full_audit` MCP prompt). Or just type:

> *"Our brand is Dosaze. Audit how we show up in AI shopping, find the single
> highest-impact fix, make the fix, draft the content to close it, then show me
> what that visibility is worth."*

Then **narrate what Claude does** as the tool calls stream in:

1. **TRACK** — Claude calls `compare_competitors` / `list_tracked_prompts`.
   → *"It's pulling where Dosaze stands — #6 overall, and totally invisible for
   'natural sleep aid without melatonin,' a 22k-a-month query."*

2. **ACT** — Claude calls `list_opportunities`, sees the top gap, explains the
   root cause, then calls `enrich_product` on `DZ-SLEEP-01`.
   → *"It found the root cause — the product isn't tagged melatonin-free, so the
   engines can't confirm it qualifies — and it just fixed the catalog. That one
   product was also the reason for two other lost queries."*

3. **Confirm** — Claude re-runs `list_opportunities`; the catalog gaps are gone.
   → *"The to-do list just shrank from 5 to 2 — those weren't reads, the agent
   changed the catalog through the server."*

4. **PUBLISH** — Claude calls `draft_content`, gets a brief, and **writes** the
   blog post / collection page.
   → *"The server handed it a grounded brief; Claude wrote the actual copy. The
   server serves your data; the agent brings the intelligence — that's why it
   needs no model of its own."*

5. **MEASURE** — Claude calls `get_revenue_attribution`.
   → *"And it ties visibility back to dollars — ~4.6x AI-attributed revenue vs
   the prior month, ChatGPT leading."*

---

## The close (say this)

> "That's the same loop your dashboard runs — but now it's legible to agents. A
> customer's ops agent, an agency's automation, or a shopping assistant can call
> Wildcard directly. It's the 'API and MCP access — coming soon' on your
> changelog, working, and it's the first real step toward being the command
> center *for agents*, not just for people. It took me [X]; imagine it wired to
> the real data behind your dashboard."

---

## Anticipated questions (have these ready)

**"Doesn't this cannibalize our product / let people bypass the dashboard?"**
> "It's an interface, not the engine. I mocked all your defensible parts on
> purpose — live-surface querying, the ranking data, the enrichment engine.
> Different consumer, too: the dashboard is for a human approving work; the MCP
> is for software. Every dashboard-SaaS that ships an API expands who can consume
> it — it doesn't kill the UI. The real question is auth and metering, which is
> an API-design problem, not a reason not to do it."

**"How hard was this / is MCP a big lift?"**
> "The plumbing is a day — the SDK handles the protocol. The real work was
> modeling your loop correctly and deciding what an agent should be able to
> *do*. That's the part I'd want to get right with you against the real data."

**"Where does the AI actually run? What does this cost you to operate?"**
> "The server has no LLM and no API key — it just serves data and performs
> actions. The client's model (here, Claude Desktop) does all the reasoning and
> writing. So it's $0 to run. In production you'd add auth, a hosted HTTP
> transport, and real catalog sync."

**"Why should visibility work be agent-driven at all?"**
> "Because the buying surface already is. If shoppers are asking agents what to
> buy, the optimization loop that gets brands recommended should be callable by
> agents too — including your customers' own internal agents. That's leverage
> the dashboard alone can't reach."

---

## If the live UI fails — fallback

Switch to the terminal and run:

```bash
npm run smoke
```

It drives the identical loop headless and prints each step (discovery → track →
before/after opportunities → draft brief → revenue). Narrate from that. It also
proves the point structurally: *this script is the agent, the server is the tool
provider, talking MCP over a pipe.*
