interface NormalizeEOLParams {
	trimTrailingNewline?: boolean;
	trimTrailingEmptyLines?: boolean;
}

export const normalizeEOL = (content: string, params: NormalizeEOLParams = {}) => {
	const { trimTrailingNewline = true, trimTrailingEmptyLines = true } = params;

	const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	return `${trimTrailingNewline ? normalized.replace(/\n*$/, '') : normalized}${trimTrailingEmptyLines ? '\n' : ''}`;
};
