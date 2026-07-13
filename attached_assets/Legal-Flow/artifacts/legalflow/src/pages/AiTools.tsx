import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  MessageSquare,
  FileText,
  HelpCircle,
  CalendarClock,
  Send,
  Upload,
  CheckCheck,
  ChevronRight,
  AlertTriangle,
  FileQuestion,
  Clock,
  History,
  Trash2,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { Shell } from '@/components/layout/Shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useT } from '@/lib/i18n';
import { useAnalyzeIntake, type IntakeAnalysis, type TaskPriority } from '@workspace/api-client-react';
import { analyzeIntake } from '@/lib/ai';
import type { AiAnalysis } from '@/types';
import { addAiHistoryItem, getAiHistory, clearAiHistory, type AiHistoryItem } from '@/lib/storage';
import { useTasks } from '@/hooks/use-tasks';

// ── helpers ──────────────────────────────────────────────────────────────────

async function aiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function priorityColor(priority?: string | null): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (priority) {
    case 'urgent':
      return 'destructive';
    case 'high':
      return 'default';
    case 'low':
      return 'outline';
    default:
      return 'secondary';
  }
}

function priorityLabel(t: ReturnType<typeof useT>, priority?: string | null): string | undefined {
  if (!priority) return undefined;
  return t.ai.priorityLabels[priority as keyof typeof t.ai.priorityLabels] ?? priority;
}

function toIntakeAnalysis(fallback: AiAnalysis): IntakeAnalysis {
  return {
    summary: fallback.summary ?? '',
    category: fallback.category,
    type: fallback.type,
    priority: fallback.priority ?? null,
    risks: fallback.risks,
    questions: fallback.questions,
    documents: fallback.documents,
    nextAction: fallback.nextAction,
  };
}

function useAiHistory() {
  const [history, setHistory] = useState<AiHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getAiHistory());
  }, []);

  const add = useCallback((item: AiHistoryItem) => {
    addAiHistoryItem(item);
    setHistory((prev) => [item, ...prev.slice(0, 49)]);
  }, []);

  const clear = useCallback(() => {
    clearAiHistory();
    setHistory([]);
  }, []);

  return { history, add, clear };
}

// ── scenario cards ───────────────────────────────────────────────────────────

type ScenarioId = 'intake' | 'document' | 'questions' | 'deadlines';

