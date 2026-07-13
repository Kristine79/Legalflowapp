import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, clientsTable } from "@workspace/db";
import { GetDashboardStatsResponse } from "@workspace/api-zod";
import { getAuthUser } from "../lib/auth";
import { clientAccessFilter } from "../lib/rbac";

const router: IRouter = Router();

router.get("/analytics", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const filter = clientAccessFilter(user);
  const query = db.select().from(clientsTable);
  const clients = filter ? await query.where(filter) : await query;

  const totalClients = clients.length;
  const statusCounts = new Map<string, number>();
  for (const client of clients) {
    statusCounts.set(client.status, (statusCounts.get(client.status) ?? 0) + 1);
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const newToday = clients.filter((c) => c.createdAt >= startOfToday).length;
  const inProgress = statusCounts.get("in-progress") ?? 0;
  const closed = statusCounts.get("closed") ?? 0;

  const weeklyTrend: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const count = clients.filter((c) => c.createdAt >= day && c.createdAt < nextDay).length;
    weeklyTrend.push({ date: day.toISOString().slice(0, 10), count });
  }

  const stats = {
    totalClients,
    newToday,
    inProgress,
    closed,
    statusBreakdown: Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    })),
    weeklyTrend,
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

export default router;
