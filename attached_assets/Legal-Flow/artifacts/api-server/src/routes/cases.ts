import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, casesTable } from "@workspace/db";
import {
  ListCasesResponse,
  CreateCaseBody,
  CreateCaseResponse,
  GetCaseParams,
  GetCaseResponse,
  UpdateCaseParams,
  UpdateCaseBody,
  UpdateCaseResponse,
  DeleteCaseParams,
} from "@workspace/api-zod";
import { getAuthUser } from "../lib/auth";
import { canCreateCases, canDeleteCases, caseAccessFilter, andFilters } from "../lib/rbac";

function generateCaseNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `C-${timestamp}-${random}`;
}

const router: IRouter = Router();

router.get("/cases", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const filter = caseAccessFilter(user);
  const query = db.select().from(casesTable).orderBy(desc(casesTable.createdAt));
  const cases = filter ? await query.where(filter) : await query;
  res.json(ListCasesResponse.parse(cases));
});

router.post("/cases", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user || !canCreateCases(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = CreateCaseBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid case body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const caseNumber = parsed.data.caseNumber || generateCaseNumber();
  req.log.info({ caseNumber }, "Creating case");
  const [caseItem] = await db
    .insert(casesTable)
    .values({ ...parsed.data, caseNumber, userId: user.userId })
    .returning();
  res.status(201).json(CreateCaseResponse.parse(caseItem));
});

router.get("/cases/:caseId", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetCaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const filter = andFilters(eq(casesTable.id, params.data.caseId), caseAccessFilter(user));
  const [caseItem] = await db.select().from(casesTable).where(filter);

  if (!caseItem) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  res.json(GetCaseResponse.parse(caseItem));
});

router.patch("/cases/:caseId", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateCaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCaseBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid case update body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const filter = andFilters(eq(casesTable.id, params.data.caseId), caseAccessFilter(user));
  const [caseItem] = await db
    .update(casesTable)
    .set(parsed.data)
    .where(filter)
    .returning();

  if (!caseItem) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  res.json(UpdateCaseResponse.parse(caseItem));
});

router.delete("/cases/:caseId", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user || !canDeleteCases(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const params = DeleteCaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const filter = andFilters(eq(casesTable.id, params.data.caseId), caseAccessFilter(user));
  const [caseItem] = await db
    .delete(casesTable)
    .where(filter)
    .returning();

  if (!caseItem) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
