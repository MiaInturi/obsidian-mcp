import path from "path";

import { NOTES_ROOT } from "../constants/index.ts";

const WINDOWS_ABSOLUTE_PATH_REGEXP = /^[a-zA-Z]:[\\/]/;
const SYSTEM_FILE_NAMES = [
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
  "Icon\r",
  "$RECYCLE.BIN",
  "System Volume Information",
].map((name) => name.toLowerCase());
type ValidateFilenameResult =
  | { success: true }
  | { success: false; reason: string };

export const validateFilename = (fileName: string): ValidateFilenameResult => {
  if (!fileName.trim()) {
    return { success: false, reason: "File name is required." };
  }

  if (
    path.isAbsolute(fileName) ||
    WINDOWS_ABSOLUTE_PATH_REGEXP.test(fileName)
  ) {
    return {
      success: false,
      reason:
        "File name must be a relative path within the notes root; absolute paths are not allowed.",
    };
  }

  const normalizedFilename = path.normalize(fileName);
  const filenameSegments = normalizedFilename.split(path.sep);

  if (
    filenameSegments.some(
      (segment) =>
        segment.startsWith(".") ||
        SYSTEM_FILE_NAMES.includes(segment.toLowerCase())
    )
  ) {
    return {
      success: false,
      reason:
        "Hidden files, directories, and system file names are not allowed.",
    };
  }

  if (
    path.extname(fileName) !== ".md" &&
    path.extname(fileName) !== ".markdown"
  ) {
    return { success: false, reason: "Only .md notes are allowed." };
  }

  const resolved = path.resolve(NOTES_ROOT, normalizedFilename);
  const relative = path.relative(NOTES_ROOT, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return {
      success: false,
      reason: "File name must stay within the notes root.",
    };
  }

  return { success: true };
};
