# LegalFlow

AI-CRM для юридических фирм России. Управляйте клиентами, делами, задачами и документами — получайте структурированные рекомендации нейросети и уведомления в Telegram.

## Что делает продукт

LegalFlow объединяет приём первичных обращений, ведение дел, задач с дедлайнами, документов и аналитику в одном рабочем пространстве для юридической практики.

### Основные возможности

- **AI-анализ обращений** — по описанию клиента сеть определяет категорию дела, приоритет, риски, список вопросов и рекомендует следующий шаг.
- **Воронка клиентов** — наглядные статусы: новое обращение, первичная консультация, документы получены, дело в работе, закрыто.
- **Дела и задачи** — создавайте дела, назначайте исполнителей, ставьте дедлайны и отслеживайте статус в Kanban-подобном списке задач.
- **Документы** — загружайте PDF, DOCX, TXT; просите AI проанализировать договор и выделить спорные пункты и риски.
- **Telegram-уведомления** — бот уведомляет о новых клиентах и важных событиях.
- **Аналитика** — дашборд с KPI, недельным трендом, распределением по статусам и воронкой.
- **Многоролевой доступ** — роли `owner`, `admin`, `lawyer`, `assistant`, `client` с RBAC-фильтрами на уровне SQL.
- **Публичный сайт** — лендинг с демо-видео, отзывами, тарифами и FAQ; страницы `/about`, `/pricing`, `/faq`, `/demo`.

## Быстрый старт

```bash
# Установить зависимости
pnpm install

# Запустить API-сервер
pnpm --filter @workspace/api-server run dev

# В отдельном терминале — фронтенд
pnpm --filter @workspace/legalflow run dev
```

Фронтенд доступен по пути артефакта `/legalflow`, API — по `/api`.

## Скрипты

| Скрипт | Назначение |
|---|---|
| `pnpm run typecheck` | Проверка типов по всем пакетам |
| `pnpm run build` | Сборка всех пакетов |
| `pnpm --filter @workspace/api-spec run codegen` | Регенерация хуков и Zod-схем из OpenAPI |
| `pnpm --filter @workspace/db run push` | Применить схему БД в dev |

## Технологии

- **Frontend:** React 19, Vite, Tailwind CSS v4, shadcn/ui, Wouter, Framer Motion, Recharts
- **Backend:** Express 5, TypeScript, pino-http
- **Auth:** Clerk (`@clerk/react`, `@clerk/express`) с русской локализацией через `@clerk/localizations`
- **Database:** PostgreSQL + Drizzle ORM
- **Validation:** Zod v3 + drizzle-zod
- **API codegen:** Orval v8 (OpenAPI → React Query + Zod)
- **AI:** OpenAI-совместимый провайдер (Replit AI proxy / OpenRouter / OpenAI)
- **Storage:** локальная файловая система, `artifacts/api-server/uploads/`

## Архитектура

```
lib/api-spec/openapi.yaml          # контракт API
lib/api-client-react/             # сгенерированные React Query хуки
lib/api-zod/                      # сгенерированные Zod-схемы
lib/db/                           # Drizzle схемы и миграции
artifacts/api-server/             # Express backend
artifacts/legalflow/              # React frontend
```

Проект следует contract-first подходу: ручные типы не дублируются — используются сгенерированные хуки и схемы. Все доменные мутации идут через бэкенд; в `localStorage` остаются только UX-флаги.

## Переменные окружения

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — секрет сессий
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — Clerk
- `TELEGRAM_BOT_TOKEN` — токен бота Telegram
- `AI_INTEGRATIONS_OPENAI_API_KEY` / `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit AI proxy
- `OPENAI_API_KEY`, `OPENROUTER_API_KEY` — альтернативные AI-провайдеры
- `UPLOADS_DIR` — папка загрузок (опционально)

## Важные правила

- После изменения `lib/api-spec/openapi.yaml` — запустить `pnpm --filter @workspace/api-spec run codegen`, затем `pnpm run typecheck`.
- В OpenAPI не используйте `format: uuid` / `format: email` — Orval v8 сгенерирует Zod v4, который несовместим с `zod@^3`.
- `pdf-parse` загружается в `documentText.ts` через `createRequire`; не меняйте на ESM import.
- Clerk proxy middleware монтируется до `express.json()`.

## Лицензия

Внутренний проект. Распространяется по усмотрению владельца.
