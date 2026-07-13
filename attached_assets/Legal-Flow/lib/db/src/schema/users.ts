import { pgTable, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const userRoleValues = ["owner", "admin", "lawyer", "assistant", "client"] as const;

export const usersTable = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  name: text("name"),
  role: text("role").notNull().default("client"),
  firmName: text("firm_name"),
  initials: text("initials"),
  telegramChatId: varchar("telegram_chat_id", { length: 255 }),
  telegramNotificationsEnabled: boolean("telegram_notifications_enabled").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertUserSchema = z.object({
  id: z.string().max(255),
  email: z.string().email(),
  name: z.string().optional().nullable(),
  role: z.enum(userRoleValues).optional().nullable(),
  firmName: z.string().optional().nullable(),
  initials: z.string().optional().nullable(),
  telegramChatId: z.string().optional().nullable(),
  telegramNotificationsEnabled: z.boolean().optional().nullable(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
