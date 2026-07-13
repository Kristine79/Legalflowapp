import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";
import {
  ListTasksResponse,
  CreateTaskBody,
  CreateTaskResponse,
  GetTaskParams,
  GetTaskResponse,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
  UpdateTaskStatusBody,
  UpdateTaskStatusResponse,
} from "@workspace/api-zod";
import { getAuthUser, type AuthUser } from "../lib/auth";
import { isSuperRole, andFilters } from "../lib/rbac";
import { sendTelegramMessage } from "../lib/telegram";

function taskAccessFilter(user: AuthUser) {
  if (isSuperRole(user.role)) return undefined;
  return eq(tasksTable.userId, user.userId);
}

function toDateString(value: Date | string | null | undefined): string | null | undefined {
  if (value instanceof Date) return value.toISOString().split("T")[0];
  if (value === null) return null;
  return value;
}

const router: IRouter = Router();

router.get("/tasks", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const filter = taskAccessFilter(user);
  const query = db.select().from(tasksTable).orderBy(desc(tasksTable.createdAt));
  const tasks = filter ? await query.where(filter) : await query;
  res.json(ListTasksResponse.parse(tasks));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid task body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const values = {
    title: parsed.data.title,
    description: parsed.data.description,
    status: parsed.data.status,
    priority: parsed.data.priority,
    clientId: parsed.data.clientId,
    caseId: parsed.data.caseId,
    dueDate: toDateString(parsed.data.dueDate),
    userId: user.userId,
  };

  const [task] = await db.insert(tasksTable).values(values).returning();

  if (user.telegramChatId && user.telegramNotificationsEnabled) {
    const title = task.title;
    const due = task.dueDate ? `\nДедлайн: ${task.dueDate}` : "";
    await sendTelegramMessage(
      user.telegramChatId,
      `<b>Новая задача</b>\n${title}${due}`,
    );
  }

  res.status(201).json(CreateTaskResponse.parse(task));
});

router.get("/tasks/:taskId", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const filter = andFilters(eq(tasksTable.id, params.data.taskId), taskAccessFilter(user));
  const [task] = await db.select().from(tasksTable).where(filter);

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(GetTaskResponse.parse(task));
});

router.patch("/tasks/:taskId", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid task update body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const filter = andFilters(eq(tasksTable.id, params.data.taskId), taskAccessFilter(user));
  const [task] = await db
    .update(tasksTable)
    .set({ ...parsed.data, dueDate: toDateString(parsed.data.dueDate) })
    .where(filter)
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(UpdateTaskResponse.parse(task));
});

router.patch("/tasks/:taskId/status", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTaskStatusBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid task status body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const filter = andFilters(eq(tasksTable.id, params.data.taskId), taskAccessFilter(user));
  const [task] = await db
    .update(tasksTable)
    .set({ status: parsed.data.status })
    .where(filter)
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(UpdateTaskStatusResponse.parse(task));
});

router.delete("/tasks/:taskId", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const filter = andFilters(eq(tasksTable.id, params.data.taskId), taskAccessFilter(user));
  const [task] = await db.delete(tasksTable).where(filter).returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
