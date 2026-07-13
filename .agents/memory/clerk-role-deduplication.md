---
name: Clerk role deduplication
description: Preventing owner→client demotion when the same email has multiple Clerk user IDs
---

## Rule
In `users.ts` sync endpoint, before assigning 'client' role to a new user, check if their email already appears in an 'owner' row. If yes, inherit 'owner' role.

## Why
A user can sign in with different OAuth providers (e.g. Google vs email), creating two Clerk user IDs for the same email. Without this check, the second sign-in creates a 'client' row (because an 'owner' already exists) even though the person IS the owner. This causes 403 on all owner-only actions (create client, etc.).

## How to apply
```ts
const [emailOwner] = await db.select().from(usersTable)
  .where(and(eq(usersTable.email, email), eq(usersTable.role, "owner"))).limit(1);
if (emailOwner) { role = "owner"; }
```
Apply this BEFORE the generic "does any owner exist" check in the sync endpoint.
