import { Router } from "express";
import rateLimit from "express-rate-limit";
import { eq, desc } from "drizzle-orm";
import { db, casesTable, activitiesTable, clientsTable } from "@workspace/db";
import { AnalyzeIntakeBody } from "@workspace/api-zod";
import { getAIClient, MODEL } from "../lib/ai";
import { getAuthUser } from "../lib/auth";

const router = Router();

const SYSTEM_PROMPT = `You are an AI Legal Intake Assistant for a Russian law firm CRM. Given a free-form description of a client's legal matter, produce a structured legal intake profile in Russian.

Return ONLY a valid JSON object with no markdown and no commentary. The JSON must have exactly these keys:

- summary: a single concise sentence in Russian summarising the client's legal matter
- category: the legal practice area in Russian (e.g., "Семейное право", "Жилищное право", "Договорное право", "Трудовое право", "Уголовное право", "Гражданская процесс")
- risks: an array of strings. Each item should describe a concrete risk or uncertainty for the case (e.g., "спор по имуществу неизвестен", "отсутствует письменное соглашение", "прошел срок исковой давности"). If none are obvious, return an empty array.
- questions: an array of strings. Each item should be a focused clarifying question to ask the client (e.g., "Есть ли дети?", "Есть ли совместное имущество?", "Есть ли согласие супругов?"). If none are needed, return an empty array.
- documents: an array of strings. Each item should name a document that should be collected for the case (e.g., "паспорт", "свидетельство о браке", "договор аренды"). If none are obvious, return an empty array.
- nextAction: a single concrete next step in Russian that the lawyer should take (e.g., "Создать дело", "Запросить копию договора", "Назначить консультацию")

Guidelines:
- Keep category broad and practical.
- Risks, questions and documents must be arrays of plain strings, never objects.
- If the description is ambiguous, reflect that in risks and questions rather than guessing.
- Output only the JSON object.`;

const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.log.warn({ ip: req.ip }, "AI rate limit exceeded");
    res.status(429).json({ error: "Too many AI requests, please try again later." });
  },
});

function noAI(res: import("express").Response) {
  return res.status(503).json({
    error: "AI не настроен. Укажите OPENAI_API_KEY или OPENROUTER_API_KEY в переменных окружения.",
  });
}

// ── Intake analysis ──────────────────────────────────────────────────────────

router.post("/ai/analyze", aiRateLimiter, async (req, res) => {
  const parseResult = AnalyzeIntakeBody.safeParse(req.body);
  if (!parseResult.success) {
    req.log.warn({ errors: parseResult.error.errors }, "Invalid AI analyze request");
    return res.status(400).json({ error: "Invalid input: description is required" });
  }

  const ai = getAIClient();
  if (!ai) return noAI(res);

  const { description } = parseResult.data;

  try {
    const completion = await ai.client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: description },
      ],
      max_completion_tokens: 1200,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from AI");

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result = {
      summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "Сводка не сгенерирована",
      category: typeof parsed.category === "string" ? parsed.category.trim() : "Общее право",
      type: typeof parsed.type === "string" ? parsed.type.trim() : (typeof parsed.category === "string" ? parsed.category.trim() : "Не определен"),
      priority: ["low", "medium", "high", "urgent"].includes(String(parsed.priority ?? "")) ? String(parsed.priority) : "medium",
      risks: Array.isArray(parsed.risks) ? parsed.risks.map((r) => String(r).trim()).filter(Boolean) : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions.map((q) => String(q).trim()).filter(Boolean) : [],
      documents: Array.isArray(parsed.documents) ? parsed.documents.map((d) => String(d).trim()).filter(Boolean) : [],
      nextAction: typeof parsed.nextAction === "string" ? parsed.nextAction.trim() : "Создать дело",
    };

    req.log.info({ category: result.category }, "AI intake analyzed");
    return res.json(result);
  } catch (err) {
    req.log.error({ err: err instanceof Error ? err.message : err }, "AI analysis failed");
    return res.status(500).json({ error: "AI analysis failed" });
  }
});

// ── Deadline / task suggestions ───────────────────────────────────────────────

router.post("/ai/suggest-deadlines", aiRateLimiter, async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const ai = getAIClient();
  if (!ai) return noAI(res);

  const { category, description } = req.body as { category?: string; description?: string };
  if (!category && !description) {
    return res.status(400).json({ error: "category or description is required" });
  }

  const today = new Date().toISOString().split("T")[0];

  const prompt = `Ты — AI-помощник юриста в российской юридической фирме.
Дата сегодня: ${today}

Дело:
- Категория: ${category || "Не указана"}
- Описание: ${description || "Не указано"}

Предложи 3–5 конкретных задач с реалистичными дедлайнами для этого дела. Учитывай типичные процессуальные сроки российского законодательства.

Верни ТОЛЬКО JSON-массив без markdown и комментариев. Каждый элемент:
{
  "title": "краткое название задачи",
  "description": "что именно нужно сделать",
  "priority": "low" | "medium" | "high" | "urgent",
  "dueDate": "YYYY-MM-DD"
}`;

  try {
    const completion = await ai.client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "user", content: prompt + '\n\nВерни JSON объект с ключом "tasks" содержащим массив задач.' },
      ],
      max_completion_tokens: 1000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response");

    const parsed = JSON.parse(raw) as { tasks?: unknown };
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];

    req.log.info({ count: tasks.length }, "AI deadline suggestions generated");
    return res.json({ tasks });
  } catch (err) {
    req.log.error({ err: err instanceof Error ? err.message : err }, "Deadline suggestion failed");
    return res.status(500).json({ error: "Не удалось сгенерировать рекомендации" });
  }
});

