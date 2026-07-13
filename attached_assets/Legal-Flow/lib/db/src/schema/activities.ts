import { pgTable, uuid, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const activitiesTable = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  clientId: uuid("client_id"),
  caseId: uuid("case_id"),
  type: text("type").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertActivitySchema = z.object({
  clientId: z.string().uuid().optional().nullable(),
  caseId: z.string().uuid().optional().nullable(),
  type: z.string().min(1),
  message: z.string().min(1),
  metadata: z.record(z.any()).optional().nullable(),
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activitiesTable.$inferSelect;
