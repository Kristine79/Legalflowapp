import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import {
  ListNotificationsResponse,
  CreateNotificationBody,
  CreateNotificationResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
  SendTelegramNotificationBody,
  SendTelegramNotificationResponse,
} from "@workspace/api-zod";
import { getAuthUser, type AuthUser } from "../lib/auth";
import { isSuperRole, andFilters } from "../lib/rbac";
import { sendTelegramMessage } from "../lib/telegram";

function notificationAccessFilter(user: AuthUser) {
  if (isSuperRole(user.role)) return undefined;
  return eq(notificationsTable.userId, user.userId);
}

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const filter = notificationAccessFilter(user);
  const query = db
    .select()
    .from(notificationsTable)
    .orderBy(desc(notificationsTable.createdAt));
  const notifications = filter ? await query.where(filter) : await query;
  res.json(ListNotificationsResponse.parse(notifications));
});

router.post("/notifications", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid notification body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [notification] = await db
    .insert(notificationsTable)
    .values({ ...parsed.data, userId: user.userId, read: parsed.data.read ?? false })
    .returning();

  res.status(201).json(CreateNotificationResponse.parse(notification));
});

router.post("/notifications/:notificationId/read", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const filter = andFilters(
    eq(notificationsTable.id, params.data.notificationId),
    notificationAccessFilter(user),
  );
  const [notification] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(filter)
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(MarkNotificationReadResponse.parse(notification));
});

router.post("/notifications/telegram", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = SendTelegramNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid telegram body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const chatId = user.telegramChatId;
  if (!chatId) {
    res.status(400).json({ error: "Telegram chat ID is not configured" });
    return;
  }

  const result = await sendTelegramMessage(chatId, parsed.data.message);
  res.json(SendTelegramNotificationResponse.parse(result));
});

export default router;
