import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, clientsTable } from "@workspace/db";
import {
  ListClientsResponse,
  CreateClientBody,
  CreateClientResponse,
  GetClientParams,
  GetClientResponse,
  UpdateClientParams,
  UpdateClientBody,
  UpdateClientResponse,
  DeleteClientParams,
} from "@workspace/api-zod";
import { getAuthUser } from "../lib/auth";
import { canCreateClients, canDeleteClients, clientAccessFilter, andFilters } from "../lib/rbac";

const router: IRouter = Router();

router.get("/clients", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const filter = clientAccessFilter(user);
  const query = db.select().from(clientsTable).orderBy(desc(clientsTable.createdAt));
  const clients = filter ? await query.where(filter) : await query;
  res.json(ListClientsResponse.parse(clients));
});

router.post("/clients", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user || !canCreateClients(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid client body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  req.log.info("Creating client");
  const [client] = await db
    .insert(clientsTable)
    .values({ ...parsed.data, userId: user.userId })
    .returning();
  res.status(201).json(CreateClientResponse.parse(client));
});

router.get("/clients/:clientId", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const filter = andFilters(eq(clientsTable.id, params.data.clientId), clientAccessFilter(user));
  const [client] = await db.select().from(clientsTable).where(filter);

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(GetClientResponse.parse(client));
});

router.patch("/clients/:clientId", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user || !canCreateClients(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid client update body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const filter = andFilters(eq(clientsTable.id, params.data.clientId), clientAccessFilter(user));
  const [client] = await db
    .update(clientsTable)
    .set(parsed.data)
    .where(filter)
    .returning();

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(UpdateClientResponse.parse(client));
});

router.delete("/clients/:clientId", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user || !canDeleteClients(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const params = DeleteClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const filter = andFilters(eq(clientsTable.id, params.data.clientId), clientAccessFilter(user));
  const [client] = await db
    .delete(clientsTable)
    .where(filter)
    .returning();

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
