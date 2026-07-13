import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  FileText,
  Sparkles,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  FileQuestion,
  Lightbulb,
  Scale,
  Gavel,
  FileSpreadsheet,
  FileCheck,
  FileClock,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { t } from "@/lib/i18n";
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";

type DocumentCategory = "contract" | "agreement" | "court" | "template" | "other";
type DocumentStatus = "pending" | "analyzed" | "error";

interface DocumentItem {
  id: string;
  title: string;
  fileName: string | null;
  fileType: string | null;
  size: number | null;
  status: DocumentStatus | string;
  fileUrl: string;
  aiSummary: string | null;
  textContent: string | null;
  storagePath: string | null;
  createdAt: string;
}

interface AiSummary {
  summary: string;
  risks: string[];
  disputedClauses: string[];
}

interface DocumentStatusMeta {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface DocumentAnalysis {
  hasRisks: boolean;
  hasDisputed: boolean;
  isAnalyzed: boolean;
  summary: string;
  risks: string[];
  disputedClauses: string[];
}

const CATEGORIES: { id: DocumentCategory | "all"; label: keyof typeof t.documents.filters }[] = [
  { id: "all", label: "all" },
  { id: "contract", label: "contracts" },
  { id: "agreement", label: "agreements" },
  { id: "court", label: "courts" },
  { id: "template", label: "templates" },
];

const KEYWORDS: Record<DocumentCategory, string[]> = {
  contract: ["договор", "аренда", "купли", "продажи", "поставки", "подряда", "оказания", "услуг", "контракт", "лизинг", "франшиза"],
  agreement: ["соглашение", "nda", "конфиденциальности", "меморандум", "доп", "соглашение"],
  court: ["иск", "ходатайство", "суд", "претензия", "заявление", "жалоба", "определение", "решение", "протокол", "взыскание"],
  template: ["шаблон", "образец", "бланк", "типовой", "формуляр"],
  other: [],
};

function detectCategory(title: string): DocumentCategory {
  const lower = title.toLowerCase();
  for (const [category, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return category as DocumentCategory;
  }
  return "other";
}

function parseFileExtension(fileName: string | null): string {
  if (!fileName) return "DOC";
  const match = fileName.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toUpperCase() : "DOC";
}

function fileIcon(type: string | null) {
  if (!type) return FileText;
  if (type.includes("pdf")) return FileText;
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) return FileSpreadsheet;
  if (type.includes("word") || type.includes("doc")) return FileCheck;
  return FileText;
}

function parseAiSummary(raw: string | null): DocumentAnalysis {
  if (!raw) {
    return { hasRisks: false, hasDisputed: false, isAnalyzed: false, summary: "", risks: [], disputedClauses: [] };
  }
  try {
    const parsed: AiSummary = JSON.parse(raw);
    return {
      hasRisks: parsed.risks.length > 0,
      hasDisputed: parsed.disputedClauses.length > 0,
      isAnalyzed: true,
      summary: parsed.summary,
      risks: parsed.risks,
      disputedClauses: parsed.disputedClauses,
    };
  } catch {
    return { hasRisks: false, hasDisputed: false, isAnalyzed: false, summary: "", risks: [], disputedClauses: [] };
  }
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Documents() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DocumentCategory | "all">("all");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents?q=${encodeURIComponent(query)}`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(t.documents.errorLoad);
      const data = (await res.json()) as DocumentItem[];
      setDocs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.ui.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDocs();
  }, [query]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Пожалуйста, укажите название документа.");
      return;
    }
    if (!file) {
      setError("Пожалуйста, выберите файл для загрузки.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Файл превышает 10 МБ. Пожалуйста, выберите файл меньшего размера.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
        reader.readAsDataURL(file);
      });
      const fileBase64 = base64.split(",")[1];

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: title.trim(),
          fileName: file.name,
          fileType: file.type,
          size: file.size,
          fileBase64,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Сессия не подтверждена (401). Попробуйте перезайти в аккаунт.");
        }
        throw new Error(t.documents.errorUpload);
      }

      setTitle("");
      setFile(null);
      setShowUpload(false);
      void fetchDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.documents.errorUpload);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async (doc: DocumentItem) => {
    setError(null);
    try {
      const res = await fetch(`/api/documents/${doc.id}/analyze`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(t.documents.errorAnalyze);
      void fetchDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.documents.errorAnalyze);
    }
  };

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      if (filter === "all") return true;
      return detectCategory(doc.title) === filter;
    });
  }, [docs, filter]);

  const activeCount = useMemo(() => {
    return CATEGORIES.reduce((acc, cat) => {
      acc[cat.id] =
        cat.id === "all"
          ? docs.length
          : docs.filter((d) => detectCategory(d.title) === cat.id).length;
      return acc;
    }, {} as Record<string, number>);
  }, [docs]);

  const analysis = selectedDoc ? parseAiSummary(selectedDoc.aiSummary) : null;

  return (
    <Shell searchQuery={query} onSearchChange={setQuery}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.documents.title}</h1>
            <p className="text-muted-foreground">{t.documents.subtitle}</p>
          </div>
          <Button onClick={() => setShowUpload((v) => !v)} className="w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" />
            {showUpload ? t.ui.cancel || "Отмена" : t.documents.upload}
          </Button>
        </div>

        {showUpload && (
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader>
              <CardTitle>{t.documents.uploadTitle}</CardTitle>
              <CardDescription>{t.documents.uploadDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <Label htmlFor="doc-title">{t.documents.titleLabel}</Label>
                  <Input
                    id="doc-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.documents.titlePlaceholder}
                  />
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  <Label htmlFor="doc-file">{t.documents.fileLabel}</Label>
                  <Input
                    id="doc-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.odt,.txt,.md,.rtf"
                    onChange={(e) => {
                      const selected = e.target.files?.[0] || null;
                      if (selected && selected.size > MAX_FILE_SIZE) {
                        setError("Файл превышает 10 МБ. Пожалуйста, выберите файл меньшего размера.");
                        e.target.value = "";
                        setFile(null);
                      } else {
                        setError(null);
                        setFile(selected);
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, ODT, TXT, MD, RTF · до 10 МБ</p>
                </div>
                <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? t.documents.uploading : t.documents.upload}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={filter === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(cat.id)}
              >
                {t.documents.filters[cat.label]}
                <span className="ml-1.5 text-xs opacity-70">({activeCount[cat.id]})</span>
              </Button>
            ))}
          </div>
        </div>

        {error && <div className="text-destructive text-sm">{error}</div>}

        {loading ? (
          <div className="text-muted-foreground">{t.documents.loading}</div>
        ) : filteredDocs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">{t.documents.emptyTitle}</p>
              <p className="text-sm text-muted-foreground max-w-sm">{t.documents.emptyDescription}</p>
              <Button onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4 mr-2" /> {t.documents.emptyUpload}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onAnalyze={handleAnalyze}
                onOpen={() => setSelectedDoc(doc)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <DialogTitle>{t.documents.detail.title}</DialogTitle>
            </div>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedDoc.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {parseFileExtension(selectedDoc.fileName)} · {formatBytes(selectedDoc.size)} ·{" "}
                    {format(new Date(selectedDoc.createdAt), "d MMMM yyyy", { locale: ru })}
                  </p>
                </div>
                <Badge variant={selectedDoc.status === "analyzed" ? "default" : "secondary"}>
                  {selectedDoc.status === "analyzed"
                    ? t.documents.status.analyzed
                    : t.documents.status.pending}
                </Badge>
              </div>

              {analysis && (
                <>
                  {analysis.summary && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        {t.documents.recommendations}
                      </h4>
                      <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                    </div>
                  )}

                  {analysis.risks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        {t.documents.risks}
                      </h4>
                      <ul className="space-y-1.5">
                        {analysis.risks.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.disputedClauses.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Scale className="h-4 w-4 text-primary" />
                        {t.documents.disputedClauses}
                      </h4>
                      <ul className="space-y-1.5">
                        {analysis.disputedClauses.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" asChild>
                  <a href={selectedDoc.fileUrl} download>
                    <Download className="h-4 w-4 mr-2" /> {t.documents.download}
                  </a>
                </Button>
                <Button
                  onClick={() => handleAnalyze(selectedDoc)}
                  disabled={selectedDoc.status === "analyzed" || !selectedDoc.storagePath}
                >
                  <Sparkles className="h-4 w-4 mr-2" /> {t.documents.analyze}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

interface DocumentCardProps {
  doc: DocumentItem;
  onAnalyze: (doc: DocumentItem) => void;
  onOpen: () => void;
}

function DocumentCard({ doc, onAnalyze, onOpen }: DocumentCardProps) {
  const t = useDocumentsI18n();
  const analysis = parseAiSummary(doc.aiSummary);
  const Icon = fileIcon(doc.fileType);
  const ext = parseFileExtension(doc.fileName);
  const category = detectCategory(doc.title);

  const statusItems: { label: string; icon: React.ComponentType<{ className?: string }>; color: string; visible: boolean }[] = [
    {
      label: t.documents.status.risksFound,
      icon: AlertTriangle,
      color: "text-amber-500",
      visible: analysis.hasRisks,
    },
    {
      label: t.documents.status.conditionsChecked,
      icon: CheckCircle2,
      color: "text-emerald-500",
      visible: analysis.isAnalyzed && !analysis.hasRisks && !analysis.hasDisputed,
    },
    {
      label: t.documents.status.attentionRequired,
      icon: FileQuestion,
      color: "text-destructive",
      visible: analysis.hasDisputed,
    },
    {
      label: t.documents.status.pending,
      icon: FileClock,
      color: "text-muted-foreground",
      visible: !analysis.isAnalyzed,
    },
  ].filter((s) => s.visible);

  return (
    <Card className="overflow-hidden hover:border-primary/30 transition-colors flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1 gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm leading-tight truncate">{doc.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ext} · {formatBytes(doc.size)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {format(new Date(doc.createdAt), "d MMMM yyyy", { locale: ru })}
          </p>
          <div className="space-y-1">
            {statusItems.length === 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" /> {t.documents.status.analyzed}
              </div>
            ) : (
              statusItems.slice(0, 3).map((item, idx) => (
                <div key={idx} className={`flex items-center gap-1.5 text-xs ${item.color}`}>
                  <item.icon className="h-3.5 w-3.5" /> {item.label}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Button onClick={onOpen} variant="default" size="sm" className="w-full">
            <Sparkles className="h-4 w-4 mr-2" /> {t.documents.openAnalysis}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={doc.fileUrl} download>
                <Download className="h-4 w-4 mr-1" /> {t.documents.download}
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onAnalyze(doc)}
              disabled={doc.status === "analyzed" || !doc.storagePath}
            >
              {t.documents.analyze}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function useDocumentsI18n() {
  return { documents: t.documents };
}
