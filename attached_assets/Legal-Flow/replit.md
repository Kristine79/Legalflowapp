# LegalFlow

AI-CRM для юридических фирм: ведение клиентов, дел, задач, документов с AI-анализом обращений и контрактов, Telegram-уведомлениями и многоролевым доступом.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API-сервер (port 8080, доступен через `/api`)
- `pnpm --filter @workspace/legalflow run dev` — фронтенд (Vite dev server, путь артефакта `/legalflow`)
- `pnpm run typecheck` — полная проверка типов по всем пакетам
- `pnpm run build` — typecheck + сборка всех пакетов
- `pnpm --filter @workspace/api-spec run codegen` — регенерация React Query хуков и Zod-схем из OpenAPI spec
- `pnpm --filter @workspace/db run push` — применить изменения схемы БД (только dev)
- Required env: `DATABASE_URL` — PostgreSQL connection string (устанавливается автоматически при provision)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend:** React 19 + Vite + TailwindCSS v4 + shadcn/ui + Wouter routing + Framer Motion + Recharts
- **Auth:** Clerk (whitelabel, кастомная русская локализация через `@clerk/localizations`) — `@clerk/react` на клиенте, `@clerk/express` на сервере
- **API:** Express 5 + `@clerk/express` + pino-http structured logging
- **DB:** PostgreSQL + Drizzle ORM (9 таблиц)
- **Validation:** Zod v3 (`zod@catalog:`) + drizzle-zod
- **API codegen:** Orval v8 (OpenAPI spec → React Query хуки + Zod схемы)
- **AI:** OpenAI-совместимый провайдер через `artifacts/api-server/src/lib/ai.ts`
- **Telegram:** Bot API, `TELEGRAM_BOT_TOKEN` + `telegramChatId` пользователя
- **File storage:** локальная ФС, `artifacts/api-server/uploads/`

## Where things live

**API contract & codegen**
- `lib/api-spec/openapi.yaml` — источник истины для API-контракта
- `lib/api-client-react/src/generated/api.ts` — сгенерированные React Query хуки
- `lib/api-zod/src/generated/api.ts` — сгенерированные Zod-схемы (сервер)

**Database**
- `lib/db/src/schema/` — Drizzle ORM схемы: `users`, `clients`, `cases`, `tasks`, `documents`, `activities`, `notifications`, `teamMembers`, `auditLogs` + `relations`

**API server**
- `artifacts/api-server/src/app.ts` — точка входа Express: Clerk proxy, CORS, body parsers, `clerkMiddleware`
- `artifacts/api-server/src/routes/` — роуты: `ai`, `analytics`, `users`, `clients`, `cases`, `activities`, `documents`, `tasks`, `notifications`, `calendar`, `telegram`, `health`
- `artifacts/api-server/src/lib/` — вспомогательные модули: `ai`, `auth`, `rbac`, `telegram`, `storage`, `documentText`, `validation`, `logger`
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Clerk proxy для production custom domains

**Frontend**
- `artifacts/legalflow/src/pages/` — страницы: `Dashboard`, `Documents`, `Tasks`, `Calendar`, `Settings`, `Profile`, `AiTools`, `Demo`, `Landing`, `Login`, `Register`, `About`, `Faq`, `Pricing`, `not-found`
- `artifacts/legalflow/src/components/` — компоненты:
  - `clients/` — управление клиентами и их статусами
  - `dashboard/` — `AnalyticsSection`, `StatCards`, `FunnelChart` (новая визуализация воронки), `ActivityFeed`, `RecentCases`, `ClientTable`
  - `layout/` — `PublicHeader` (общая публичная навигация для Landing / About / Faq / Pricing)
  - `landing/` — `DemoVideoSection`, `TrustSection`, `TestimonialsSection`, `PricingSection`, `LandingFaqSection`
  - `notifications/`, `onboarding/`, `ui/`
- `artifacts/legalflow/src/hooks/` — кастомные хуки: `use-clients`, `use-activities`, `use-profile`, `use-settings`, `use-auth-user`, `use-mobile`, `use-toast`, `use-tasks`
- `artifacts/legalflow/src/lib/` — утилиты: `ai.ts` (клиентская эвристика), `automation.ts`, `clerk-localization.ts`, `date.ts`, `i18n.tsx`, `i18n/ru.ts`, `i18n/en.ts`, `storage.ts`, `utils.ts`, `validation.ts`
- `artifacts/legalflow/src/config/navigation.config.ts` — конфигурация навигации (Tasks, Calendar, AI-tools, Documents, Settings, About, Profile)
- `artifacts/legalflow/src/assets/` — логотипы (logo-full.png, logo-icon.png), демо-видео (product-demo.gif)

## Architecture decisions

