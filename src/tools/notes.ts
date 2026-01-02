import z from "zod";
import fs from "fs/promises";
import path from "path";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";

// ✅ important:
// this function only for type inference, it's not a real tool
const defineTool = <InputSchema extends ZodRawShapeCompat | undefined>(args: {
  name: string;
  description: string;
  inputSchema?: InputSchema;
  // TODO: fix any
  tool: InputSchema extends z.ZodRawShape
    ? (args: z.infer<z.ZodObject<InputSchema>>) => Promise<any>
    : () => Promise<any>;
}) => args;

// TODO: what about error handling?
export const NOTES_TOOLS = {
  getNotes: defineTool({
    name: "get_notes",
    description: "Get list of notes",
    inputSchema: {
      query: z.string().describe("The query to search for notes").default(""),
    },
    async tool(args) {
      const files = await fs.readdir(path.resolve(process.cwd(), "mocks"));
      const query = args.query.trim().toLowerCase();

      return files.filter((name) => name.toLowerCase().includes(query));
    },
  }),

  readNote: defineTool({
    name: "read_note",
    description: "Read a note from given file name",
    inputSchema: {
      fileName: z.string().describe("The name of the note to read"),
    },
    async tool(args) {
      return await fs.readFile(
        path.resolve(process.cwd(), "mocks", args.fileName),
        "utf-8"
      );
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
      const notePath = path.resolve(process.cwd(), "mocks", args.fileName);

      try {
        await fs.stat(notePath);
        throw new Error(
          `Note with filename "${args.fileName}" already exists.`
        );
      } catch (err: any) {
        if (Error.isError(err) && "code" in err && err.code === "ENOENT") {
          await fs.writeFile(notePath, args.content, "utf-8");
          return `Note "${args.fileName}" created successfully.`;
        }

        throw err;
      }
    },
  }),
};
