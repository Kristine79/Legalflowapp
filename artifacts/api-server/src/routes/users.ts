import { Router, type IRouter } from "express";
import { eq, and, ne } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  GetCurrentUserResponse,
  SyncCurrentUserBody,
  SyncCurrentUserResponse,
  ListUsersResponse,
  UpdateUserRoleParams,
  UpdateUserRoleBody,
  UpdateUserRoleResponse,
} from "@workspace/api-zod";
import { getAuthUser, getUserId, parseRole } from "../lib/auth";
import { isSuperRole } from "../lib/rbac";

const router: IRouter = Router();

router.get("/users/me", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.userId));
  if (!dbUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetCurrentUserResponse.parse(dbUser));
});

router.get("/users", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user || !isSuperRole(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const users = await db.select().from(usersTable).orderBy(usersTable.email);
  res.json(ListUsersResponse.parse(users));
});

router.post("/users/sync", async (req, res): Promise<void> => {
  // Deliberately uses getUserId (raw Clerk auth), not getAuthUser: this
  // endpoint's whole job is to create the local DB row for a first-time
  // signed-in Clerk user, so it cannot require that row to already exist.
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = SyncCurrentUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, name, firmName, initials } = parsed.data;

  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  let role = existingUser?.role;
  if (!role) {
    // Check if another record with the same email already holds the 'owner' role
    // (e.g. the same person signed in with a different OAuth provider, creating a
    //  second Clerk user ID for the same email address).  Inherit that role so the
    //  user is not silently demoted to 'client' on their next sign-in.
    const [emailOwner] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.email, email), eq(usersTable.role, "owner")))
      .limit(1);
    if (emailOwner) {
      role = "owner";
    } else {
      const [existingOwner] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.role, "owner"))
        .limit(1);
      role = existingOwner ? "client" : "owner";
    }
  }

  const [dbUser] = await db
    .insert(usersTable)
    .values({ id: userId, email, name, role, firmName, initials })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: { email, name, role, firmName, initials },
    })
    .returning();

  res.json(SyncCurrentUserResponse.parse(dbUser));
});

router.patch("/users/:userId/role", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user || !isSuperRole(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const params = UpdateUserRoleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateUserRoleBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const targetRole = parseRole(body.data.role);

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.userId))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (existing.role === "owner" && targetRole !== "owner") {
    const [otherOwner] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.role, "owner"), ne(usersTable.id, existing.id)))
      .limit(1);
    if (!otherOwner) {
      res.status(400).json({ error: "Cannot remove the last owner" });
      return;
    }
  }

  const [updated] = await db
    .update(usersTable)
    .set({ role: targetRole })
    .where(eq(usersTable.id, params.data.userId))
    .returning();

  res.json(UpdateUserRoleResponse.parse(updated));
});

export default router;
