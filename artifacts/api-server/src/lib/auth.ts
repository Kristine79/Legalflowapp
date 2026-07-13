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

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
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
