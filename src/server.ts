import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { NOTES_TOOLS } from "./tools/index.ts";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ErrorCode } from "@modelcontextprotocol/sdk/types.js";

import { env } from "./env.ts";

const createServer = () => {
  const server = new McpServer({
    name: "obsidian-mcp",
    version: "1.0.0",
  });

  for (const tool of Object.values(NOTES_TOOLS)) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      tool.tool
    );
  }

  return server;
};

const app = createMcpExpressApp({ host: env.HOST });

app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (res.headersSent) return;

    res.status(500).json({
      jsonrpc: "2.0",
      error: {
        code: ErrorCode.InternalError,
        message: "Internal server error",
      },
      id: null,
    });
  }
});

// TODO: propose to add @types/express into lib dependencies instead of dev dependencies?
app.get("/mcp", async (_req, res) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: ErrorCode.ConnectionClosed,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

app.delete("/mcp", async (_req, res) => {
  console.log("Received DELETE MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: ErrorCode.ConnectionClosed,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

app.listen(env.PORT, env.HOST, () => {
  console.log(
    `Obsidian MCP Server running on http://${env.HOST}:${env.PORT}`
  );
});
