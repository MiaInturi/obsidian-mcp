import fs from 'node:fs/promises';

import { NO_ENTITY_ERROR_CODES } from '../constants/index.ts';
import { isErrnoException } from '../helpers/index.ts';

export const checkFileExistence = async (filePath: string) => {
	try {
		await fs.stat(filePath);
		return true;
	} catch (error) {
		if (isErrnoException(error) && NO_ENTITY_ERROR_CODES.includes(error.code)) {
			return false;
		}

		throw error;
	}
};
