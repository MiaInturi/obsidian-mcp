import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const toTextResult = ({
  text,
  isError = false,
}: {
  text: string;
  isError?: boolean;
}): CallToolResult => ({
  content: [{ type: "text", text }],
  isError,
});

export const formatError = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
};
