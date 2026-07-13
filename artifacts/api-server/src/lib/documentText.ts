import { createRequire } from "node:module";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import mammoth from "mammoth";

// pdf-parse v2 is ESM-only without a default export when bundled; load via CJS require
const _require = createRequire(import.meta.url);
const pdfParse = _require("pdf-parse") as (
  buffer: Buffer,
) => Promise<{ text: string }>;

const execFileAsync = promisify(execFile);

/** Extract text from legacy binary .doc via antiword CLI */
async function extractDocViaAntiword(buffer: Buffer): Promise<string | null> {
  const tmpPath = join(tmpdir(), `legalflow_${randomUUID()}.doc`);
  try {
    await writeFile(tmpPath, buffer);
    const { stdout } = await execFileAsync("antiword", [tmpPath], {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout.trim() || null;
  } catch {
    return null;
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

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

  // Legacy binary .doc — try antiword first, fall back to mammoth
  if (fileType?.toLowerCase() === "application/msword" ||
      fileName?.toLowerCase().endsWith(".doc")) {
    const antiwordText = await extractDocViaAntiword(buffer);
    if (antiwordText) return antiwordText;
    // Mammoth sometimes handles .doc too
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value.trim()) return result.value.trim();
    } catch {
      // ignore
    }
    return null;
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
