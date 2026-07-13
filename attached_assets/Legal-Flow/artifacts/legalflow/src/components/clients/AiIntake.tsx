import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Zap,
  AlertCircle,
  Info,
  ShieldAlert,
  HelpCircle,
  FileText,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAnalyzeIntake } from '@workspace/api-client-react';
import { analyzeIntake as analyzeIntakeLocal } from '@/lib/ai';
import { t } from '@/lib/i18n';
import type { AiAnalysis } from '@/types';

interface AiIntakeProps {
  onAnalyzeComplete: (description: string, analysis: AiAnalysis) => void;
}

export function AiIntake({ onAnalyzeComplete }: AiIntakeProps) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<AiAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedLocalFallback, setUsedLocalFallback] = useState(false);

  const analyzeMutation = useAnalyzeIntake({
    mutation: {
      onSuccess: (data) => {
        setResult({ ...data, priority: data.priority ?? undefined });
        setError(null);
        setUsedLocalFallback(false);
      },
      onError: (err) => {
        const localResult = analyzeIntakeLocal(text);
        setResult(localResult);
        setUsedLocalFallback(true);
        setError(err.message || 'AI analysis failed');
      },
    },
  });

  const isAnalyzing = analyzeMutation.isPending;

  const handleAnalyze = () => {
    if (!text.trim()) return;
    setError(null);
    analyzeMutation.mutate({ data: { description: text } });
  };

  const handleCreate = () => {
    if (result) {
      onAnalyzeComplete(text, result);
    }
  };

  return (
    <Card className="border-primary/10 shadow-sm overflow-hidden bg-gradient-to-br from-card to-primary/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-md">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{t.ai.title}</CardTitle>
            <CardDescription>{t.ai.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder={t.ai.placeholder}
          className="min-h-[100px] resize-none border-primary/20 focus-visible:ring-primary/30"
          value={text}
          onChange={(e) => setText(e.target.value)}
          data-testid="input-ai-intake"
        />

        <AnimatePresence mode="sync">
          {error && !isAnalyzing && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {result && !isAnalyzing && (
            <motion.div
              key="result"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card border rounded-lg p-4 space-y-5 shadow-sm"
            >
              {usedLocalFallback && (
                <div className="bg-chart-2/10 text-chart-2 border border-chart-2/20 rounded-md p-2 text-xs flex items-start gap-2">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{t.ai.fallbackNotice}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {result.category}
                </Badge>
              </div>

              {result.risks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-chart-2" />
                    {t.ai.risks}
                  </h4>
                  <ul className="space-y-1.5">
                    {result.risks.map((risk, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-chart-2 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.questions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5 text-primary" />
                    {t.ai.questions}
                  </h4>
                  <ul className="space-y-1.5">
                    {result.questions.map((question, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary/10 text-primary text-[10px] font-medium flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-foreground">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.documents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-chart-3" />
                    {t.ai.documents}
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.documents.map((doc, idx) => (
                      <li
                        key={idx}
                        className="text-sm flex items-center gap-2 bg-muted/50 rounded-md px-2 py-1.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-chart-3 flex-shrink-0" />
                        <span className="text-foreground truncate">{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <ListTodo className="h-3.5 w-3.5 text-primary" /> {t.ai.nextAction}
                </h4>
                <p className="text-sm font-medium text-foreground">{result.nextAction}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      <CardFooter className="pt-0 justify-end gap-2">
        {!result || isAnalyzing ? (
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !text.trim()}
            variant={result ? 'secondary' : 'default'}
            data-testid="button-analyze-ai"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse" />
                {t.ai.analyzing}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t.ai.analyze}
              </span>
            )}
          </Button>
        ) : null}

        {result && !isAnalyzing && (
          <Button onClick={handleCreate} data-testid="button-create-from-ai">
            {t.ai.createFromAnalysis}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
