import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/rtf",
  "text/rtf",
]);

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientId: z.string().uuid().optional().nullable(),
  caseId: z.string().uuid().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileType: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => !v || ALLOWED_MIME_TYPES.has(v.toLowerCase()),
      "Unsupported file type",
    ),
  size: z
    .number()
    .int()
    .nonnegative()
    .max(MAX_FILE_SIZE, "File exceeds 10 MB limit")
    .optional()
    .nullable(),
  fileBase64: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => !v || Buffer.byteLength(v, "base64") <= MAX_FILE_SIZE,
      "File exceeds 10 MB limit",
    ),
});

export const documentIdSchema = z.object({
  documentId: z.string().uuid(),
});
