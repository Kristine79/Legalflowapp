import type { ActivityRecord, AppSettings, Case, CaseInput, Client, ClientInput, ClientWithAi, UserProfile } from '@/types';

const CLIENTS_KEY = 'legalflow:clients';
const CASES_KEY = 'legalflow:cases';
const ACTIVITIES_KEY = 'legalflow:activities';
const SETTINGS_KEY = 'legalflow:settings';
const PROFILE_KEY = 'legalflow:profile';
const ONBOARDING_KEY = 'legalflow:onboarding';
const AI_HISTORY_KEY = 'legalflow:ai-assistant-history';
const CALENDAR_EVENTS_KEY = 'legalflow:calendar-events';

export type CalendarEventType = 'court' | 'meeting' | 'deadline' | 'reminder' | 'task';

export interface CustomCalendarEvent {
  id: string;
  title: string;
  client: string;
  date: string;
  type: CalendarEventType;
  comment: string;
  createdAt: string;
}

export interface AiHistoryItem {
  id: string;
  type: 'intake' | 'document' | 'questions' | 'deadlines';
  title: string;
  subtitle?: string;
  createdAt: string;
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // LocalStorage can throw in private mode or when quota is exceeded.
  }
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Clients

export function getClients(): ClientWithAi[] {
  return safeRead<ClientWithAi[]>(CLIENTS_KEY, []);
}

export function getClient(id: string): ClientWithAi | undefined {
  return getClients().find((c) => c.id === id);
}

export function saveClient(client: Client): void {
  const clients = getClients();
  const index = clients.findIndex((c) => c.id === client.id);
  if (index >= 0) {
    clients[index] = client;
  } else {
    clients.unshift(client);
  }
  safeWrite(CLIENTS_KEY, clients);
}

export function deleteClient(id: string): void {
  const clients = getClients().filter((c) => c.id !== id);
  safeWrite(CLIENTS_KEY, clients);
}

export function createClient(input: ClientInput): Client {
  const now = new Date().toISOString();
  const client: Client = {
    id: generateId(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  saveClient(client);
  return client;
}

// Cases

export function getCases(): Case[] {
  return safeRead<Case[]>(CASES_KEY, []);
}

export function getCase(id: string): Case | undefined {
  return getCases().find((c) => c.id === id);
}

export function saveCase(caseItem: Case): void {
  const cases = getCases();
  const index = cases.findIndex((c) => c.id === caseItem.id);
  if (index >= 0) {
    cases[index] = caseItem;
  } else {
    cases.unshift(caseItem);
  }
  safeWrite(CASES_KEY, cases);
}

export function deleteCase(id: string): void {
  const cases = getCases().filter((c) => c.id !== id);
  safeWrite(CASES_KEY, cases);
}

export function generateCaseNumber(): string {
  const count = getCases().length + 1;
  return `Д-${String(count).padStart(4, '0')}`;
}

export function createCase(input: CaseInput): Case {
  const now = new Date().toISOString();
  const caseItem: Case = {
    id: generateId(),
    caseNumber: input.caseNumber || generateCaseNumber(),
    clientId: input.clientId,
    title: input.title,
    description: input.description,
    category: input.category,
    status: input.status || 'new-request',
    priority: input.priority,
    createdAt: now,
    updatedAt: now,
  };
  saveCase(caseItem);
  return caseItem;
}

// Activities

export function getActivities(filters?: { clientId?: string; caseId?: string }): ActivityRecord[] {
  const all = safeRead<ActivityRecord[]>(ACTIVITIES_KEY, []);
  let filtered = all;
  if (filters?.clientId) {
    filtered = filtered.filter((a) => a.clientId === filters.clientId);
  }
  if (filters?.caseId) {
    filtered = filtered.filter((a) => a.caseId === filters.caseId);
  }
  return filtered.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function recordActivity(activity: Omit<ActivityRecord, 'id' | 'createdAt'>): ActivityRecord {
  const all = safeRead<ActivityRecord[]>(ACTIVITIES_KEY, []);
  const entry: ActivityRecord = {
    ...activity,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  safeWrite(ACTIVITIES_KEY, [entry, ...all]);
  return entry;
}

export function deleteCaseActivities(caseId: string): void {
  const all = safeRead<ActivityRecord[]>(ACTIVITIES_KEY, []).filter((a) => a.caseId !== caseId);
  safeWrite(ACTIVITIES_KEY, all);
}

export function deleteClientActivities(clientId: string): void {
  const all = safeRead<ActivityRecord[]>(ACTIVITIES_KEY, []).filter((a) => a.clientId !== clientId);
  safeWrite(ACTIVITIES_KEY, all);
}

// Settings & Profile

export const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    enabled: true,
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    fallbackToEmail: true,
  },
};

export function getSettings(): AppSettings {
  const stored = safeRead<AppSettings | null>(SETTINGS_KEY, null);
  if (!stored) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...stored.notifications,
    },
  };
}

export function saveSettings(settings: AppSettings): void {
  safeWrite(SETTINGS_KEY, settings);
}

export function getProfile(): UserProfile {
  return safeRead<UserProfile>(PROFILE_KEY, {
    name: 'Адвокат',
    email: 'user@legalflow.local',
    role: 'Управляющий партнер',
    initials: 'АП',
    firmName: 'LegalFlow',
  });
}

export function saveProfile(profile: UserProfile): void {
  safeWrite(PROFILE_KEY, profile);
}

export function getOnboardingComplete(): boolean {
  return safeRead<boolean>(ONBOARDING_KEY, false);
}

export function setOnboardingComplete(): void {
  safeWrite(ONBOARDING_KEY, true);
}

export function resetOnboarding(): void {
  safeWrite(ONBOARDING_KEY, false);
}

