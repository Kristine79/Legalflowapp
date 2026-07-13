import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, Check, FileText, Settings2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useListNotifications, useMarkNotificationRead } from '@workspace/api-client-react';
import { t } from '@/lib/i18n';
import { formatRelative } from '@/lib/date';

function getIcon(type: string) {
  switch (type) {
    case 'new-client': return <FileText className="h-4 w-4 text-primary" />;
    case 'status-changed': return <Settings2 className="h-4 w-4 text-primary" />;
    case 'ai-ready': return <Sparkles className="h-4 w-4 text-chart-4" />;
    default: return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

export function NotificationPopover() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useListNotifications({
    query: { queryKey: ['notifications'] },
  });
  const markRead = useMarkNotificationRead({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) },
  });
  const unreadCount = items.filter((i) => !i.read).length;

  const markAllRead = () => {
    items.filter((i) => !i.read).forEach((i) => markRead.mutate({ notificationId: i.id }));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">{t.notifications.title}</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs" onClick={markAllRead}>
              <Check className="mr-1 h-3 w-3" /> {t.notifications.markRead}
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">{t.notifications.empty}</div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors ${!item.read ? 'bg-primary/[0.03]' : ''}`}
              >
                <div className="mt-0.5">{getIcon(item.type ?? '')}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!item.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelative(item.createdAt)}</p>
                </div>
                {!item.read && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
