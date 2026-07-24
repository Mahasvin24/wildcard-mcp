# Connecting the server to Claude Desktop

This is the setup for the live demo. ~5 minutes, one-time.

## Prerequisites

- **Node.js 18+** (check: `node --version`).
- **Claude Desktop** installed — https://claude.ai/download. (A free account is
  fine; you don't need API credits — the server costs nothing to run.)
- This repo built: from the project root,
  ```bash
  npm install && npm run build
  ```
  Confirm `dist/index.js` exists.

## 1. Open the Claude Desktop config file

On macOS the file lives at:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Quickest way to open it: **Claude Desktop → Settings → Developer → Edit Config**.
If the file is empty or missing, create it with the content below.

## 2. Add the server

Paste this (merge into `mcpServers` if you already have other servers). The path
is the absolute path to this repo's built entry point:

```json
{
  "mcpServers": {
    "wildcard": {
      "command": "node",
      "args": ["/Users/mahasvin/Github/wildcard-mcp/dist/index.js"]
    }
  }
}
```

> If you move the repo, update that path. It must be **absolute** — Claude
> Desktop doesn't know your working directory.

## 3. Restart Claude Desktop

Fully quit (⌘Q) and reopen — it only reads the config on launch.

## 4. Verify the connection

- Look for the **tools / connector icon** in the chat input area. Click it and
  you should see **wildcard** listed with its 11 tools.
- The `full_audit` prompt appears in the **"+"** (add context / prompts) menu as
  *"Run a full AI-shopping audit."*
- Quick test — type: *"Use the wildcard tools to show Dosaze's tracked prompts."*
  Claude should call `list_tracked_prompts` and return the table.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Server not listed | Config path wrong or not absolute; rebuild (`npm run build`) so `dist/index.js` exists; fully quit + reopen. |
| "Server disconnected" | Run `node /Users/mahasvin/Github/wildcard-mcp/dist/index.js` in a terminal — it should print `wildcard-mcp server running on stdio` and wait. Any crash prints here. |
| Tools appear but calls error | Rebuild; check you're on Node 18+. |
| Changed the code | Re-run `npm run build`, then fully restart Claude Desktop. |

You can always sanity-check the server without Claude Desktop at all:

```bash
npm run smoke      # drives the whole loop headless
npm run inspect    # official MCP Inspector UI
```
