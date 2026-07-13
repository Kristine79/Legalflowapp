import { pgTable, uuid, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const clientsTable = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }),
  phone: text("phone"),
  description: text("description").notNull(),
  status: text("status").notNull().default("new"),
  category: text("category"),
  type: text("type"),
  priority: text("priority"),
  aiSummary: text("ai_summary"),
  nextAction: text("next_action"),
  risks: jsonb("risks"),
  questions: jsonb("questions"),
  documents: jsonb("documents"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  description: z.string().min(1),
  status: z.enum(["new", "in-progress", "waiting", "closed"]).optional(),
  category: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().nullable(),
  aiSummary: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
  risks: z.array(z.string()).optional().nullable(),
  questions: z.array(z.string()).optional().nullable(),
  documents: z.array(z.string()).optional().nullable(),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
