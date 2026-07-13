import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { UpdateUserTelegramBody, UpdateUserTelegramResponse } from "@workspace/api-zod";
import { getAuthUser } from "../lib/auth";
import { sendTelegramMessage } from "../lib/telegram";

const router: IRouter = Router();

router.patch("/users/me/telegram", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpdateUserTelegramBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid telegram settings body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      telegramChatId: parsed.data.telegramChatId,
      telegramNotificationsEnabled: parsed.data.telegramNotificationsEnabled,
    })
    .where(eq(usersTable.id, user.userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateUserTelegramResponse.parse(updated));
});

router.post("/telegram/test", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const chatId = user.telegramChatId;
  if (!chatId) {
    res.status(400).json({ error: "Telegram chat ID is not configured" });
    return;
  }

  const result = await sendTelegramMessage(
    chatId,
    "✅ LegalFlow: тестовое уведомление. Интеграция работает.",
  );
  res.json(result);
});

export default router;
