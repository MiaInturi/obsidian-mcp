import fs from 'node:fs/promises';
import path from 'node:path';

import { minimatch } from 'minimatch';

const normalizeRelativePath = (rootDir: string, targetPath: string) => {
	return path.relative(rootDir, targetPath).split(path.sep).join('/');
};

const shouldIgnorePath = (relativePath: string, ignorePatterns: string[]) => {
	return ignorePatterns.some((pattern) => minimatch(relativePath, pattern));
};

export type ListMarkdownNotePathsOptions = {
	rootDir: string;
	ignorePatterns?: string[];
};

export const listMarkdownNotePaths = async ({ rootDir, ignorePatterns }: ListMarkdownNotePathsOptions) => {
	const matches: string[] = [];

	const walkDirectory = async (currentDir: string) => {
		const entries = await fs.readdir(currentDir, { withFileTypes: true });

		await Promise.all(
			entries.map(async (entry) => {
				const entryPath = path.join(currentDir, entry.name);
				const relativePath = normalizeRelativePath(rootDir, entryPath);

				if (ignorePatterns?.length && shouldIgnorePath(relativePath, ignorePatterns)) {
					return;
				}

				if (entry.isDirectory()) {
					await walkDirectory(entryPath);
					return;
				}

				if (entry.isSymbolicLink()) {
					const stats = await fs.stat(entryPath);
					if (stats.isDirectory()) {
						await walkDirectory(entryPath);
						return;
					}
					if (!stats.isFile()) {
						return;
					}
				}

				if (!entry.isFile() && !entry.isSymbolicLink()) {
					return;
				}

				const extension = path.extname(entry.name).toLowerCase();
				if (extension !== '.md' && extension !== '.markdown') {
					return;
				}

				matches.push(relativePath);
			})
		);
	};

	await walkDirectory(rootDir);

	return matches;
};