interface Scenario {
  id: ScenarioId;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SCENARIOS: Scenario[] = [
  { id: 'intake', icon: MessageSquare, color: 'bg-blue-500/10 text-blue-600' },
  { id: 'document', icon: FileText, color: 'bg-amber-500/10 text-amber-600' },
  { id: 'questions', icon: HelpCircle, color: 'bg-violet-500/10 text-violet-600' },
  { id: 'deadlines', icon: CalendarClock, color: 'bg-emerald-500/10 text-emerald-600' },
];

// ── panels ───────────────────────────────────────────────────────────────────

interface IntakePanelProps {
  onHistory: (item: AiHistoryItem) => void;
}

function IntakePanel({ onHistory }: IntakePanelProps) {
  const t = useT();
  const [text, setText] = useState('');
  const [result, setResult] = useState<IntakeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  const analyzeMutation = useAnalyzeIntake({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
        setError(null);
        setUsedFallback(false);
        onHistory({
          id: generateId(),
          type: 'intake',
          title: data.category || t.aiAssistant.scenarios.intake.title,
          subtitle: data.summary,
          createdAt: new Date().toISOString(),
        });
      },
      onError: (err) => {
        const fallback = toIntakeAnalysis(analyzeIntake(text));
        setResult(fallback);
        setError(err.message || 'AI analysis failed');
        setUsedFallback(true);
        onHistory({
          id: generateId(),
          type: 'intake',
          title: fallback.category || t.aiAssistant.scenarios.intake.title,
          subtitle: fallback.summary,
          createdAt: new Date().toISOString(),
        });
      },
    },
  });

  const isAnalyzing = analyzeMutation.isPending;

  const handleAnalyze = () => {
    if (!text.trim()) return;
    setError(null);
    setResult(null);
    setUsedFallback(false);
    analyzeMutation.mutate({ data: { description: text } });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Textarea
          placeholder={t.aiAssistant.scenarios.intake.inputPlaceholder}
          className="min-h-[140px] resize-none border-primary/20 focus-visible:ring-primary/30 bg-muted/30"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button onClick={handleAnalyze} disabled={isAnalyzing || !text.trim()} className="w-full sm:w-auto">
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-pulse" /> {t.aiAssistant.analyzing}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" /> {t.aiAssistant.scenarios.intake.analyze}
            </span>
          )}
        </Button>
      </div>

      {error && !isAnalyzing && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {usedFallback && !isAnalyzing && (
        <div className="bg-chart-2/10 text-chart-2 border border-chart-2/20 rounded-md p-2 text-xs flex items-start gap-2">
          <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{t.aiAssistant.fallbackNotice}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {result && !isAnalyzing && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border bg-card p-5 shadow-sm space-y-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {result.category}
              </Badge>
              {result.type && (
                <Badge variant="outline" className="text-muted-foreground">
                  {result.type}
                </Badge>
              )}
              {result.priority && (
                <Badge variant={priorityColor(result.priority)}>
                  {priorityLabel(t, result.priority)}
                </Badge>
              )}
            </div>

            <ResultSection
              icon={FileQuestion}
              title={t.aiAssistant.result.summary}
              items={result.summary ? [result.summary] : []}
              single
            />
            <ResultSection
              icon={AlertTriangle}
              title={t.aiAssistant.result.risks}
              items={result.risks}
            />
            <ResultSection
              icon={HelpCircle}
              title={t.aiAssistant.result.questions}
              items={result.questions}
              numbered
            />
            <ResultSection
              icon={FileText}
              title={t.aiAssistant.result.documents}
              items={result.documents}
            />
            <ResultSection
              icon={Sparkles}
              title={t.aiAssistant.result.nextAction}
              items={result.nextAction ? [result.nextAction] : []}
              single
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface QuestionsPanelProps {
  onHistory: (item: AiHistoryItem) => void;
}

function QuestionsPanel({ onHistory }: QuestionsPanelProps) {
  const t = useT();
  const [text, setText] = useState('');
  const [result, setResult] = useState<IntakeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  const analyzeMutation = useAnalyzeIntake({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
        setError(null);
        setUsedFallback(false);
        onHistory({
          id: generateId(),
          type: 'questions',
          title: t.aiAssistant.scenarios.questions.title,
          subtitle: data.category,
          createdAt: new Date().toISOString(),
        });
      },
      onError: (err) => {
        const fallback = toIntakeAnalysis(analyzeIntake(text));
        setResult(fallback);
        setError(err.message || 'AI analysis failed');
        setUsedFallback(true);
        onHistory({
          id: generateId(),
          type: 'questions',
          title: t.aiAssistant.scenarios.questions.title,
          subtitle: fallback.category,
          createdAt: new Date().toISOString(),
        });
      },
    },
  });

  const isAnalyzing = analyzeMutation.isPending;

  const handleGenerate = () => {
    if (!text.trim()) return;
    setError(null);
    setResult(null);
    setUsedFallback(false);
    analyzeMutation.mutate({ data: { description: text } });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Textarea
          placeholder={t.aiAssistant.scenarios.questions.inputPlaceholder}
          className="min-h-[140px] resize-none border-violet-500/20 focus-visible:ring-violet-500/30 bg-muted/30"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button onClick={handleGenerate} disabled={isAnalyzing || !text.trim()} className="w-full sm:w-auto">
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-pulse" /> {t.aiAssistant.analyzing}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" /> {t.aiAssistant.scenarios.questions.generate}
            </span>
          )}
        </Button>
      </div>

      {error && !isAnalyzing && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {usedFallback && !isAnalyzing && (
        <div className="bg-chart-2/10 text-chart-2 border border-chart-2/20 rounded-md p-2 text-xs flex items-start gap-2">
          <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{t.aiAssistant.fallbackNotice}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {result && !isAnalyzing && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border bg-card p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <HelpCircle className="h-4 w-4 text-violet-600" />
              </div>
              <h3 className="font-semibold">{t.aiAssistant.scenarios.questions.resultTitle}</h3>
              {result.category && (
                <Badge variant="outline" className="ml-auto">
                  {result.category}
                </Badge>
              )}
            </div>
            <ResultSection icon={HelpCircle} title={t.aiAssistant.result.questions} items={result.questions} numbered />
            {result.documents.length > 0 && (
              <ResultSection icon={FileText} title={t.aiAssistant.result.documents} items={result.documents} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DocumentPanelProps {
  onHistory: (item: AiHistoryItem) => void;
}

interface DocumentItem {
  id: string;
  title: string;
  fileName?: string | null;
  textContent?: string | null;
  aiSummary?: string | null;
  createdAt: string;
}

interface DocumentAnalysis {
  summary: string;
  risks: string[];
  disputedClauses: string[];
}

function DocumentPanel({ onHistory }: DocumentPanelProps) {
  const t = useT();
  const [mode, setMode] = useState<'upload' | 'existing'>('upload');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DocumentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzedDocTitle, setAnalyzedDocTitle] = useState('');

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const loadDocs = useCallback(async () => {
    if (docsLoaded) return;
    try {
      const res = await fetch('/api/documents', { credentials: 'same-origin' });
      if (res.ok) {
        const data = (await res.json()) as DocumentItem[];
        setDocs(data.filter((d) => d.textContent));
      }
    } catch {
      // ignore
    }
    setDocsLoaded(true);
  }, [docsLoaded]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('Файл превышает 10 МБ');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
        reader.readAsDataURL(file);
      });
      const fileBase64 = base64.split(',')[1];
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: title.trim(),
          fileName: file.name,
          fileType: file.type,
          size: file.size,
          fileBase64,
        }),
      });
      if (!res.ok) throw new Error(t.documents.errorUpload);
      const created = (await res.json()) as DocumentItem;
      setDocs((prev) => [created, ...prev]);
      setSelectedDocId(created.id);
      setMode('existing');
      setTitle('');
      setFile(null);
      void analyzeDocument(created.id, created.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.documents.errorUpload);
    } finally {
      setUploading(false);
    }
  };

  const analyzeDocument = async (docId: string, docTitle?: string) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/documents/${docId}/analyze`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error(t.documents.errorAnalyze);
      const updated = (await res.json()) as DocumentItem;
      if (!updated.aiSummary) throw new Error(t.documents.errorAnalyze);
      const parsed: DocumentAnalysis = JSON.parse(updated.aiSummary);
      setResult(parsed);
      setAnalyzedDocTitle(docTitle || updated.title || t.aiAssistant.scenarios.document.title);
      onHistory({
        id: generateId(),
        type: 'document',
        title: docTitle || updated.title || t.aiAssistant.scenarios.document.title,
        subtitle: parsed.summary,
        createdAt: new Date().toISOString(),
      });
      setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.documents.errorAnalyze);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeExisting = () => {
    if (!selectedDocId) return;
    const doc = docs.find((d) => d.id === selectedDocId);
    void analyzeDocument(selectedDocId, doc?.title);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Button
          variant={mode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('upload')}
        >
          <Upload className="h-4 w-4 mr-2" /> {t.documents.upload}
        </Button>
        <Button
          variant={mode === 'existing' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setMode('existing');
            void loadDocs();
          }}
        >
          <FileText className="h-4 w-4 mr-2" /> {t.aiAssistant.scenarios.document.selectDoc}
        </Button>
      </div>

      {mode === 'upload' ? (
        <form onSubmit={handleUpload} className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t.documents.titleLabel}</Label>
            <Input
              placeholder={t.aiAssistant.scenarios.document.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.documents.fileLabel}</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md,.rtf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">{t.aiAssistant.scenarios.document.filePlaceholder}</p>
          </div>
          <Button
            type="submit"
            disabled={uploading || analyzing || !title.trim() || !file}
            className="w-full sm:w-auto"
          >
            {uploading || analyzing ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse" /> {t.aiAssistant.analyzing}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> {t.aiAssistant.scenarios.document.analyze}
              </span>
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t.aiAssistant.scenarios.document.selectDoc}</Label>
            <Select value={selectedDocId} onValueChange={setSelectedDocId} onOpenChange={loadDocs}>
              <SelectTrigger>
                <SelectValue placeholder={t.aiAssistant.scenarios.document.noDocs} />
              </SelectTrigger>
              <SelectContent>
                {docs.length === 0 && docsLoaded && (
                  <SelectItem value="__none__" disabled>{t.aiAssistant.scenarios.document.noDocs}</SelectItem>
                )}
                {docs.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAnalyzeExisting}
            disabled={analyzing || !selectedDocId || selectedDocId === '__none__'}
            className="w-full sm:w-auto"
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse" /> {t.aiAssistant.analyzing}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> {t.aiAssistant.scenarios.document.analyze}
              </span>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border bg-card p-5 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <FileText className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="font-semibold">{analyzedDocTitle}</h3>
            </div>
            <ResultSection
              icon={Lightbulb}
              title={t.aiAssistant.scenarios.document.recommendations}
              items={result.summary ? [result.summary] : []}
              single
            />
            <ResultSection
              icon={AlertTriangle}
              title={t.aiAssistant.scenarios.document.risks}
              items={result.risks}
            />
            <ResultSection
              icon={FileQuestion}
              title={t.aiAssistant.scenarios.document.disputed}
              items={result.disputedClauses}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── deadline panel ───────────────────────────────────────────────────────────

interface SuggestedTask {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
}

interface DeadlinePanelProps {
  onHistory: (item: AiHistoryItem) => void;
}

function DeadlinePanel({ onHistory }: DeadlinePanelProps) {
  const t = useT();
  const { createTask } = useTasks();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<SuggestedTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Set<number>>(new Set());

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTasks([]);
    setCreated(new Set());
    try {
      const data = await aiPost<{ tasks: SuggestedTask[] }>('/api/ai/suggest-deadlines', {
        category,
        description,
      });
      setTasks(data.tasks || []);
      onHistory({
        id: generateId(),
        type: 'deadlines',
        title: t.aiAssistant.scenarios.deadlines.title,
        subtitle: category || description.slice(0, 60),
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (task: SuggestedTask, idx: number) => {
    const ok = await createTask({
      title: task.title,
      description: task.description || null,
      priority: (task.priority as TaskPriority) || 'medium',
      dueDate: task.dueDate || null,
      status: 'pending',
    });
    if (ok) setCreated((prev) => new Set(prev).add(idx));
  };

  const PRIORITY_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    urgent: 'destructive',
    high: 'default',
    medium: 'secondary',
    low: 'outline',
  };

  const PRIORITY_LABELS: Record<string, string> = {
    urgent: 'Срочный',
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
  };

  return (
    <div className="space-y-5">
      <form onSubmit={run} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t.aiAssistant.scenarios.deadlines.category}</Label>
            <Input
              placeholder="Например: Семейное право"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.aiAssistant.scenarios.deadlines.descriptionLabel}</Label>
            <Input
              placeholder="Кратко о сути дела..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit" disabled={loading || (!category && !description)} className="w-full sm:w-auto">
          {loading ? (
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-pulse" /> {t.aiAssistant.analyzing}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> {t.aiAssistant.scenarios.deadlines.run}
            </span>
          )}
        </Button>
      </form>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {tasks.length > 0 && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {tasks.map((task, idx) => (
              <Card key={idx} className="border-dashed">
                <CardContent className="p-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{task.title}</span>
                      {task.priority && (
                        <Badge variant={PRIORITY_COLORS[task.priority] ?? 'outline'} className="text-xs">
                          {PRIORITY_LABELS[task.priority] ?? task.priority}
                        </Badge>
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(task.dueDate + 'T12:00:00').toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={created.has(idx) ? 'outline' : 'default'}
                    className="shrink-0"
                    onClick={() => handleCreateTask(task, idx)}
                    disabled={created.has(idx)}
                  >
                    {created.has(idx) ? (
                      <><CheckCheck className="h-3.5 w-3.5 mr-1" /> {t.aiAssistant.scenarios.deadlines.created}</>
                    ) : (
                      <><ChevronRight className="h-3.5 w-3.5 mr-1" /> {t.aiAssistant.scenarios.deadlines.createTask}</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── result section component ─────────────────────────────────────────────────

interface ResultSectionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
  single?: boolean;
  numbered?: boolean;
}

function ResultSection({ icon: Icon, title, items, single, numbered }: ResultSectionProps) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h4>
      {single ? (
        <p className="text-sm text-foreground leading-relaxed">{items[0]}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              {numbered ? (
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-medium flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
              ) : (
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              )}
              <span className="text-foreground leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── history panel ────────────────────────────────────────────────────────────

interface HistoryPanelProps {
  history: AiHistoryItem[];
  onClear: () => void;
}

function HistoryPanel({ history, onClear }: HistoryPanelProps) {
  const t = useT();
  const [expanded, setExpanded] = useState(true);

  const typeIcon: Record<ScenarioId, React.ComponentType<{ className?: string }>> = {
    intake: MessageSquare,
    document: FileText,
    questions: HelpCircle,
    deadlines: CalendarClock,
  };

  const typeLabel: Record<ScenarioId, string> = {
    intake: t.aiAssistant.scenarios.intake.title,
    document: t.aiAssistant.scenarios.document.title,
    questions: t.aiAssistant.scenarios.questions.title,
    deadlines: t.aiAssistant.scenarios.deadlines.title,
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <History className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">{t.aiAssistant.history}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded((v) => !v)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t.aiAssistant.historyEmpty}</p>
          ) : (
            <ul className="space-y-2">
              {history.slice(0, 10).map((item) => {
                const Icon = typeIcon[item.type];
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-1.5 bg-muted rounded-md shrink-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.subtitle}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(parseISO(item.createdAt), { locale: ru, addSuffix: true })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export function AiTools() {
  const t = useT();
  const { history, add, clear } = useAiHistory();
  const [active, setActive] = useState<ScenarioId>('intake');

  const activeScenario = SCENARIOS.find((s) => s.id === active)!;
  const ActiveIcon = activeScenario.icon;

  return (
    <Shell>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.aiAssistant.title}</h1>
              <p className="text-muted-foreground text-sm">{t.aiAssistant.subtitle}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {SCENARIOS.map((scenario) => {
              const Icon = scenario.icon;
              const isActive = active === scenario.id;
              const scenarioT = t.aiAssistant.scenarios[scenario.id];
              return (
                <Card
                  key={scenario.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isActive ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.03]' : 'hover:border-primary/30'
                  }`}
                  onClick={() => setActive(scenario.id)}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${scenario.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {scenarioT.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{scenarioT.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="min-h-[420px] shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${activeScenario.color}`}>
                  <ActiveIcon className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t.aiAssistant.scenarios[active].title}</CardTitle>
                  <CardDescription>{t.aiAssistant.scenarios[active].description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {active === 'intake' && <IntakePanel onHistory={add} />}
              {active === 'document' && <DocumentPanel onHistory={add} />}
              {active === 'questions' && <QuestionsPanel onHistory={add} />}
              {active === 'deadlines' && <DeadlinePanel onHistory={add} />}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-24">
            <HistoryPanel history={history} onClear={clear} />
          </div>
        </div>
      </div>
    </Shell>
  );
}
