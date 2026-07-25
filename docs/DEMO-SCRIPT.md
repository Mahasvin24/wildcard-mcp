# Demo script — pitching the Wildcard MCP server

A tight, ~4-minute live demo in Claude Desktop, plus what to say and how to
handle questions.

The demo runs in **two beats**, which is the whole shape of it:

1. **One click → the full audit runs automatically**, start to finish, with clear
   section headers. It changes nothing. It ends with a **Proposed Action** block
   and asks permission.
2. **You say "yes" → it executes**, proves the gaps closed, writes the content,
   and recaps.

That gate is deliberate: it mirrors how Wildcard's real product works — operators
review and approve work before it ships — and it makes the demo safe to run live,
because nothing mutates until the founder says go.

---

## Before you start (2 min, off-camera)

- `npm run build` succeeds; `dist/index.js` exists.
- Claude Desktop shows **wildcard** connected (see CLAUDE-DESKTOP-SETUP.md).
- **Fully quit and reopen Claude Desktop (⌘Q).** This resets the catalog to its
  un-enriched state so the "5 → 2" moment lands. Then start a **fresh chat**.
- Have a terminal ready with `npm run smoke` as a backup.

---

## The 15-second frame (say this first)

> "Wildcard today is a dashboard a human logs into. But your whole thesis is
> agentic commerce — serving AI agents, not just people. So I built the piece
> your changelog says is coming: an MCP server. It lets *any* AI agent run your
> Track → Act → Publish → Measure loop directly. Let me show you Claude doing
> your entire workflow by itself."

---

## Beat 1 — one click, the whole audit

Open the **"+"** menu → run **"Run a full AI-shopping audit"** (the `full_audit`
prompt). It goes end-to-end on its own. **Let it run — don't narrate over it.**
When it lands, walk the founder through the four headers it produced:

| Section | What it shows | Your line |
|---|---|---|
| **1 — Where Dosaze stands** | #6 rank, 11% Share of Voice, strong sentiment | *"Liked once found, but under-surfaced."* |
| **2 — Prompt-by-prompt** | Invisible for "natural sleep aid without melatonin," 22k/mo | *"That's the bleed — a total gap on a high-volume query."* |
| **3 — Root cause** | `DZ-SLEEP-01` missing `melatonin_free` + 2 more | *"Same product causes three lost queries. One fix, three unlocks."* |
| **4 — What it's worth** | ~$41k AI-attributed, 4.6× vs prior 30d | *"And it ties all of this back to dollars."* |

Then it stops at **Proposed Action** — Problem, Solution, Changes I want to make,
Expected impact — and asks *"Want me to go ahead and make these changes?"*

**This is your best moment. Pause here and say:**

> "Notice it stopped. Everything so far was read-only — it diagnosed, it didn't
> touch anything. It's telling me exactly what it wants to change and asking
> permission. That's your operator-approval model, but driven by an agent. And
> it's enforced at the protocol level — the write tool is annotated as a write,
> so a client can gate it."

---

## Beat 2 — approve, and it executes

Type **"yes"** (or "go ahead"). Then narrate:

1. **`enrich_product`** — fills the 4 missing attributes on `DZ-SLEEP-01`.
   → *"That's a write. The agent just changed the catalog through the server —
   in production this syncs back to Shopify."*
2. **`list_opportunities` re-run** — the to-do list drops **5 → 2**.
   → *"It proved its own work. Three gaps gone."*
3. **`draft_content`** → returns a brief, then Claude **writes** the copy.
   → *"The server hands over a grounded brief; the agent writes the content.
   Your data, its intelligence — that's why the server needs no model of its own."*
4. **Recap** — what changed and expected improvement.

---

## The close (say this)

> "That's the same loop your dashboard runs — but now it's legible to agents. A
> customer's ops agent, an agency's automation, or a shopping assistant can call
> Wildcard directly, with a human approval gate built in. It's the 'API and MCP
> access — coming soon' on your changelog, working, and it's the first real step
> toward being the command center *for agents*, not just for people."

---

## Anticipated questions (have these ready)

**"Doesn't this cannibalize our product / let people bypass the dashboard?"**
> "It's an interface, not the engine. I mocked all your defensible parts on
> purpose — live-surface querying, the ranking data, the enrichment engine.
> Different consumer, too: the dashboard is for a human approving work; the MCP
> is for software. Every dashboard-SaaS that ships an API expands who can consume
> it — it doesn't kill the UI. The real question is auth and metering, which is
> an API-design problem, not a reason not to do it."

**"What stops an agent from changing a customer's catalog without oversight?"**
> "Two layers. The write tool is annotated `readOnlyHint: false` so clients can
> require confirmation, and the audit workflow itself won't call it until the
> operator approves. You'd add scoped API keys and an audit log in production —
> but the approval model is already the default here, not an afterthought."

**"How hard was this / is MCP a big lift?"**
> "The plumbing is a day — the SDK handles the protocol. The real work was
> modeling your loop correctly and deciding what an agent should be able to
> *do*, and where a human still has to sign off. That's the part I'd want to get
> right with you against the real data."

**"Where does the AI actually run? What does this cost to operate?"**
> "The server has no LLM and no API key — it just serves data and performs
> actions. The client's model does all the reasoning and writing. So it's $0 to
> run. In production you'd add auth, a hosted HTTP transport, and real catalog sync."

**"Why should visibility work be agent-driven at all?"**
> "Because the buying surface already is. If shoppers are asking agents what to
> buy, the optimization loop that gets brands recommended should be callable by
> agents too — including your customers' own internal agents. That's leverage
> the dashboard alone can't reach."

---

## If the live UI fails — fallback

```bash
npm run smoke
```

Drives the identical loop headless and prints each step. Or open
[demo-walkthrough.html](demo-walkthrough.html) for the visual storyboard.

## Resetting between runs

The enrichment persists while the server process is alive. To get a clean
5-gap state: **fully quit Claude Desktop (⌘Q) and reopen.** That restarts the
server subprocess with fresh seed data.
