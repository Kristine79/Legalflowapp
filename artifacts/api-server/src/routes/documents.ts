import { Router, type IRouter, type Request } from "express";
import { eq, desc, and, or, inArray, like } from "drizzle-orm";
import { db, documentsTable, casesTable, clientsTable } from "@workspace/db";
import { getAuthUser } from "../lib/auth";
import { isSuperRole, caseAccessFilter, clientAccessFilter, andFilters } from "../lib/rbac";
import { saveFile, readStoredFile, deleteStoredFile } from "../lib/storage";
import { extractDocumentText } from "../lib/documentText";
import { analyzeDocument } from "../lib/ai";
import { createDocumentSchema, documentIdSchema } from "../lib/validation";

function documentAccessFilter(user: { userId: string; email: string; role: import("../lib/auth").UserRole }) {
  if (isSuperRole(user.role)) return undefined;

  const caseFilter = caseAccessFilter(user);
  const clientFilter = clientAccessFilter(user);
  const caseIds = db
    .select({ id: casesTable.id })
    .from(casesTable)
    .where(caseFilter ?? eq(casesTable.id, "none"));
  const clientIds = db
    .select({ id: clientsTable.id })
    .from(clientsTable)
    .where(clientFilter ?? eq(clientsTable.id, "none"));

  return or(
    inArray(documentsTable.caseId, caseIds),
    inArray(documentsTable.clientId, clientIds),
  );
}

function getDownloadUrl(req: Request, documentId: string): string {
  const host = req.headers.host || "";
  const protocol = (req.headers["x-forwarded-proto"] as string) || "http";
  return `${protocol}://${host}/api/documents/${documentId}/download`;
}

const router: IRouter = Router();

router.get("/documents", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const accessFilter = documentAccessFilter(user);
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const titleFilter = q ? like(documentsTable.title, `%${q}%`) : undefined;

  const combined = andFilters(accessFilter, titleFilter);
  const docs = combined
    ? await db.select().from(documentsTable).where(combined).orderBy(desc(documentsTable.createdAt))
    : await db.select().from(documentsTable).orderBy(desc(documentsTable.createdAt));

  res.json(docs.map((doc) => ({ ...doc, fileUrl: getDownloadUrl(req, doc.id) })));
});

router.post("/documents", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = createDocumentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, clientId, caseId, fileName, fileType, size, fileBase64 } = parsed.data;

  let storagePath: string | null = null;
  let textContent: string | null = null;
  let actualSize = size ?? null;

  if (fileBase64) {
    const buffer = Buffer.from(fileBase64, "base64");
    actualSize = buffer.length;
    const saved = await saveFile(buffer, fileName || "document");
    storagePath = saved.storagePath;
    try {
      textContent = await extractDocumentText(buffer, fileType, fileName);
    } catch (err) {
      req.log.warn({ err }, "Failed to extract document text");
    }
  }

  const [doc] = await db
    .insert(documentsTable)
    .values({
      userId: user.userId,
      clientId: clientId || null,
      caseId: caseId || null,
      title,
      fileName: fileName || null,
      storagePath,
      fileType: fileType || null,
      size: actualSize,
      textContent,
      status: "pending",
    })
    .returning();

  res.status(201).json({ ...doc, fileUrl: getDownloadUrl(req, doc.id) });
});

router.get("/documents/:documentId", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = documentIdSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const accessFilter = documentAccessFilter(user);
  const filter = andFilters(eq(documentsTable.id, params.data.documentId), accessFilter);
  const [doc] = await db.select().from(documentsTable).where(filter);

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.json({ ...doc, fileUrl: getDownloadUrl(req, doc.id) });
});

router.get("/documents/:documentId/download", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = documentIdSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const accessFilter = documentAccessFilter(user);
  const filter = andFilters(eq(documentsTable.id, params.data.documentId), accessFilter);
  const [doc] = await db.select().from(documentsTable).where(filter);

  if (!doc || !doc.storagePath) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const buffer = await readStoredFile(doc.storagePath);
  res.setHeader("Content-Type", doc.fileType || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${doc.fileName || "document"}"`,
  );
  res.send(buffer);
});

router.post("/documents/:documentId/analyze", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = documentIdSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const accessFilter = documentAccessFilter(user);
  const filter = andFilters(eq(documentsTable.id, params.data.documentId), accessFilter);
  const [doc] = await db.select().from(documentsTable).where(filter);

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  if (!doc.textContent) {
    res.status(400).json({ error: "Document has no text content to analyze" });
    return;
  }

  try {
    const result = await analyzeDocument(doc.textContent);
    const [updated] = await db
      .update(documentsTable)
      .set({ aiSummary: JSON.stringify(result), status: "analyzed" })
      .where(eq(documentsTable.id, doc.id))
      .returning();

    res.json({ ...result, documentId: updated.id, status: updated.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    req.log.error({ err: message }, "Document analysis failed");
    await db
      .update(documentsTable)
      .set({ status: "error" })
      .where(eq(documentsTable.id, doc.id));
    res.status(500).json({ error: "Analysis failed" });
  }
});

router.post("/documents/:documentId/ask", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = documentIdSchema.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { question } = req.body as { question?: string };
  if (!question?.trim()) { res.status(400).json({ error: "question is required" }); return; }

  const { getAIClient, MODEL } = await import("../lib/ai.js");
  const ai = getAIClient();
  if (!ai) { res.status(503).json({ error: "AI не настроен. Укажите OPENAI_API_KEY." }); return; }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.documentId));
  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
  if (!doc.textContent) { res.status(400).json({ error: "Документ не содержит текста для анализа" }); return; }

  try {
    const completion = await ai.client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "Ты — юридический AI-ассистент. Отвечай на вопросы по тексту документа точно и по делу, на русском языке. Если ответа в документе нет — так и скажи.",
        },
        {
          role: "user",
          content: `Документ:\n\n${doc.textContent.slice(0, 14000)}\n\n---\nВопрос: ${question}`,
        },
      ],
      max_completion_tokens: 800,
    });
    const answer = completion.choices[0]?.message?.content?.trim() || "Ответ не получен";
    res.json({ answer });
  } catch (err) {
    req.log.error({ err: err instanceof Error ? err.message : err }, "Document Q&A failed");
    res.status(500).json({ error: "Не удалось получить ответ" });
  }
});

router.delete("/documents/:documentId", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user || !isSuperRole(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const params = documentIdSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.documentId));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  if (doc.storagePath) {
    try {
      await deleteStoredFile(doc.storagePath);
    } catch (err) {
      req.log.warn({ err }, "Failed to delete stored file");
    }
  }

  await db.delete(documentsTable).where(eq(documentsTable.id, doc.id));
  res.sendStatus(204);
});

export default router;
