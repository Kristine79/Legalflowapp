import { useMemo } from 'react';
import { Inbox, Clock, CalendarDays, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UseClientsReturn } from '@/hooks/use-clients';
import { t } from '@/lib/i18n';
import { isAfter, parseISO, startOfDay, differenceInDays } from 'date-fns';
import type { Task } from '@workspace/api-client-react';

interface StatCardsProps {
  clients: UseClientsReturn['clients'];
  tasks?: Task[];
}

export function StatCards({ clients, tasks = [] }: StatCardsProps) {
  const newToday = useMemo(() => {
    const today = startOfDay(new Date());
    return clients.filter((c) => c.status === 'new' && isAfter(parseISO(c.createdAt), today)).length;
  }, [clients]);

  const activeCases = useMemo(() => {
    return clients.filter((c) => c.status !== 'closed').length;
  }, [clients]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (!t.dueDate || t.status === 'done' || t.status === 'cancelled') return false;
      const due = parseISO(t.dueDate);
      return isAfter(due, now) && differenceInDays(due, now) <= 7;
    }).length;
  }, [tasks]);

  const waitingDocuments = useMemo(() => {
    return clients.filter((c) => c.status === 'waiting').length;
  }, [clients]);

  const stats = [
    { label: t.stats.newToday, value: newToday, icon: Inbox, color: 'text-chart-2' },
    { label: t.stats.activeCases, value: activeCases, icon: Clock, color: 'text-primary' },
    { label: t.stats.upcomingDeadlines, value: upcomingDeadlines, icon: CalendarDays, color: 'text-chart-4' },
    { label: t.stats.waitingDocuments, value: waitingDocuments, icon: FileQuestion, color: 'text-chart-5' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            <stat.icon className={`h-4 w-4 opacity-80 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
