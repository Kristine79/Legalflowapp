import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const teamMembersTable = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }),
  role: text("role"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertTeamMemberSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  role: z.string().optional().nullable(),
});

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembersTable.$inferSelect;
