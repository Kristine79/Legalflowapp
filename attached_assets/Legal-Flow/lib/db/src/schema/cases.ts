import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const casesTable = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  clientId: uuid("client_id"),
  lawyerId: varchar("lawyer_id", { length: 255 }),
  assistantId: varchar("assistant_id", { length: 255 }),
  caseNumber: text("case_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  status: text("status").notNull().default("new-request"),
  priority: text("priority"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const caseStatusValues = [
  "new-request",
  "consultation",
  "documents",
  "court",
  "closed",
] as const;

export const insertCaseSchema = z.object({
  clientId: z.string().uuid().optional().nullable(),
  lawyerId: z.string().optional().nullable(),
  assistantId: z.string().optional().nullable(),
  caseNumber: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  status: z.enum(caseStatusValues).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().nullable(),
});

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof casesTable.$inferSelect;
