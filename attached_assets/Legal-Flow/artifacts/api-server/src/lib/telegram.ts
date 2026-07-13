import { logger } from "./logger";

export interface TelegramSendResult {
  ok: boolean;
  error?: string;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn("TELEGRAM_BOT_TOKEN is not configured");
    return { ok: false, error: "Telegram bot token is not configured" };
  }

  if (!chatId) {
    return { ok: false, error: "Chat ID is not configured" };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    const data = (await response.json()) as { ok: boolean; description?: string };

    if (!response.ok || !data.ok) {
      const error = data.description || `Telegram API returned ${response.status}`;
      logger.warn({ chatId, status: response.status, error }, "Telegram message failed");
      return { ok: false, error };
    }

    logger.info({ chatId }, "Telegram message sent");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ chatId, error: message }, "Telegram send failed");
    return { ok: false, error: message };
  }
}
