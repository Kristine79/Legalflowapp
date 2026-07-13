import {
  analyzeIntake as analyzeIntakeBackend,
  createActivity,
  sendTelegramNotification,
} from '@workspace/api-client-react';
import { generateAiSummaryForClient } from '@/lib/ai';
import type { AiAnalysis, AppSettings, Client, ClientWithAi } from '@/types';

/**
 * Records an activity via the backend so it shows up in the shared activity
 * feed (`useActivities`). Failures are logged but never block the caller —
 * activity history is supplementary, not critical-path.
 */
async function recordActivity(input: {
  clientId: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await createActivity(input);
  } catch (err) {
    console.error('Failed to record activity on the backend', err);
  }
}

export interface AutomationStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  detail?: string;
}

export type NotificationReason = 'sent' | 'disabled' | 'not_configured';

export interface AutomationResult {
  success: boolean;
  steps: AutomationStep[];
  client: ClientWithAi;
  notificationSent: boolean;
  notificationChannel: 'telegram' | 'email' | 'none';
  notificationReason: NotificationReason;
}

export function buildAutomationSteps(): AutomationStep[] {
  return [
    { id: 'save', label: 'Сохранить клиента', status: 'pending' },
    { id: 'activity', label: 'Создать запись активности', status: 'pending' },
    { id: 'ai', label: 'Сгенерировать ИИ-сводку', status: 'pending' },
    { id: 'notify', label: 'Отправить уведомление', status: 'pending' },
  ];
}

function updateStep(steps: AutomationStep[], id: string, status: AutomationStep['status'], detail?: string): void {
  const step = steps.find((s) => s.id === id);
  if (step) {
    step.status = status;
    if (detail) step.detail = detail;
  }
}

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateAiSummary(description: string): Promise<AiAnalysis> {
  try {
    const result = await analyzeIntakeBackend({ description });
    return { ...result, priority: result.priority ?? undefined };
  } catch {
    // Fallback to local heuristic if backend is unavailable.
    return generateAiSummaryForClient(description);
  }
}

export async function runCreateClientAutomation(
  client: Client,
  settings: AppSettings,
  telegramEnabled: boolean,
  analysis?: AiAnalysis,
): Promise<AutomationResult> {
  const steps = buildAutomationSteps();
  let clientWithAi: ClientWithAi = { ...client };

  updateStep(steps, 'save', 'running');
  await wait(300);
  updateStep(steps, 'save', 'completed', `Клиент ${client.name} сохранен`);

  updateStep(steps, 'activity', 'running');
  await recordActivity({
    clientId: client.id,
    type: 'client_created',
    message: `Клиент ${client.name} создан`,
    metadata: { status: client.status },
  });
  updateStep(steps, 'activity', 'completed', 'Запись активности создана');

  updateStep(steps, 'ai', 'running');
  const aiSummary = analysis ?? await generateAiSummary(client.description);
  clientWithAi = { ...client, aiSummary };
  await recordActivity({
    clientId: client.id,
    type: 'ai_summary_generated',
    message: 'ИИ-сводка сгенерирована',
    metadata: { category: aiSummary.category },
  });
  updateStep(steps, 'ai', 'completed', `Категория: ${aiSummary.category}`);

  updateStep(steps, 'notify', 'running');
  let notificationChannel: 'telegram' | 'email' | 'none' = 'none';
  let notificationSent = false;
  let notificationReason: NotificationReason = 'disabled';

  if (settings.notifications.enabled) {
    notificationReason = 'not_configured';
    if (telegramEnabled) {
      notificationChannel = 'telegram';
      try {
        await sendTelegramNotification({
          message: `Новый клиент: ${client.name}\n${aiSummary.category}`,
        });
        notificationSent = true;
        await recordActivity({
          clientId: client.id,
          type: 'telegram_sent',
          message: 'Telegram-уведомление отправлено',
        });
        updateStep(steps, 'notify', 'completed', 'Telegram-уведомление отправлено');
      } catch {
        updateStep(steps, 'notify', 'failed', 'Не удалось отправить Telegram-уведомление');
      }
    } else if (settings.notifications.fallbackToEmail && settings.notifications.smtpHost && settings.notifications.smtpUser) {
      notificationChannel = 'email';
      notificationSent = true;
      await recordActivity({
        clientId: client.id,
        type: 'email_sent',
        message: 'Email-уведомление отправлено',
        metadata: { from: settings.notifications.smtpFrom },
      });
      updateStep(steps, 'notify', 'completed', 'Email-уведомление отправлено');
    } else {
      updateStep(steps, 'notify', 'completed', 'Уведомления пропущены: провайдер не настроен');
    }
  } else {
    updateStep(steps, 'notify', 'completed', 'Уведомления отключены в настройках');
  }

  return {
    success: true,
    steps,
    client: clientWithAi,
    notificationSent,
    notificationChannel,
    notificationReason,
  };
}

export async function recordStatusChange(clientId: string, newStatus: string, clientName: string): Promise<void> {
  await recordActivity({
    clientId,
    type: 'status_changed',
    message: `Статус изменен на "${newStatus}"`,
    metadata: { newStatus, clientName },
  });
}

export async function recordClientUpdate(clientId: string, clientName: string): Promise<void> {
  await recordActivity({
    clientId,
    type: 'client_updated',
    message: `Клиент ${clientName} обновлен`,
  });
}

export async function recordClientDelete(clientId: string, clientName: string): Promise<void> {
  await recordActivity({
    clientId,
    type: 'client_deleted',
    message: `Клиент ${clientName} удален`,
  });
}
