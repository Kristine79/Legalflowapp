export type ClientStatus = 'new' | 'in-progress' | 'waiting' | 'closed';

export type CaseStatus =
  | 'new-request'
  | 'consultation'
  | 'documents'
  | 'court'
  | 'closed';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone: string;
  description: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClientInput {
  name: string;
  email?: string;
  phone: string;
  description: string;
  status: ClientStatus;
}

export interface AiAnalysis {
  category: string;
  risks: string[];
  questions: string[];
  documents: string[];
  nextAction: string;
  summary?: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ClientWithAi extends Client {
  aiSummary?: AiAnalysis;
}

export interface Case {
  id: string;
  caseNumber: string;
  clientId?: string;
  clientName?: string;
  title: string;
  description: string;
  category?: string;
  status: CaseStatus;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  aiSummary?: AiAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface CaseInput {
  clientId?: string;
  caseNumber?: string;
  title: string;
  description: string;
  category?: string;
  status?: CaseStatus;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ActivityRecord {
  id: string;
  clientId?: string;
  caseId?: string;
  type:
    | 'client_created'
    | 'case_created'
    | 'status_changed'
    | 'ai_summary_generated'
    | 'telegram_sent'
    | 'email_sent'
    | 'client_updated'
    | 'client_deleted'
    | 'case_updated'
    | 'case_deleted'
    | 'document_added'
    | 'note_added';
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationSettings {
  enabled: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  fallbackToEmail: boolean;
}

export interface AppSettings {
  notifications: NotificationSettings;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  initials: string;
  firmName: string;
}

export const STATUS_LABELS: Record<ClientStatus, string> = {
  new: 'Новое',
  'in-progress': 'В работе',
  waiting: 'Ожидание',
  closed: 'Закрыто',
};

export const STATUS_ORDER: ClientStatus[] = ['new', 'in-progress', 'waiting', 'closed'];

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  'new-request': 'Новая заявка',
  consultation: 'Консультация',
  documents: 'Документы',
  court: 'Суд',
  closed: 'Закрыто',
};

export const CASE_STATUS_ORDER: CaseStatus[] = [
  'new-request',
  'consultation',
  'documents',
  'court',
  'closed',
];

export const CASE_STATUS_COLORS: Record<CaseStatus, string> = {
  'new-request': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  consultation: 'bg-primary/10 text-primary border-primary/20',
  documents: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  court: 'bg-destructive/10 text-destructive border-destructive/20',
  closed: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
};
