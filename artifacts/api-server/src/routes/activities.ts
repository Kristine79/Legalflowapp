import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, activitiesTable } from "@workspace/db";
import {
  ListActivitiesResponse,
  CreateActivityBody,
  CreateActivityResponse,
} from "@workspace/api-zod";
import { getAuthUser } from "../lib/auth";
import { isSuperRole, activityAccessFilter, andFilters } from "../lib/rbac";

const router: IRouter = Router();

router.get("/activities", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const filter = activityAccessFilter(user);
  const query = db.select().from(activitiesTable).orderBy(desc(activitiesTable.createdAt));
  const activities = filter ? await query.where(filter) : await query;
  res.json(ListActivitiesResponse.parse(activities));
});

router.post("/activities", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (user.role === "client") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = CreateActivityBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid activity body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  req.log.info("Creating activity");
  const [activity] = await db
    .insert(activitiesTable)
    .values({ ...parsed.data, userId: user.userId })
    .returning();
  res.status(201).json(CreateActivityResponse.parse(activity));
});

export default router;
