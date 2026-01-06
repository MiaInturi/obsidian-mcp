import path from "path";
import { env } from "../../../env.ts";

export const NOTES_ROOT = path.resolve(process.cwd(), env.NOTES_PATH);

export const PERSMISSION_ERROR_CODES = ["EACCES", "EPERM", "EROFS"];

export const NO_ENTITY_ERROR_CODES = ["ENOENT"];
