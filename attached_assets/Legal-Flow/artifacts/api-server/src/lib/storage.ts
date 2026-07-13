import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile, unlink, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, "../../uploads");

export async function ensureUploadsDir(): Promise<string> {
  await mkdir(UPLOADS_DIR, { recursive: true });
  return UPLOADS_DIR;
}

export function getStoragePath(relativePath: string): string {
  // Prevent path traversal: strip leading slashes and disallow ".."
  const safe = relativePath.replace(/^\/+/, "").replace(/\.\./g, "");
  return path.resolve(UPLOADS_DIR, safe);
}

export async function saveFile(
  buffer: Buffer,
  fileName: string,
): Promise<{ storagePath: string; size: number }> {
  await ensureUploadsDir();
  const ext = path.extname(fileName) || ".bin";
  const id = randomUUID();
  const relativePath = `documents/${id}${ext}`;
  const filePath = getStoragePath(relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
  const { size } = await stat(filePath);
  return { storagePath: relativePath, size };
}

export async function readStoredFile(relativePath: string): Promise<Buffer> {
  return readFile(getStoragePath(relativePath));
}

export async function deleteStoredFile(relativePath: string): Promise<void> {
  await unlink(getStoragePath(relativePath));
}
