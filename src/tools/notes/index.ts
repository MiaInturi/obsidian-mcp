import fs from 'node:fs/promises';
import path from 'node:path';

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import z from 'zod';

import { formatError, toStructuredResult, toUnstructuredResult } from '../helpers/index.ts';
import { NOTES_ROOT, PERSMISSION_ERROR_CODES } from './constants/index.ts';
import {
	checkFileExistence,
	isErrnoException,
	listMarkdownNotePaths,
	normalizeEOL,
	validateFilename
} from './helpers/index.ts';

// Important:
// this function only for type inference, it's not a real tool
const defineTool = <
	InputSchema extends z.ZodRawShape | undefined,
	OutputSchema extends z.ZodRawShape | z.ZodType | undefined
>(args: {
	name: string;
	description: string;
	inputSchema?: InputSchema;
	outputSchema?: OutputSchema;
	tool: InputSchema extends z.ZodRawShape
		? (args: z.infer<z.ZodObject<InputSchema>>) => Promise<CallToolResult>
		: () => Promise<CallToolResult>;
}) => {
	return {
		...args,
		tool: async (...params: Parameters<typeof args.tool>) => {
			try {
				// @ts-expect-error — this is a workaround to type the tool callback correctly
				return await args.tool(...params);
			} catch (error) {
				return toUnstructuredResult({ text: formatError(error), isError: true });
			}
		}
	};
};

export const NOTES_TOOLS = {
	getNotes: defineTool({
		name: 'get_notes',
		description: 'Get list of notes',
		inputSchema: {
			query: z.string().describe('The query to search for notes').default('')
		},
		outputSchema: {
			notes: z.array(z.string()).describe('The list of notes')
		},
		async tool(args) {
			const query = args.query.trim().toLowerCase();
			const notes = await listMarkdownNotePaths({ rootDir: NOTES_ROOT, ignorePatterns: ['.trash'] });
			const filteredNotes = query ? notes.filter((note: string) => note.toLowerCase().includes(query)) : notes;

			return toStructuredResult({ data: { notes: filteredNotes } });
		}
	}),

	readNote: defineTool({
		name: 'read_note',
		description: 'Read a note from given file name',
		inputSchema: {
			fileName: z.string().describe('The name of the note to read')
		},
		async tool(args) {
			const content = await fs.readFile(path.resolve(NOTES_ROOT, args.fileName), 'utf-8');

			return toUnstructuredResult({ text: content });
		}
	}),

	createNote: defineTool({
		name: 'create_note',
		description: 'Create a new note with given file name and content',
		inputSchema: {
			fileName: z.string().describe('The name of the note to create'),
			content: z.string().describe('The content of the note')
		},
		async tool(args) {
			const notePath = path.resolve(NOTES_ROOT, args.fileName);

			if (await checkFileExistence(notePath)) {
				return toUnstructuredResult({
					text: `Note with filename "${args.fileName}" already exists.`,
					isError: true
				});
			}

			await fs.writeFile(notePath, args.content, 'utf-8');
			return toUnstructuredResult({
				text: `Note "${args.fileName}" created successfully.`
			});
		}
	}),

	editNote: defineTool({
		name: 'edit_note',
		description: 'Edit or create a note with given file name and content',
		inputSchema: {
			fileName: z.string().describe('The name of the note to edit'),
			content: z.string().describe('The content of the note'),
			confirmed: z.boolean().describe('Whether editing or creating the note is confirmed')
		},
		async tool(args) {
			const validation = validateFilename(args.fileName);
			if (!validation.success) {
				return toUnstructuredResult({ text: validation.reason, isError: true });
			}

			try {
				const notePath = path.resolve(NOTES_ROOT, args.fileName);
				const isNoteExists = await checkFileExistence(notePath);

				if (!args.confirmed) {
					const message = isNoteExists
						? `Confirmation required to edit "${args.fileName}". Do you want to overwrite it? Re-run edit_note with confirmed=true to proceed.`
						: `Note "${args.fileName}" does not exist. Do you want to create it? Re-run edit_note with confirmed=true to proceed.`;
					return toUnstructuredResult({
						text: message,
						isError: true
					});
				}

				const noteDir = path.dirname(notePath);
				await fs.mkdir(noteDir, { recursive: true });

				const normalizedContent = normalizeEOL(args.content);
				const tmpPath = `${notePath}.tmp.${Date.now()}`;

				await fs.writeFile(tmpPath, normalizedContent, {
					encoding: 'utf-8',
					flag: 'wx'
				});

				try {
					await fs.rename(tmpPath, notePath);
				} catch (error) {
					await fs.unlink(tmpPath);
					throw error;
				}

				return toUnstructuredResult({
					text: isNoteExists
						? `Note "${args.fileName}" updated successfully.`
						: `Note "${args.fileName}" created successfully.`
				});
			} catch (error) {
				if (isErrnoException(error) && PERSMISSION_ERROR_CODES.includes(error.code)) {
					return toUnstructuredResult({
						text: 'Impossible to edit: note is read-only.',
						isError: true
					});
				}

				throw error;
			}
		}
	})
};
