# How MCP works — explained through this repo

This doc is for understanding **how the whole thing actually works**, so you can
explain it live without hand-waving. Every concept points at a real file here.

---

## 1. The one-sentence mental model

> An **MCP server** is a small program that advertises a menu of **tools**
> (functions), **resources** (documents), and **prompts** (templates). An **MCP
> client** (an AI app like Claude Desktop) connects to it, reads the menu, and
> lets its model call those tools during a conversation.

MCP is just a **standard shape** for that menu and those calls, so *any* client
can talk to *any* server. Before MCP, every AI app integrated every tool in its
own bespoke way. MCP is the "USB-C port": build the server once, and Claude
Desktop, Cursor, a custom agent, etc. can all use it.

**Who is who here:**
- **Server** = this repo (`dist/index.js`). It provides Wildcard's tools.
- **Client/host** = Claude Desktop (in the demo) or `scripts/smoke.mjs` (in the test).
- **Model** = Claude, living inside the client, deciding which tools to call.

---

## 2. Why the server never needs an LLM (and costs $0)

This is the single most important idea, and worth saying out loud in the pitch.

There's a clean division of labor:

- **The server provides grounded facts and actions.** "Dosaze is #6 for this
  prompt." "Here are the missing attributes." "Mark this product melatonin-free."
- **The client's model provides intelligence.** It decides *which* tools to
  call, reasons over the results, and writes prose.

You can see this deliberately in `src/tools/publish.ts`: `draft_content` does
**not** write a blog post. It returns a structured *brief* (target keywords, the
product attributes to feature, the competitor angle) and hands off:
`"Now write the blog post from this brief."` The client's model writes the copy.

Because the server only shuffles data, it calls no LLM → needs no API key →
costs nothing to run. (A different design *could* call an LLM inside a tool, but
we intentionally didn't — it's cheaper and it's the better demo of the split.)

---

## 3. The transport: how bytes actually move (`src/index.ts`)

MCP messages are **JSON-RPC** (a simple "call this method with these params,
get a result" format). They travel over a **transport**. The two common ones:

- **stdio** — the client launches the server as a **subprocess** and they talk
  over stdin/stdout. No network, no ports. This is what Claude Desktop uses, and
  what we use. See the last lines of `src/index.ts`:

  ```ts
  const transport = new StdioServerTransport();
  await server.connect(transport);
  ```

- **HTTP** — for remote/hosted servers. Not used here (a local prototype doesn't
  need it), but it's how you'd productionize this for real customers.

⚠️ **Because stdout carries the protocol, the server must never `console.log` to
stdout** — that would corrupt the JSON-RPC stream. All our logging uses
`console.error` (stderr). That's the comment at the top of `src/index.ts`.

---

## 4. The lifecycle of a conversation

When Claude Desktop starts our server, this happens in order:

1. **`initialize`** — client and server handshake and exchange capabilities
   ("I have tools, resources, and prompts").
2. **`tools/list`** — the client asks for the menu. The SDK builds this from
   every `server.registerTool(...)` call. Each tool's `inputSchema` (a Zod shape)
   becomes a **JSON Schema** the model reads to know what arguments to pass.
3. **User types a request** (or triggers the `full_audit` prompt).
4. **`tools/call`** — the model picks a tool and arguments; the client sends the
   call; the SDK validates the arguments against the schema, runs our handler,
   and returns the `{ content: [...] }` we produced.
5. The model reads that result and **decides the next call** — this is the loop
   that lets one request fan out into Track → Act → Publish → Measure.

`scripts/smoke.mjs` performs exactly steps 1–4 by hand (`client.listTools()`,
`client.callTool(...)`), which is why it's a good thing to read to demystify all
of this.

---

## 5. Anatomy of a tool (`src/tools/track.ts`)

Every tool is one `server.registerTool(name, config, handler)` call:

```ts
server.registerTool(
  "track_visibility",                        // (1) the id the model calls
  {
    title: "Track visibility for a buyer question",
    description: "Run a real buyer question against AI shopping surfaces ...",  // (2)
    inputSchema: {                           // (3) a Zod "raw shape"
      prompt: z.string().describe("A buyer question, e.g. ..."),
      surfaces: z.array(z.string()).optional().describe("Optional filter ..."),
    },
  },
  async ({ prompt, surfaces }) => {          // (4) the handler
    // ...look up data...
    return textResult(markdown);             // (5) { content: [{ type:"text", text }] }
  },
);
```

1. **name** — what the model writes when it calls the tool.
2. **description** — the model reads this to decide *when* to use the tool.
   Good descriptions are the difference between the model using a tool correctly
   or not. (Notice ours say what the tool is *for*, not just what it does.)
3. **inputSchema** — a plain object of Zod validators (a "raw shape"). The SDK
   converts it to JSON Schema for the model and validates incoming args, so the
   handler receives clean, typed values.
4. **handler** — your logic. Receives the parsed args.
5. **return value** — must be `{ content: [...] }`. We return one markdown text
   block via the `textResult()` helper (`src/tools/helpers.ts`). Markdown is
   ideal: the model parses it precisely and a human watching raw output can read
   it too.

---

## 6. Tools that *do* things — the write tool (`src/tools/act.ts`)

Tools aren't just reads. `enrich_product` **mutates** the in-memory catalog:

```ts
for (const [k, v] of Object.entries(toApply)) p.attributes[k] = v;
```

That's why the demo feels alive: `list_opportunities` is recomputed from catalog
state every call (`src/opportunities.ts`), so once `enrich_product` fills the
missing `melatonin_free` attribute, the opportunity that pointed at it simply
**stops appearing**. In the real product, that write would sync back to Shopify.

This is worth emphasizing in the pitch: an MCP server exposes **actions**, not
just a read-only API. Agents can *change* things through it.

---

## 7. Resources vs tools (`src/resources.ts`)

A **resource** is read-only data addressed by a URI, like a file. We expose:

- `wildcard://brand/dosaze/catalog` → the full catalog as JSON
- `wildcard://brand/dosaze/prompts` → all tracked prompts as JSON

Rule of thumb: **tools = verbs** (do something, maybe with side effects);
**resources = nouns** (load this document into context). A client can attach a
resource to the conversation without the model "spending" a tool call on it.

---

## 8. Prompts (`src/prompts.ts`)

An MCP **prompt** is a reusable, parameterized message the *user* triggers from
the client UI (in Claude Desktop, the "+" menu). Our `full_audit` prompt injects
one message that tells the model to run the entire loop with our tools. It's the
demo's one-click on-ramp so you don't type a paragraph in front of the founder.

---

## 9. How to see it all yourself

- `npm run smoke` — reads like a screenplay of steps 1–4 above.
- `npm run inspect` — the official MCP Inspector: a UI that lists your tools,
  shows each tool's JSON Schema, and lets you click-call them with raw JSON in
  and out. Great for understanding exactly what the model sees.

---

## 10. The 20-second explanation to give the founder

"It's a standard interface so any AI agent can drive your Track→Act→Publish→
Measure loop directly — audit visibility, fix the catalog, draft the content,
read the revenue — without a human in your dashboard. The server just serves
your data and actions; the agent brings the intelligence. It's the 'MCP access —
coming soon' on your changelog, working, and it's the first step to being the
command center *for agents*, not just for people."
