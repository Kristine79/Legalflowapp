import { useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Gavel,
  Users,
  FileClock,
  Bell,
  CheckSquare,
  Trash2,
  Pencil,
  Clock,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import {
  getCalendarEvents,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type CustomCalendarEvent,
  type CalendarEventType,
} from '@/lib/storage';

type BackendCalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: string;
  status: string;
  priority: string | null;
  clientId: string | null;
  caseId: string | null;
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: CalendarEventType | 'task' | 'case';
  status?: string | null;
  priority?: string | null;
  client?: string | null;
  comment?: string | null;
  source: 'backend' | 'local';
};

const EVENT_TYPES: CalendarEventType[] = ['court', 'meeting', 'deadline', 'reminder', 'task'];

const EVENT_META: Record<CalendarEventType | 'task' | 'case', { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; bgLight: string; labelKey: CalendarEventType }> = {
  court: { icon: Gavel, color: 'text-red-600', bg: 'bg-red-500', bgLight: 'bg-red-500/10', labelKey: 'court' },
  meeting: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-500', bgLight: 'bg-blue-500/10', labelKey: 'meeting' },
  deadline: { icon: FileClock, color: 'text-amber-600', bg: 'bg-amber-500', bgLight: 'bg-amber-500/10', labelKey: 'deadline' },
  reminder: { icon: Bell, color: 'text-violet-600', bg: 'bg-violet-500', bgLight: 'bg-violet-500/10', labelKey: 'reminder' },
  task: { icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', labelKey: 'task' },
  case: { icon: CalendarDays, color: 'text-primary', bg: 'bg-primary', bgLight: 'bg-primary/10', labelKey: 'task' },
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  'in-progress': 'default',
  done: 'outline',
  cancelled: 'destructive',
};

const WEEK_DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEK_DAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function parseDateInput(value: string): Date {
  return new Date(value + 'T12:00:00');
}

export function Calendar() {
  const t = useT();
  const isRu = t.app.brandName === 'LegalFlow' && t.calendar.noEvents === 'На сегодня событий нет';
  const weekDays = isRu ? WEEK_DAYS_RU : WEEK_DAYS_EN;
  const months = isRu ? MONTHS_RU : undefined;

  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(isoDate(today));
  const [backendEvents, setBackendEvents] = useState<BackendCalendarEvent[]>([]);
  const [localEvents, setLocalEvents] = useState<CustomCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CustomCalendarEvent | null>(null);

  const [form, setForm] = useState({
    title: '',
    client: '',
    date: selectedDate,
    type: 'court' as CalendarEventType,
    comment: '',
  });

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear((y) => y - 1); setCurrentMonth(11); }
    else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear((y) => y + 1); setCurrentMonth(0); }
    else setCurrentMonth((m) => m + 1);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(isoDate(today));
  };

  useEffect(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const from = isoDate(firstDay);
    const to = isoDate(lastDay);

    setLoading(true);
    fetch(`/api/calendar?from=${from}&to=${to}`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: BackendCalendarEvent[]) => setBackendEvents(data))
      .catch(() => setBackendEvents([]))
      .finally(() => setLoading(false));
  }, [currentYear, currentMonth]);

  useEffect(() => {
    setLocalEvents(getCalendarEvents());
  }, []);

  const events: CalendarEvent[] = useMemo(() => {
    const mappedBackend: CalendarEvent[] = backendEvents.map((ev) => ({
      ...ev,
      type: (ev.type as CalendarEvent['type']) || 'task',
      source: 'backend' as const,
    }));
    const mappedLocal: CalendarEvent[] = localEvents.map((ev) => ({
      id: ev.id,
      title: ev.title,
      date: ev.date,
      type: ev.type,
      client: ev.client,
      comment: ev.comment,
      source: 'local' as const,
    }));
    return [...mappedBackend, ...mappedLocal];
  }, [backendEvents, localEvents]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(currentYear, currentMonth, 1);
    let startDow = firstOfMonth.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [currentYear, currentMonth]);

  const selectedEvents = eventsByDate[selectedDate] ?? [];

  const monthLabel = months
    ? `${months[currentMonth]} ${currentYear}`
    : new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const openCreate = () => {
    setEditingEvent(null);
    setForm({
      title: '',
      client: '',
      date: selectedDate,
      type: 'court',
      comment: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (event: CustomCalendarEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      client: event.client,
      date: event.date,
      type: event.type,
      comment: event.comment,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.date) return;
    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, {
        title: form.title.trim(),
        client: form.client.trim(),
        date: form.date,
        type: form.type,
        comment: form.comment.trim(),
      });
    } else {
      addCalendarEvent({
        title: form.title.trim(),
        client: form.client.trim(),
        date: form.date,
        type: form.type,
        comment: form.comment.trim(),
      });
    }
    setLocalEvents(getCalendarEvents());
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm(t.calendar.delete)) return;
    deleteCalendarEvent(id);
    setLocalEvents(getCalendarEvents());
  };

  const priorityLabel = (p: string | null | undefined) => {
    if (!p) return null;
    const map: Record<string, string> = {
      low: t.tasks.priorities.low,
      medium: t.tasks.priorities.medium,
      high: t.tasks.priorities.high,
      urgent: t.tasks.priorities.urgent,
    };
    return map[p] ?? p;
  };

  const statusLabel = (s: string | null | undefined) => {
    if (!s) return null;
    const map: Record<string, string> = {
      pending: t.tasks.statuses.pending,
      'in-progress': t.tasks.statuses.inProgress,
      done: t.tasks.statuses.done,
      cancelled: t.tasks.statuses.cancelled,
    };
    return map[s] ?? s;
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.calendar.title}</h1>
            <p className="text-muted-foreground">{t.calendar.subtitle}</p>
          </div>
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" /> {t.calendar.addEvent}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{monthLabel}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={goToToday} className="h-8 px-2 text-xs">
                    {t.calendar.today}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground mb-2">
                {weekDays.map((d) => <div key={d} className="py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === isoDate(today);
                  const isSelected = dateStr === selectedDate;
                  const dayEvents = eventsByDate[dateStr] ?? [];

                  const typeGroups = dayEvents.reduce((acc, ev) => {
                    const type = EVENT_META[ev.type] ? ev.type : 'task';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className={`
                        relative flex flex-col items-center rounded-lg p-1.5 text-sm transition-colors min-h-[52px]
                        ${isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-primary/10 font-semibold' : 'hover:bg-accent'}
                      `}
                    >
                      <span>{day}</span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                          {Object.entries(typeGroups).slice(0, 4).map(([type, count]) => {
                            const meta = EVENT_META[type as CalendarEventType | 'task' | 'case'];
                            return (
                              <span
                                key={type}
                                className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/80' : meta.bg}`}
                                title={`${String(meta.labelKey)}: ${count}`}
                              />
                            );
                          })}
                          {Object.keys(typeGroups).length > 4 && (
                            <span className={`text-[9px] leading-none ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              +{Object.keys(typeGroups).length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {loading && (
                <p className="text-center text-xs text-muted-foreground mt-3">{t.ui.loading}…</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-1" /> {t.calendar.addEvent}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedEvents.length === 0 ? (
                <div className="text-center py-10">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <CalendarDays className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">{t.calendar.noEvents}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t.calendar.noEventsDescription}</p>
                  <Button onClick={openCreate} className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" /> {t.calendar.addEvent}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((ev) => {
                    const type = (EVENT_META[ev.type] ? ev.type : 'task') as CalendarEventType | 'task' | 'case';
                    const meta = EVENT_META[type];
                    const Icon = meta.icon;
                    return (
                      <div key={ev.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${meta.bgLight}`}>
                            <Icon className={`h-4 w-4 ${meta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${ev.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                              {ev.title}
                            </p>
                            {ev.client && (
                              <p className="text-xs text-muted-foreground">{ev.client}</p>
                            )}
                            {ev.comment && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.comment}</p>
                            )}
                          </div>
                          {ev.source === 'local' && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  const localEvent = localEvents.find((e) => e.id === ev.id);
                                  if (localEvent) openEdit(localEvent);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(ev.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className={`text-xs ${meta.color} border-current/30 ${meta.bgLight}`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {t.calendar.types[meta.labelKey]}
                          </Badge>
                          {ev.status && (
                            <Badge variant={STATUS_VARIANT[ev.status] ?? 'secondary'} className="text-xs">
                              {statusLabel(ev.status)}
                            </Badge>
                          )}
                          {ev.priority && (
                            <Badge variant="outline" className="text-xs">
                              {priorityLabel(ev.priority)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? t.calendar.editEvent : t.calendar.createEvent}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t.calendar.fields.title}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={t.calendar.fields.titlePlaceholder}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t.calendar.fields.client}</Label>
                <Input
                  value={form.client}
                  onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                  placeholder={t.calendar.fields.clientPlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.calendar.fields.date}</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t.calendar.fields.type}</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as CalendarEventType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const TypeIcon = EVENT_META[type].icon;
                          return <TypeIcon className={`h-4 w-4 ${EVENT_META[type].color}`} />;
                        })()}
                        {t.calendar.types[type]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.calendar.fields.comment}</Label>
              <Textarea
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder={t.calendar.fields.commentPlaceholder}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.calendar.cancel}
            </Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || !form.date}>
              {t.calendar.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
