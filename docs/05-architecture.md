# Архитектурная диаграмма (C4)

## Контекстная диаграмма (C4 Context)

```mermaid
C4Context
    title Контекстная диаграмма LegalFlow

    Person(юрист, "Юрист", "Подготавливает документы и ведёт дела")
    Person(руководитель, "Руководитель фирмы", "Контролирует сроки и аналитику")

    System(legalflow, "LegalFlow", "AI-ассистент для управления юридической практикой")

    System_Ext(clerk, "Clerk", "Аутентификация и управление пользователями")
    System_Ext(openai, "OpenAI / OpenRouter", "AI-анализ и генерация текста")
    System_Ext(telegram, "Telegram Bot API", "Уведомления пользователям")
    System_Ext(postgres, "PostgreSQL", "Основная база данных")
    System_Ext(storage, "Local Uploads", "Хранилище загруженных документов")

    Rel(юрист, legalflow, "Создаёт дела, загружает документы, управляет задачами")
    Rel(руководитель, legalflow, "Просматривает дашборд и аналитику")
    Rel(legalflow, clerk, "Проверяет сессию и роли")
    Rel(legalflow, openai, "Отправляет текст на анализ / генерацию")
    Rel(legalflow, telegram, "Отправляет уведомления")
    Rel(legalflow, postgres, "Читает и пишет данные")
    Rel(legalflow, storage, "Сохраняет и читает файлы")
```

## Контейнерная диаграмма (C4 Container)

```mermaid
C4Container
    title Контейнерная диаграмма LegalFlow

    Person(юрист, "Юрист", "Пользователь CRM")
    Person(руководитель, "Руководитель", "Администратор фирмы")

    Container_Boundary(c1, "LegalFlow") {
        Container(web, "Frontend", "React 19 + Vite + TypeScript + Tailwind", "SPA с дашбордом, CRM, AI-инструментами")
        Container(api, "API Server", "Node.js + Express 5 + TypeScript", "REST API, бизнес-логика, интеграции")
        Container(db, "Database", "PostgreSQL + Drizzle ORM", "Пользователи, клиенты, дела, задачи, документы, активность")
        Container(storage, "File Storage", "Local filesystem", "Загруженные документы")
        Container(ai, "AI Client", "OpenAI SDK", "Анализ и генерация текста")
        Container(bot, "Telegram Bot", "Telegram API", "Отправка уведомлений")
    }

    System_Ext(clerk, "Clerk", "Auth provider")
    System_Ext(openai, "OpenAI / OpenRouter", "LLM provider")
    System_Ext(telegram, "Telegram", "Messenger")

    Rel(юрист, web, "HTTPS")
    Rel(руководитель, web, "HTTPS")
    Rel(web, api, "REST API / JSON")
    Rel(api, db, "Drizzle ORM / SQL")
    Rel(api, storage, "FS read/write")
    Rel(api, ai, "OpenAI-compatible API")
    Rel(api, bot, "HTTP API")
    Rel(web, clerk, "OAuth / session check")
    Rel(ai, openai, "OpenAI API")
    Rel(bot, telegram, "Telegram Bot API")
```

## Описание контейнеров

| Контейнер | Технология | Назначение |
|---|---|---|
| **Frontend** | React 19 + Vite + TypeScript + Tailwind CSS 4 | SPA: маркетинговый сайт + CRM + AI-инструменты. Маршрутизация через wouter, состояние через TanStack Query и React Hook Form. |
| **API Server** | Node.js + Express 5 + TypeScript | REST API, бизнес-логика, валидация Zod, аутентификация через Clerk, интеграция с AI и Telegram. Сборка через esbuild. |
| **Database** | PostgreSQL + Drizzle ORM | Хранит пользователей, роли, клиентов, дела, задачи, документы, события календаря, уведомления, активность. |
| **File Storage** | Local filesystem (или S3 в будущем) | Хранение загруженных документов. Путь задаётся переменной `UPLOADS_DIR`. |
| **AI Client** | OpenAI SDK / OpenRouter | Вызов LLM для анализа документов, генерации шаблонов, summary дел, проверки конфликтов. |
| **Telegram Bot** | Telegram Bot API | Отправка уведомлений о задачах и дедлайнах. |

## Ключевые маршруты данных

1. **Аутентификация:** Frontend → Clerk → API Server (Clerk JWT проверяется middleware).
2. **Загрузка документа:** Frontend → API Server → File Storage + Database.
3. **AI-анализ:** Frontend → API Server → AI Client → OpenAI/OpenRouter → API Server → Database.
4. **Уведомление:** API Server → Telegram Bot → Telegram API.

## Масштабирование

- Текущий этап: монолитный Express + PostgreSQL + локальное хранилище, развёрнутый в Replit.
- Будущее: вынести Telegram-уведомления и AI-задачи в очередь (Redis/RabbitMQ), мигрировать файлы в S3, добавить горизонтальное масштабирование API-серверов.
