import { useState } from 'react';
import type { TaskInput } from '@workspace/api-client-react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, CheckSquare } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useTasks } from '@/hooks/use-tasks';
import type { Task } from '@workspace/api-client-react';

const STATUS_VALUES = ['pending', 'in-progress', 'done', 'cancelled'] as const;
const PRIORITY_VALUES = ['low', 'medium', 'high', 'urgent'] as const;

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  'in-progress': 'default',
  done: 'outline',
  cancelled: 'destructive',
};

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'outline',
  medium: 'secondary',
  high: 'default',
  urgent: 'destructive',
};

const emptyForm = {
  title: '',
  description: '',
  status: 'pending' as string,
  priority: 'medium' as string,
  dueDate: '',
};

export function Tasks() {
  const t = useT();
  const { tasks, isLoading: loading, createTask, updateTask, deleteTask, toggleStatus } = useTasks();
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingTask(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority ?? 'medium',
      dueDate: task.dueDate ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body: TaskInput = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status as TaskInput['status'],
        priority: (form.priority || null) as TaskInput['priority'],
        dueDate: form.dueDate || null,
      };
      const ok = editingTask
        ? await updateTask(editingTask.id, body)
        : await createTask(body);
      if (!ok) throw new Error(t.ui.error);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.ui.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить задачу?')) return;
    const ok = await deleteTask(id);
    if (!ok) setError(t.ui.error);
  };

  const handleStatusToggle = async (task: Task) => {
    const ok = await toggleStatus(task);
    if (!ok) setError(t.ui.error);
  };

  const filtered = filterStatus === 'all'
    ? tasks
    : tasks.filter((task) => task.status === filterStatus);

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: t.tasks.statuses.pending,
      'in-progress': t.tasks.statuses.inProgress,
      done: t.tasks.statuses.done,
      cancelled: t.tasks.statuses.cancelled,
    };
    return map[s] ?? s;
  };

  const priorityLabel = (p: string | null) => {
    if (!p) return null;
    const map: Record<string, string> = {
      low: t.tasks.priorities.low,
      medium: t.tasks.priorities.medium,
      high: t.tasks.priorities.high,
      urgent: t.tasks.priorities.urgent,
    };
    return map[p] ?? p;
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.tasks.title}</h1>
            <p className="text-muted-foreground">{t.tasks.subtitle}</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t.tasks.newTask}
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', ...STATUS_VALUES].map((s) => (
            <Button
              key={s}
              variant={filterStatus === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(s)}
            >
              {s === 'all' ? 'Все' : statusLabel(s)}
            </Button>
          ))}
        </div>

        {error && <div className="text-destructive text-sm">{error}</div>}

        {loading ? (
          <div className="text-muted-foreground">{t.ui.loading}</div>
        ) : filtered.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">
            <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
            {t.tasks.noTasks}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((task) => (
              <Card key={task.id} className={task.status === 'done' ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(task)}
                        className="mt-0.5 shrink-0 h-5 w-5 rounded border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
                        title={task.status === 'done' ? 'Отметить незавершённой' : 'Отметить выполненной'}
                      >
                        {task.status === 'done' && (
                          <svg className="h-3 w-3 text-primary" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant={STATUS_VARIANT[task.status] ?? 'secondary'}>
                            {statusLabel(task.status)}
                          </Badge>
                          {task.priority && (
                            <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'outline'}>
                              {priorityLabel(task.priority)}
                            </Badge>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              📅 {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(task)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? t.tasks.modal.editTitle : t.tasks.modal.newTitle}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">{t.tasks.columns.title}</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-desc">{t.tasks.modal.description}</Label>
              <Textarea
                id="task-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t.tasks.modal.status}</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t.tasks.modal.priority}</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_VALUES.map((p) => (
                      <SelectItem key={p} value={p}>{priorityLabel(p) ?? p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-due">{t.tasks.modal.dueDate}</Label>
              <Input
                id="task-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                {t.tasks.modal.cancel}
              </Button>
              <Button type="submit" disabled={saving || !form.title.trim()}>
                {saving ? t.ui.loading : t.tasks.modal.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
