import { pgTable, uuid, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const documentStatusValues = ["pending", "analyzed", "error"] as const;

export const documentsTable = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  clientId: uuid("client_id"),
  caseId: uuid("case_id"),
  title: text("title").notNull(),
  fileName: text("file_name"),
  storagePath: text("storage_path"),
  fileType: text("file_type"),
  size: integer("size"),
  textContent: text("text_content"),
  aiSummary: text("ai_summary"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertDocumentSchema = z.object({
  clientId: z.string().uuid().optional().nullable(),
  caseId: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  fileName: z.string().optional().nullable(),
  storagePath: z.string().optional().nullable(),
  fileType: z.string().optional().nullable(),
  size: z.number().int().nonnegative().optional().nullable(),
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
