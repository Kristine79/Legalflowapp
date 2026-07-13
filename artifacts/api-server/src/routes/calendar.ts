import { Router, type IRouter } from "express";
import { eq, gte, lte, and, isNotNull, desc } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";
import { ListCalendarEventsResponse } from "@workspace/api-zod";
import { getAuthUser } from "../lib/auth";
import { isSuperRole } from "../lib/rbac";

const router: IRouter = Router();

router.get("/calendar", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;

  let conditions = [isNotNull(tasksTable.dueDate)];
  if (!isSuperRole(user.role)) {
    conditions.push(eq(tasksTable.userId, user.userId));
  }
  if (from) {
    conditions.push(gte(tasksTable.dueDate, from));
  }
  if (to) {
    conditions.push(lte(tasksTable.dueDate, to));
  }

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(and(...conditions))
    .orderBy(desc(tasksTable.dueDate));

  const events = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    date: task.dueDate,
    type: "task" as const,
    status: task.status,
    priority: task.priority,
    sourceId: task.id,
  }));

  res.json(ListCalendarEventsResponse.parse(events));
});

export default router;
