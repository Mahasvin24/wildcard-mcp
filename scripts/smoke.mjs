/**
 * Headless smoke test: acts as an MCP *client*, spawns our server over stdio,
 * and drives the whole Track -> Act -> Publish -> Measure loop — no UI needed.
 *
 * Run with: npm run smoke   (builds first, then runs this)
 *
 * This is also the clearest possible illustration of the client/server split:
 * this file is the "agent", dist/index.js is the "tool provider", and they talk
 * MCP over a subprocess pipe.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

function textOf(result) {
  return (result.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");
}

function section(title) {
  console.log("\n" + "=".repeat(70) + "\n" + title + "\n" + "=".repeat(70));
}

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
});
const client = new Client({ name: "smoke-test", version: "0.1.0" });
await client.connect(transport);

section("DISCOVERY — what does the server expose?");
const { tools } = await client.listTools();
console.log("Tools:", tools.map((t) => t.name).join(", "));
const { resources } = await client.listResources();
console.log("Resources:", resources.map((r) => r.uri).join(", "));
const { prompts } = await client.listPrompts();
console.log("Prompts:", prompts.map((p) => p.name).join(", "));

section("TRACK — track_visibility('natural sleep aid without melatonin')");
console.log(
  textOf(
    await client.callTool({
      name: "track_visibility",
      arguments: { prompt: "natural sleep aid without melatonin" },
    }),
  ),
);

section("ACT — list_opportunities (BEFORE the fix)");
const before = textOf(await client.callTool({ name: "list_opportunities", arguments: {} }));
console.log(before);

section("ACT — enrich_product('DZ-SLEEP-01')  [WRITE / mutation]");
console.log(
  textOf(
    await client.callTool({ name: "enrich_product", arguments: { sku: "DZ-SLEEP-01" } }),
  ),
);

section("ACT — list_opportunities (AFTER the fix — gaps should shrink)");
const after = textOf(await client.callTool({ name: "list_opportunities", arguments: {} }));
console.log(after);

section("PUBLISH — draft_content for the top magnesium opportunity");
console.log(
  textOf(
    await client.callTool({
      name: "draft_content",
      arguments: { opportunity_id: "opp-p1" },
    }),
  ),
);

section("MEASURE — get_revenue_attribution (first_click)");
console.log(
  textOf(
    await client.callTool({
      name: "get_revenue_attribution",
      arguments: { model: "first_click" },
    }),
  ),
);

// Basic assertion so `npm run smoke` fails loudly if the mutation didn't take.
const beforeCount = (before.match(/^### /gm) || []).length;
const afterCount = (after.match(/^### /gm) || []).length;
section("RESULT");
if (afterCount < beforeCount) {
  console.log(`✅ PASS — opportunities dropped ${beforeCount} -> ${afterCount} after enrich_product.`);
} else {
  console.error(`❌ FAIL — expected fewer opportunities after enrich (${beforeCount} -> ${afterCount}).`);
  process.exitCode = 1;
}

await client.close();
