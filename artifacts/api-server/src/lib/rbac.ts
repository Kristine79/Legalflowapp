import { eq, inArray, or, and, type SQL } from "drizzle-orm";
import { db, clientsTable, casesTable, activitiesTable } from "@workspace/db";
import type { UserRole } from "./auth";

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

export function andFilters(...filters: (SQL | undefined)[]): SQL | undefined {
  const defined = filters.filter((f): f is SQL => f !== undefined);
  if (defined.length === 0) return undefined;
  if (defined.length === 1) return defined[0];
  return and(...defined);
}

export function isSuperRole(role: UserRole): boolean {
  return role === "owner" || role === "admin";
}

export function canCreateCases(role: UserRole): boolean {
  return isSuperRole(role) || role === "lawyer";
}

export function canCreateClients(role: UserRole): boolean {
  return isSuperRole(role) || role === "lawyer";
}

export function canDeleteCases(role: UserRole): boolean {
  return isSuperRole(role);
}

export function canDeleteClients(role: UserRole): boolean {
  return isSuperRole(role) || role === "lawyer";
}

export function caseAccessFilter(user: AuthUser): SQL | undefined {
  if (isSuperRole(user.role)) {
    return undefined;
  }

  if (user.role === "lawyer") {
    return or(eq(casesTable.userId, user.userId), eq(casesTable.lawyerId, user.userId));
  }

  if (user.role === "assistant") {
    return eq(casesTable.assistantId, user.userId);
  }

  if (user.role === "client") {
    return inArray(
      casesTable.clientId,
      db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.email, user.email)),
    );
  }

  return eq(casesTable.id, "none");
}

export function clientAccessFilter(user: AuthUser): SQL | undefined {
  if (isSuperRole(user.role)) {
    return undefined;
  }

  if (user.role === "lawyer") {
    return or(
      eq(clientsTable.userId, user.userId),
      inArray(
        clientsTable.id,
        db
          .select({ clientId: casesTable.clientId })
          .from(casesTable)
          .where(or(eq(casesTable.userId, user.userId), eq(casesTable.lawyerId, user.userId))),
      ),
    );
  }

  if (user.role === "assistant") {
    return inArray(
      clientsTable.id,
      db
        .select({ clientId: casesTable.clientId })
        .from(casesTable)
        .where(eq(casesTable.assistantId, user.userId)),
    );
  }

  if (user.role === "client") {
    return eq(clientsTable.email, user.email);
  }

  return eq(clientsTable.id, "none");
}

export function activityAccessFilter(user: AuthUser): SQL | undefined {
  if (isSuperRole(user.role)) {
    return undefined;
  }

  const filters: SQL[] = [eq(activitiesTable.userId, user.userId)];

  if (user.role === "lawyer") {
    const assignedCaseIds = db
      .select({ id: casesTable.id })
      .from(casesTable)
      .where(or(eq(casesTable.userId, user.userId), eq(casesTable.lawyerId, user.userId)));
    const assignedClientIds = db
      .select({ id: clientsTable.id })
      .from(clientsTable)
      .where(
        or(
          eq(clientsTable.userId, user.userId),
          inArray(
            clientsTable.id,
            db
              .select({ clientId: casesTable.clientId })
              .from(casesTable)
              .where(or(eq(casesTable.userId, user.userId), eq(casesTable.lawyerId, user.userId))),
          ),
        ),
      );
    filters.push(inArray(activitiesTable.clientId, assignedClientIds));
    filters.push(inArray(activitiesTable.caseId, assignedCaseIds));
  } else if (user.role === "assistant") {
    const assignedCaseIds = db
      .select({ id: casesTable.id })
      .from(casesTable)
      .where(eq(casesTable.assistantId, user.userId));
    const assignedClientIds = db
      .select({ id: clientsTable.id })
      .from(clientsTable)
      .where(
        inArray(
          clientsTable.id,
          db
            .select({ clientId: casesTable.clientId })
            .from(casesTable)
            .where(eq(casesTable.assistantId, user.userId)),
        ),
      );
    filters.push(inArray(activitiesTable.clientId, assignedClientIds));
    filters.push(inArray(activitiesTable.caseId, assignedCaseIds));
  } else if (user.role === "client") {
    const ownClientIds = db
      .select({ id: clientsTable.id })
      .from(clientsTable)
      .where(eq(clientsTable.email, user.email));
    const ownCaseIds = db
      .select({ id: casesTable.id })
      .from(casesTable)
      .where(inArray(casesTable.clientId, ownClientIds));
    filters.push(inArray(activitiesTable.clientId, ownClientIds));
    filters.push(inArray(activitiesTable.caseId, ownCaseIds));
  }

  return filters.length === 1 ? filters[0] : or(...filters);
}