- **Contract-first API:** OpenAPI spec → Orval codegen → типизированные хуки + Zod-схемы. Не писать типы вручную там, где есть codegen.
- **Orval + Zod v3:** `format: uuid` и `format: email` убраны из OpenAPI spec — Orval v8 генерирует `z.uuid()`/`z.email()` из Zod v4, несовместимо с `zod@^3`. Используется plain `type: string`.
- **RBAC:** 5 ролей: `owner > admin > lawyer > assistant > client`. Каждый DB-запрос в роутах применяет SQL-фильтр из `lib/rbac.ts`. Super-роли (owner/admin) обходят фильтры.
- **Clerk whitelabel:** `publishableKeyFromHost` на клиенте и сервере, `clerkMiddleware` с динамическим publishable key, Clerk proxy middleware для production. `VITE_CLERK_PROXY_URL` не нужно устанавливать вручную — auto-populate в prod. Русская локализация Clerk — deep-merge официального `ruRU` из `@clerk/localizations` с кастомными overrides в `lib/clerk-localization.ts`.
- **AI provider waterfall:** `AI_INTEGRATIONS_OPENAI_API_KEY` + `AI_INTEGRATIONS_OPENAI_BASE_URL` → `OPENROUTER_API_KEY` → `OPENAI_API_KEY`. Если нет ни одного — AI-фичи возвращают 503; фронтенд при ошибке бэкенда падает на локальную эвристику из `lib/ai.ts`.
- **Backend-driven data:** Все доменные данные (clients, cases, activities, notifications, documents, tasks) идут через сгенерированные React Query хуки. В `localStorage` хранятся только UX-флаги (флаг онбординга, настройки языка).
- **Автоматизация активностей:** `use-clients.ts` вызывает `runCreateClientAutomation` и `record*`-утилиты из `lib/automation.ts`, которые пишут активность через `POST /activities` и отправляют Telegram-уведомление.
- **pdf-parse via CJS require:** `documentText.ts` загружает pdf-parse через `createRequire` — обходной путь из-за ESM bundling issues в esbuild.
- **i18n:** статический объект переводов + React Context (`LanguageProvider` / `useT()`). Язык сохраняется в `localStorage`. Лендинг-контент (trust, testimonials, pricing, faqTeaser) вынесен в i18n-объект `landing` в `ru.ts` и `en.ts`.
- **Публичная навигация:** `PublicHeader` единый для всех публичных страниц (`/`, `/about`, `/pricing`, `/faq`) с подсветкой активной страницы.
- **Демо-страница:** `/demo` показывает полноценный дашборд с тестовыми данными, но не вызывает защищённые эндпоинты. `AnalyticsSection` принимает `overrideStats` для отображения демо-аналитики без авторизации.
- **Воронка:** `FunnelChart` — жёстко заданная визуализация 5 этапов воронки (hardcoded, JSX), используется в `AnalyticsSection` на дашборде и демо.

## Product

- **Клиенты:** список, создание/редактирование, смена статуса, удаление, AI-анализ первичного обращения (summary, category, priority, risks, questions, documents, nextAction), воронка по статусам, история активности
- **Дела:** привязка к клиентам, статусы (`new-request → consultation → documents → court → closed`), назначение юриста и ассистента
- **Задачи:** CRUD, фильтрация по статусу, приоритеты, дедлайны, назначение исполнителей, быстрое переключение done/pending; фронтенд работает через `use-tasks.ts` поверх сгенерированных React Query хуков
- **Документы:** загрузка PDF/DOCX/TXT, AI-анализ контракта (summary, risks, disputedClauses), вопросы к документу (Q&A), скачивание
- **Календарь:** визуальный календарь дедлайнов задач и дел по месяцам
- **Уведомления:** in-app список, Telegram-уведомления при создании клиента, тестовая отправка из настроек
- **Аналитика:** дашборд с KPI-карточками, еженедельным трендом, распределением по статусам и воронкой. Данные приходят с `GET /analytics` (`DashboardStats`)
- **Настройки:** Telegram chat ID и toggle уведомлений, управление ролями пользователей (для owner/admin), сброс онбординга
- **Профиль:** имя, инициалы, название фирмы, email, синхронизация с БД через `POST /users/sync`
- **Онбординг:** пошаговая настройка профиля и Telegram-интеграции при первом входе
- **AI Tools:** прямой интерфейс для AI-анализа обращений и работы с документами
- **Лендинг:** hero, feature grid, демо-видео (GIF из реальных скриншотов `/demo`), блоки доверия (шифрование, 152-ФЗ), отзывы, тарифы, FAQ-раздел, footer со ссылками на `/pricing` и `/faq`
- **Публичные страницы:** `/about`, `/faq`, `/pricing` с единой навигацией `PublicHeader`; `/pricing` повторяет структуру тарифов из лендинга

## Env vars

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (auto-provisioned) |
| `SESSION_SECRET` | Secret для сессий |
| `CLERK_SECRET_KEY` | Clerk server key (auto via Replit Clerk) |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key для Vite фронтенда |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота (получается у @BotFather) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Replit AI proxy base URL (опционально) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Replit AI proxy key (опционально) |
| `OPENAI_API_KEY` | Прямой OpenAI ключ (опционально) |
| `OPENROUTER_API_KEY` | OpenRouter ключ (опционально) |
| `UPLOADS_DIR` | Папка для загрузок (опционально, по умолчанию `artifacts/api-server/uploads`) |

## Gotchas

- После изменений в `lib/api-spec/openapi.yaml` — обязательно запустить `pnpm --filter @workspace/api-spec run codegen`, затем `pnpm run typecheck`
- После изменений схемы БД — запустить `pnpm --filter @workspace/db run push`
- **Не использовать `format: uuid` / `format: email` в OpenAPI spec** — Orval v8 генерирует Zod v4 синтаксис, несовместимый с Zod v3
- Clerk proxy middleware должен монтироваться **до** `express.json()` — он стримит сырые байты
- `pdf-parse` загружается через CJS `createRequire` в `documentText.ts` — не менять на ESM import
- Clerk в dev-режиме пишет предупреждение про development keys в консоли — это ожидаемо, не ошибка
- `VITE_CLERK_PROXY_URL` — auto-populate в production, не нужно устанавливать вручную в dev
- `FunnelChart` — plain JSX, не TypeScript. Для типобезопасности в строгом TS-проекте добавлен соседний `FunnelChart.d.ts` с ambient declaration; при изменении компонента обновляй и `.d.ts`
- Локализация Clerk — `customOverrides` типизирован как `Record<string, unknown>` и deep-merge с `ruRU`, потому что некоторые ключи (например, `passwordComplexity`) отсутствуют в `@clerk/types` `LocalizationResource`.
