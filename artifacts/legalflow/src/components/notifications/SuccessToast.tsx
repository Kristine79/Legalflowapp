import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { t } from '@/lib/i18n';
import type { AutomationResult } from '@/lib/automation';

interface SuccessToastProps {
  result: AutomationResult;
}

export function SuccessToast({ result }: SuccessToastProps) {
  const { notificationSent, notificationChannel, notificationReason } = result;

  let notificationLabel: string;
  let NotificationIcon: typeof CheckCircle2 = CheckCircle2;
  let iconClass = 'text-chart-3';

  if (notificationSent) {
    if (notificationChannel === 'telegram') {
      notificationLabel = t.successToast.telegramSent;
    } else if (notificationChannel === 'email') {
      notificationLabel = t.successToast.emailSent;
    } else {
      notificationLabel = t.successToast.notificationSent;
    }
  } else if (notificationReason === 'disabled') {
    notificationLabel = t.successToast.notificationsDisabled;
    NotificationIcon = XCircle;
    iconClass = 'text-muted-foreground';
  } else {
    notificationLabel = t.successToast.notificationsNotConfigured;
    NotificationIcon = AlertCircle;
    iconClass = 'text-chart-2';
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-chart-3" />
        <span className="font-medium text-foreground">{t.successToast.clientCreated}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-chart-3" />
        <span className="font-medium text-foreground">{t.successToast.aiReady}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <NotificationIcon className={`h-4 w-4 ${iconClass}`} />
        <span className={`font-medium ${notificationSent ? 'text-foreground' : 'text-muted-foreground'}`}>
          {notificationLabel}
        </span>
      </div>
    </div>
  );
}
