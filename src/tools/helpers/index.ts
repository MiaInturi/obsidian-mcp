import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const toUnstructuredResult = ({
	text,
	isError = false
}: {
	text: string;
	isError?: boolean;
}): CallToolResult => ({
	content: [{ type: 'text', text }],
	isError
});

export const toStructuredResult = <T extends Record<string, unknown>>({
	data,
	isError = false
}: {
	data: T;
	isError?: boolean;
}): CallToolResult => ({
	content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
	structuredContent: data,
	isError
});

export const formatError = (error: unknown): string => {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return String(error);
};
