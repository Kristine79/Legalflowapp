import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  Inbox,
  Clock,
  CheckCircle2,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  CalendarDays,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react';
import { format, formatDistanceToNow, isAfter, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { Link } from 'wouter';
import { useGetDashboardStats, type DashboardStats, type Task } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FunnelChart } from './FunnelChart';
import { t } from '@/lib/i18n';
import type { ClientWithAi } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  new: 'hsl(var(--chart-1))',
  'in-progress': 'hsl(var(--chart-2))',
  waiting: 'hsl(var(--chart-3))',
  closed: 'hsl(var(--chart-4))',
};

const STATUS_LABEL_KEY: Record<string, keyof typeof t.analytics.statuses> = {
  new: 'new',
  'in-progress': 'inProgress',
  waiting: 'waiting',
  closed: 'closed',
};

function statusLabel(status: string): string {
  const key = STATUS_LABEL_KEY[status];
  return key ? t.analytics.statuses[key] : status;
}

function shortWeekday(dateIso: string): string {
  const label = format(new Date(dateIso), 'EEEEEE', { locale: ru });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

interface AiInsight {
  icon: React.ReactNode;
  text: string;
  action?: { label: string; href: string };
}

function generateAiInsights(clients: ClientWithAi[], tasks: Task[]): AiInsight[] {
  const insights: AiInsight[] = [];
  const now = new Date();

  const waitingClients = clients.filter((c) => c.status === 'waiting');
  if (waitingClients.length > 0) {
    const client = waitingClients[0];
    insights.push({
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
      text: `Клиент ${client.name} ожидает документы`,
      action: { label: t.analytics.remind, href: '/tasks' },
    });
  }

  const upcomingTasks = tasks
    .filter((t) => t.dueDate && t.status !== 'done' && t.status !== 'cancelled')
    .map((t) => ({ ...t, due: parseISO(t.dueDate!) }))
    .filter((t) => isAfter(t.due, now) && differenceInDays(t.due, now) <= 7)
    .sort((a, b) => a.due.getTime() - b.due.getTime());

  if (upcomingTasks.length > 0) {
    const task = upcomingTasks[0];
    const distance = capitalize(formatDistanceToNow(task.due, { locale: ru, addSuffix: true }));
    insights.push({
      icon: <CalendarDays className="h-4 w-4 text-primary" />,
      text: `${distance} заканчивается срок: ${task.title}`,
      action: { label: t.analytics.createTask, href: '/tasks' },
    });
  }

  const todayStart = startOfDay(now);
  const newToday = clients.filter((c) => c.status === 'new' && isAfter(parseISO(c.createdAt), todayStart));
  if (newToday.length > 0) {
    insights.push({
      icon: <Inbox className="h-4 w-4 text-chart-2" />,
      text: `${newToday.length} ${newToday.length === 1 ? 'новое обращение' : 'новых обращения'} сегодня`,
    });
  }

  const highPriority = clients.filter((c) => c.aiSummary?.priority === 'high' || c.aiSummary?.priority === 'urgent');
  if (highPriority.length > 0) {
    insights.push({
      icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
      text: `${highPriority.length} ${highPriority.length === 1 ? 'дело' : 'дела'} с высоким приоритетом требуют внимания`,
      action: { label: t.clientTable.viewHistory, href: '/tasks' },
    });
  }

  return insights;
}

interface AnalyticsSectionProps {
  /** Pre-computed stats (e.g. for the public demo page). When provided, the live query is skipped. */
  overrideStats?: DashboardStats;
  /** Real clients and tasks for generating actionable AI insights. */
  clients?: ClientWithAi[];
  tasks?: Task[];
}

export function AnalyticsSection({ overrideStats, clients = [], tasks = [] }: AnalyticsSectionProps = {}) {
  const chartHeight = 280;
  const { data: liveStats, isLoading: liveLoading } = useGetDashboardStats({
    query: { queryKey: ['dashboard-stats'], enabled: !overrideStats },
  });
  const stats = overrideStats ?? liveStats;
  const isLoading = overrideStats ? false : liveLoading;

  const analyticStats = [
    { label: t.analytics.totalClients, value: stats?.totalClients ?? 0, icon: Users, color: 'text-primary' },
    { label: t.analytics.newToday, value: stats?.newToday ?? 0, icon: Inbox, color: 'text-chart-2' },
    { label: t.analytics.inProgress, value: stats?.inProgress ?? 0, icon: Clock, color: 'text-primary' },
    { label: t.analytics.closed, value: stats?.closed ?? 0, icon: CheckCircle2, color: 'text-chart-3' },
  ];

  const weeklyData = (stats?.weeklyTrend ?? []).map((point) => ({
    day: shortWeekday(point.date),
    value: point.count,
  }));

  const aiInsights = generateAiInsights(clients, tasks);

  const totalForBreakdown = (stats?.statusBreakdown ?? []).reduce((sum, item) => sum + item.count, 0);
  const statusData = (stats?.statusBreakdown ?? []).map((item) => ({
    name: statusLabel(item.status),
    value: totalForBreakdown > 0 ? Math.round((item.count / totalForBreakdown) * 100) : 0,
    color: STATUS_COLORS[item.status] ?? 'hsl(var(--chart-5))',
  }));

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t.analytics.title}
        </h2>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {analyticStats.map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 opacity-80 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {isLoading ? '—' : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">
                {t.analytics.weeklyTrend}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, bottom: 8, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--card-foreground))',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">
                {t.analytics.statusDistribution}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div
                className="flex items-center justify-center text-sm text-muted-foreground"
                style={{ height: chartHeight }}
              >
                {t.ui.noData}
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '0.5rem',
                        color: 'hsl(var(--card-foreground))',
                      }}
                      formatter={(value: number, name: string) => [`${value}%`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                      <span className="font-medium ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">{t.analytics.funnelTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <FunnelChart />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">{t.analytics.aiInsights}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {aiInsights.length === 0 ? (
              <div className="flex items-start gap-3 text-sm">
                <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-muted-foreground">{t.analytics.aiInsightsEmpty}</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {aiInsights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 shrink-0">{insight.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground">{insight.text}</p>
                      {insight.action && (
                        <Button variant="link" size="sm" className="h-auto p-0" asChild>
                          <Link href={insight.action.href}>{insight.action.label}</Link>
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
