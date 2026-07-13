import { getAuth } from "@clerk/express";
import { db, usersTable, userRoleValues } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request } from "express";

export function getUserId(req: Request): string | null {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

export type UserRole = (typeof userRoleValues)[number];

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  telegramChatId: string | null;
  telegramNotificationsEnabled: boolean;
}

export function parseRole(role: string | null | undefined): UserRole {
  const validRoles = userRoleValues as readonly string[];
  if (role && validRoles.includes(role)) {
    return role as UserRole;
  }
  return "client";
}

export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const userId = getUserId(req);
  if (!userId) {
    return null;
  }

  let [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  // Race condition guard: user exists in Clerk but POST /users/sync hasn't
  // completed yet (e.g. first login, or Clerk CDN hiccup delayed the frontend
  // sync call). Auto-provision a minimal row so every authenticated request
  // works immediately. The sync endpoint will upsert real name/email/initials
  // on the next successful call.
  if (!user) {
    const [existingOwner] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "owner"))
      .limit(1);
    const role: UserRole = existingOwner ? "client" : "owner";
    // Use a recognisable placeholder that the sync upsert will overwrite
    const placeholderEmail = `${userId}@pending.legalflow`;

    const [created] = await db
      .insert(usersTable)
      .values({ id: userId, email: placeholderEmail, name: null, role, firmName: null, initials: null })
      .onConflictDoNothing()
      .returning();

    // Fetch again in case of a concurrent insert (onConflictDoNothing returns [])
    user = created ?? (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0];
  }

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    role: parseRole(user.role),
    telegramChatId: user.telegramChatId ?? null,
    telegramNotificationsEnabled: user.telegramNotificationsEnabled ?? false,
  };
}
