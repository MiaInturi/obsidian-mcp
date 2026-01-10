export const normalizeEOL = (content: string) => {
	const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	return `${normalized.replace(/\n*$/, '')}\n`;
};