// ── Document template generation ─────────────────────────────────────────────

router.post("/ai/generate-template", aiRateLimiter, async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const ai = getAIClient();
  if (!ai) return noAI(res);

  const { templateType, parameters } = req.body as { templateType?: string; parameters?: string };
  if (!templateType) {
    return res.status(400).json({ error: "templateType is required" });
  }

  const prompt = `Ты — опытный юрист российской юридической фирмы.
Сгенерируй шаблон документа следующего типа: "${templateType}".
${parameters ? `Дополнительные параметры: ${parameters}` : ""}

Требования:
- Документ на русском языке
- Профессиональный юридический стиль
- Включи стандартные разделы для данного типа документа
- Используй [PLACEHOLDER] для данных, которые нужно заполнить
- Текст должен быть готов к использованию как шаблон

Верни JSON объект с двумя полями:
- "title": название документа
- "content": полный текст шаблона`;

  try {
    const completion = await ai.client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response");

    const parsed = JSON.parse(raw) as { title?: string; content?: string };
    req.log.info({ templateType }, "Document template generated");
    return res.json({
      title: parsed.title || templateType,
      content: parsed.content || "",
    });
  } catch (err) {
    req.log.error({ err: err instanceof Error ? err.message : err }, "Template generation failed");
    return res.status(500).json({ error: "Не удалось сгенерировать шаблон" });
  }
});

// ── Case summary ──────────────────────────────────────────────────────────────

router.post("/ai/case-summary", aiRateLimiter, async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const ai = getAIClient();
  if (!ai) return noAI(res);

  const { caseId } = req.body as { caseId?: string };
  if (!caseId) return res.status(400).json({ error: "caseId is required" });

  const [caseRow] = await db.select().from(casesTable).where(eq(casesTable.id, caseId));
  if (!caseRow) return res.status(404).json({ error: "Case not found" });

  const activities = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.caseId, caseId))
    .orderBy(desc(activitiesTable.createdAt))
    .limit(30);

  const activityText = activities.length
    ? activities
        .map((a) => `[${new Date(a.createdAt).toLocaleDateString("ru-RU")}] ${a.type}: ${a.message}`)
        .join("\n")
    : "Активности не найдены.";

  const prompt = `Ты — AI-помощник юриста. Сделай краткую сводку по делу на русском языке.

Дело: ${caseRow.title}
Категория: ${caseRow.category || "Не указана"}
Статус: ${caseRow.status}
Описание: ${caseRow.description || "Не указано"}

История активности (последние 30 событий):
${activityText}

Напиши:
1. Краткое резюме текущей ситуации (2–3 предложения)
2. Ключевые достигнутые результаты (bullet points)
3. Следующие шаги / открытые вопросы (bullet points)

Ответ верни как JSON: { "summary": "...", "achievements": ["...", ...], "nextSteps": ["...", ...] }`;

  try {
    const completion = await ai.client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response");

    const parsed = JSON.parse(raw) as { summary?: string; achievements?: unknown; nextSteps?: unknown };
    req.log.info({ caseId }, "Case summary generated");
    return res.json({
      summary: parsed.summary || "",
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements.map(String) : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String) : [],
    });
  } catch (err) {
    req.log.error({ err: err instanceof Error ? err.message : err }, "Case summary failed");
    return res.status(500).json({ error: "Не удалось сгенерировать сводку" });
  }
});

// ── Conflict of interest check ────────────────────────────────────────────────

router.post("/ai/conflict-check", aiRateLimiter, async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const ai = getAIClient();
  if (!ai) return noAI(res);

  const { name, description } = req.body as { name?: string; description?: string };
  if (!name?.trim()) return res.status(400).json({ error: "name is required" });

  const existingClients = await db
    .select({ id: clientsTable.id, name: clientsTable.name, category: clientsTable.category, description: clientsTable.description })
    .from(clientsTable)
    .where(eq(clientsTable.userId, user.userId))
    .limit(100);

  if (existingClients.length === 0) {
    return res.json({ hasConflict: false, conflicts: [], recommendation: "База клиентов пуста. Конфликт интересов не обнаружен." });
  }

  const clientList = existingClients
    .map((c) => `- ${c.name}${c.category ? ` (${c.category})` : ""}${c.description ? `: ${c.description.slice(0, 100)}` : ""}`)
    .join("\n");

  const prompt = `Ты — AI-помощник для проверки конфликта интересов в юридической фирме. Ответь на русском языке.

Новый потенциальный клиент:
- Имя: ${name}
${description ? `- Описание ситуации: ${description}` : ""}

Существующие клиенты фирмы:
${clientList}

Проанализируй, существует ли потенциальный конфликт интересов. Конфликт возможен если:
- Новый клиент является противоположной стороной в деле существующего клиента
- Имена похожи и возможно это одно лицо с другой стороны
- Схожая ситуация и противоположные интересы

Верни JSON: {
  "hasConflict": true/false,
  "conflicts": [{"name": "имя клиента", "reason": "причина конфликта"}],
  "recommendation": "рекомендация юристу"
}`;

  try {
    const completion = await ai.client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response");

    const parsed = JSON.parse(raw) as { hasConflict?: boolean; conflicts?: unknown; recommendation?: string };
    req.log.info({ name, hasConflict: parsed.hasConflict }, "Conflict check completed");
    return res.json({
      hasConflict: Boolean(parsed.hasConflict),
      conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
      recommendation: parsed.recommendation || "",
    });
  } catch (err) {
    req.log.error({ err: err instanceof Error ? err.message : err }, "Conflict check failed");
    return res.status(500).json({ error: "Не удалось выполнить проверку" });
  }
});

export default router;
