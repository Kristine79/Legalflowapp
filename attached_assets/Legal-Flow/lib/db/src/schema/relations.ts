import { relations } from "drizzle-orm";
import { usersTable } from "./users";
import { clientsTable } from "./clients";
import { casesTable } from "./cases";
import { documentsTable } from "./documents";
import { tasksTable } from "./tasks";
import { activitiesTable } from "./activities";
import { notificationsTable } from "./notifications";
import { teamMembersTable } from "./teamMembers";
import { auditLogsTable } from "./auditLogs";

export const usersRelations = relations(usersTable, ({ many }) => ({
  clients: many(clientsTable),
  cases: many(casesTable),
  documents: many(documentsTable),
  tasks: many(tasksTable),
  activities: many(activitiesTable),
  notifications: many(notificationsTable),
  teamMembers: many(teamMembersTable),
  auditLogs: many(auditLogsTable),
}));

export const clientsRelations = relations(clientsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [clientsTable.userId],
    references: [usersTable.id],
  }),
  cases: many(casesTable),
  documents: many(documentsTable),
  tasks: many(tasksTable),
  activities: many(activitiesTable),
}));

export const casesRelations = relations(casesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [casesTable.userId],
    references: [usersTable.id],
  }),
  client: one(clientsTable, {
    fields: [casesTable.clientId],
    references: [clientsTable.id],
  }),
  documents: many(documentsTable),
  tasks: many(tasksTable),
  activities: many(activitiesTable),
}));

export const documentsRelations = relations(documentsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [documentsTable.userId],
    references: [usersTable.id],
  }),
  client: one(clientsTable, {
    fields: [documentsTable.clientId],
    references: [clientsTable.id],
  }),
  case: one(casesTable, {
    fields: [documentsTable.caseId],
    references: [casesTable.id],
  }),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [tasksTable.userId],
    references: [usersTable.id],
  }),
  client: one(clientsTable, {
    fields: [tasksTable.clientId],
    references: [clientsTable.id],
  }),
  case: one(casesTable, {
    fields: [tasksTable.caseId],
    references: [casesTable.id],
  }),
}));

export const activitiesRelations = relations(activitiesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [activitiesTable.userId],
    references: [usersTable.id],
  }),
  client: one(clientsTable, {
    fields: [activitiesTable.clientId],
    references: [clientsTable.id],
  }),
  case: one(casesTable, {
    fields: [activitiesTable.caseId],
    references: [casesTable.id],
  }),
}));

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [notificationsTable.userId],
    references: [usersTable.id],
  }),
}));

export const teamMembersRelations = relations(teamMembersTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [teamMembersTable.userId],
    references: [usersTable.id],
  }),
}));

export const auditLogsRelations = relations(auditLogsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [auditLogsTable.userId],
    references: [usersTable.id],
  }),
}));
