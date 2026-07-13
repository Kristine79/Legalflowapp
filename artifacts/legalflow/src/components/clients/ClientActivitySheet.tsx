import { formatRelative, formatDate } from '@/lib/date';
import { ActivityRecord, STATUS_LABELS } from '@/types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClientWithAi } from '@/types';
import { UserPlus, Settings2, Sparkles, Send, Mail, Edit3, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { t } from '@/lib/i18n';

function getMetaLabel(key: string): string {
  switch (key) {
    case 'category':
      return t.ai.category;
    case 'chatId':
      return t.settings.chatId;
    case 'priority':
      return t.ai.priority;
    default:
      return key;
  }
}

function getMetaValue(key: string, value: unknown): string {
  const str = String(value);
  if (key === 'priority' && value && typeof value === 'string') {
    return t.ai.priorityLabels[value as keyof typeof t.ai.priorityLabels] || str;
  }
  return str;
}

interface ClientActivitySheetProps {
  client: ClientWithAi | null;
  activities: ActivityRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientActivitySheet({ client, activities, open, onOpenChange }: ClientActivitySheetProps) {
  if (!client) return null;

  const getIconForType = (type: ActivityRecord['type']) => {
    switch (type) {
      case 'client_created': return <UserPlus className="h-4 w-4 text-chart-3" />;
      case 'status_changed': return <Settings2 className="h-4 w-4 text-primary" />;
      case 'ai_summary_generated': return <Sparkles className="h-4 w-4 text-chart-4" />;
      case 'telegram_sent': return <Send className="h-4 w-4 text-primary" />;
      case 'email_sent': return <Mail className="h-4 w-4 text-chart-2" />;
      case 'client_updated': return <Edit3 className="h-4 w-4 text-muted-foreground" />;
      case 'client_deleted': return <Trash2 className="h-4 w-4 text-destructive" />;
      default: return <div className="h-4 w-4 bg-muted rounded-full" />;
    }
  };

  const getMessageForType = (activity: ActivityRecord) => {
    if (activity.type === 'status_changed' && activity.metadata?.newStatus) {
      return `${t.activity.types.status_changed} "${STATUS_LABELS[activity.metadata.newStatus as keyof typeof STATUS_LABELS] || activity.metadata.newStatus}"`;
    }
    return t.activity.types[activity.type] || activity.message;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md border-l shadow-2xl">
        <SheetHeader className="pb-6 border-b">
          <SheetTitle className="text-xl">{client.name}</SheetTitle>
          <SheetDescription>
            {t.activity.created} {formatDate(client.createdAt)} • {client.phone}
          </SheetDescription>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="font-normal capitalize">
              {STATUS_LABELS[client.status]}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)] py-6 pr-4">
          {client.aiSummary && (
            <div className="mb-8 p-4 bg-muted/40 rounded-lg border">
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {t.activity.aiSummary}
              </h4>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-muted-foreground"><span className="font-medium">{t.ai.category}:</span> {client.aiSummary.category}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="font-medium text-foreground">{t.ai.nextAction}:</span> {client.aiSummary.nextAction}
                </div>
              </div>
            </div>
          )}

          <h4 className="font-semibold text-sm mb-4">{t.activity.title}</h4>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {activities.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4 relative z-10 bg-background">{t.activity.empty}</div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ml-0 md:ml-0">
                    {getIconForType(activity.type)}
                  </div>

                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] pl-4 md:pl-0 md:group-odd:pr-6 md:group-even:pl-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{getMessageForType(activity)}</span>
                      </div>
                      <time className="text-xs text-muted-foreground mt-1">
                        {formatRelative(activity.createdAt)}
                      </time>

                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 text-xs bg-muted/30 p-2 rounded border border-border/50 font-mono text-muted-foreground">
                          {Object.entries(activity.metadata).map(([k, v]) => (
                            <div key={k}><span className="opacity-70">{getMetaLabel(k)}:</span> {getMetaValue(k, v)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
