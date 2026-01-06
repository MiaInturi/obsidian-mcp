import z from "zod";
import fs from "fs/promises";
import path from "path";

import { env } from "../env.ts";
import {
  formatError,
  isErrnoException,
  toTextResult,
} from "./helpers/index.ts";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// ✅ important:
// this function only for type inference, it's not a real tool
const defineTool = <InputSchema extends z.ZodRawShape | undefined>(args: {
  name: string;
  description: string;
  inputSchema?: InputSchema;
  tool: InputSchema extends z.ZodRawShape
    ? (args: z.infer<z.ZodObject<InputSchema>>) => Promise<CallToolResult>
    : () => Promise<CallToolResult>;
}) => {
  return {
    ...args,
    tool: async (...params: Parameters<typeof args.tool>) => {
      try {
        // @ts-ignore — this is a workaround to type the tool callback correctly
        return await args.tool(...params);
      } catch (error) {
        return toTextResult({ text: formatError(error), isError: true });
      }
    },
  };
};

const NOTES_ROOT = path.resolve(process.cwd(), env.NOTES_PATH);

export const NOTES_TOOLS = {
  getNotes: defineTool({
    name: "get_notes",
    description: "Get list of notes",
    inputSchema: {
      query: z.string().describe("The query to search for notes").default(""),
    },
    async tool(args) {
      const files = await fs.readdir(NOTES_ROOT);
      const query = args.query.trim().toLowerCase();
      const matches = files.filter((name) =>
        name.toLowerCase().includes(query)
      );

      return toTextResult({ text: JSON.stringify(matches, null, 2) });
    },
  }),

  readNote: defineTool({
    name: "read_note",
    description: "Read a note from given file name",
    inputSchema: {
      fileName: z.string().describe("The name of the note to read"),
    },
    async tool(args) {
      const content = await fs.readFile(
        path.resolve(NOTES_ROOT, args.fileName),
        "utf-8"
      );

      return toTextResult({ text: content });
    },
  }),

  createNote: defineTool({
    name: "create_note",
    description: "Create a new note with given file name and content",
    inputSchema: {
      fileName: z.string().describe("The name of the note to create"),
      content: z.string().describe("The content of the note"),
    },
    async tool(args) {
      const notePath = path.resolve(NOTES_ROOT, args.fileName);

      try {
        await fs.stat(notePath);
        return toTextResult({
          text: `Note with filename "${args.fileName}" already exists.`,
          isError: true,
        });
      } catch (error) {
        if (isErrnoException(error) && error.code === "ENOENT") {
          await fs.writeFile(notePath, args.content, "utf-8");
          return toTextResult({
            text: `Note "${args.fileName}" created successfully.`,
          });
        }

        throw error;
      }
    },
  }),
};