export function getAiHistory(): AiHistoryItem[] {
  return safeRead<AiHistoryItem[]>(AI_HISTORY_KEY, []);
}

export function saveAiHistory(history: AiHistoryItem[]): void {
  safeWrite(AI_HISTORY_KEY, history.slice(0, 50));
}

export function addAiHistoryItem(item: AiHistoryItem): void {
  const history = getAiHistory();
  saveAiHistory([item, ...history]);
}

export function clearAiHistory(): void {
  safeWrite(AI_HISTORY_KEY, []);
}

export function getCalendarEvents(): CustomCalendarEvent[] {
  return safeRead<CustomCalendarEvent[]>(CALENDAR_EVENTS_KEY, []);
}

export function saveCalendarEvents(events: CustomCalendarEvent[]): void {
  safeWrite(CALENDAR_EVENTS_KEY, events);
}

export function addCalendarEvent(event: Omit<CustomCalendarEvent, 'id' | 'createdAt'>): CustomCalendarEvent {
  const events = getCalendarEvents();
  const newEvent: CustomCalendarEvent = {
    ...event,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  saveCalendarEvents([newEvent, ...events]);
  return newEvent;
}

export function updateCalendarEvent(id: string, updates: Partial<CustomCalendarEvent>): CustomCalendarEvent | null {
  const events = getCalendarEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;
  events[index] = { ...events[index], ...updates };
  saveCalendarEvents(events);
  return events[index];
}

export function deleteCalendarEvent(id: string): boolean {
  const events = getCalendarEvents();
  const filtered = events.filter((e) => e.id !== id);
  if (filtered.length === events.length) return false;
  saveCalendarEvents(filtered);
  return true;
}

export function exportData(): {
  cases: Case[];
  clients: Client[];
  activities: ActivityRecord[];
  settings: AppSettings;
  profile: UserProfile;
} {
  return {
    cases: getCases(),
    clients: getClients(),
    activities: getActivities(),
    settings: getSettings(),
    profile: getProfile(),
  };
}

export function seedDemoData(): void {
  if (getCases().length > 0) return;

  const now = new Date().toISOString();
  const clients: Client[] = [
    {
      id: 'demo_client_1',
      name: 'Иван Иванов',
      phone: '+7 (900) 123-45-67',
      email: 'ivan@example.com',
      description: 'Консультация по семейному праву.',
      status: 'new',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_client_2',
      name: 'Мария Смирнова',
      phone: '+7 (901) 234-56-78',
      email: 'maria@example.com',
      description: 'Спор с арендодателем.',
      status: 'new',
      createdAt: now,
      updatedAt: now,
    },
  ];

  clients.forEach((client) => saveClient(client));

  const cases: Case[] = [
    {
      id: 'demo_case_1',
      caseNumber: 'Д-0001',
      clientId: 'demo_client_1',
      clientName: 'Иван Иванов',
      title: 'Расторжение брака и раздел имущества',
      description: 'Клиент хочет развестись. Есть совместная квартира и ребенок.',
      category: 'Семейное право',
      status: 'consultation',
      priority: 'high',
      aiSummary: {
        summary: 'Дело о расторжении брака с разделом имущества и определением порядка общения с ребенком.',
        category: 'Семейное право',
        type: 'Расторжение брака',
        priority: 'high',
        risks: ['спор по разделу имущества', 'неизвестна позиция второго супруга'],
        questions: ['Есть ли дети?', 'Есть ли совместное имущество?', 'Есть ли согласие супругов?'],
        documents: ['паспорт', 'свидетельство о браке', 'документы на квартиру'],
        nextAction: 'Назначить консультацию',
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_case_2',
      caseNumber: 'Д-0002',
      clientId: 'demo_client_2',
      clientName: 'Мария Смирнова',
      title: 'Взыскание неустойки по договору аренды',
      description: 'Арендодатель не устраняет недостатки в квартире, арендатор требует неустойку.',
      category: 'Жилищное право',
      status: 'documents',
      priority: 'medium',
      aiSummary: {
        summary: 'Спор по договору аренды: требование неустойки за неустранение недостатков.',
        category: 'Жилищное право',
        type: 'Жилищный спор',
        priority: 'medium',
        risks: ['не документированы недостатки', 'неясны сроки договора'],
        questions: ['Есть ли письменный договор?', 'Есть ли фото/видео нарушений?'],
        documents: ['договор аренды', 'фото нарушений', 'переписка'],
        nextAction: 'Собрать доказательства',
      },
      createdAt: now,
      updatedAt: now,
    },
  ];

  cases.forEach((caseItem) => saveCase(caseItem));

  recordActivity({
    caseId: 'demo_case_1',
    clientId: 'demo_client_1',
    type: 'case_created',
    message: 'Создано дело Д-0001 — Расторжение брака и раздел имущества',
    metadata: { status: 'new-request' },
  });
  recordActivity({
    caseId: 'demo_case_1',
    clientId: 'demo_client_1',
    type: 'ai_summary_generated',
    message: 'AI подготовил анализ дела',
    metadata: { category: 'Семейное право', priority: 'high' },
  });
  recordActivity({
    caseId: 'demo_case_1',
    clientId: 'demo_client_1',
    type: 'status_changed',
    message: 'Статус изменен на Консультация',
    metadata: { status: 'consultation' },
  });
  recordActivity({
    caseId: 'demo_case_2',
    clientId: 'demo_client_2',
    type: 'case_created',
    message: 'Создано дело Д-0002 — Взыскание неустойки по договору аренды',
    metadata: { status: 'new-request' },
  });
  recordActivity({
    caseId: 'demo_case_2',
    clientId: 'demo_client_2',
    type: 'status_changed',
    message: 'Статус изменен на Документы',
    metadata: { status: 'documents' },
  });
}
