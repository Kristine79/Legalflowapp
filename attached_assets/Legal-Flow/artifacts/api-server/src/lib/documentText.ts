import { createRequire } from "node:module";
import mammoth from "mammoth";

// pdf-parse v2 is ESM-only without a default export when bundled; load via CJS require
const _require = createRequire(import.meta.url);
const pdfParse = _require("pdf-parse") as (
  buffer: Buffer,
) => Promise<{ text: string }>;

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/rtf",
  "text/rtf",
]);

function isTextMimeType(fileType: string | null | undefined): boolean {
  if (!fileType) return false;
  return TEXT_MIME_TYPES.has(fileType.toLowerCase());
}

function isDocx(fileType: string | null | undefined, fileName?: string | null): boolean {
  if (fileType?.toLowerCase() === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return true;
  }
  if (fileName?.toLowerCase().endsWith(".docx")) return true;
  return false;
}

export async function extractDocumentText(
  buffer: Buffer,
  fileType: string | null | undefined,
  fileName?: string | null,
): Promise<string | null> {
  if (!fileType) return null;

  const lowerType = fileType.toLowerCase();

  if (lowerType === "application/pdf") {
    try {
      const data = await pdfParse(buffer);
      return data.text.trim();
    } catch {
      return null;
    }
  }

  if (isTextMimeType(fileType)) {
    try {
      return buffer.toString("utf-8").trim();
    } catch {
      return null;
    }
  }

  if (isDocx(fileType, fileName)) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    } catch {
      return null;
    }
  }

  return null;
}
