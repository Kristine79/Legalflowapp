# LegalFlow

AI-powered legal practice management platform for Russian law firms. LegalFlow combines case management, client intake, document analysis, task tracking, and communication tools into a single workspace augmented by generative AI.

## Overview

LegalFlow helps lawyers and law firms automate routine work, stay on top of deadlines, and collaborate with clients. The platform includes a public marketing site, a protected CRM dashboard, and an AI assistant that can analyze documents, generate templates, and summarize cases.

**Key value propositions:**
- All case files, documents, and tasks in one place
- AI-powered document analysis and risk extraction
- Telegram and email notifications for deadlines and updates
- Role-based access for attorneys, paralegals, and firm owners
- Russian-language interface and localized Clerk authentication

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, TypeScript, Tailwind CSS 4, shadcn/ui |
| Routing | Wouter |
| State & Data | TanStack Query, React Hook Form, Zod |
| Authentication | Clerk |
| Backend | Node.js, Express 5, TypeScript, esbuild |
| ORM | Drizzle ORM with PostgreSQL |
| AI | OpenAI / OpenRouter compatible API |
| Notifications | Telegram Bot API |
| Monorepo | pnpm workspaces |

## Project Structure

```
workspace/
├── artifacts/
│   ├── legalflow/          # React SPA (marketing site + CRM dashboard)
│   ├── api-server/         # Express API server
│   └── mockup-sandbox/     # Component preview / design sandbox
├── lib/
│   ├── db/                 # Drizzle schema and DB client
│   ├── api-zod/            # Shared request/response schemas
│   ├── api-client-react/   # Generated React hooks from OpenAPI
│   └── api-spec/           # OpenAPI specification and Orval config
├── scripts/                # Development utilities
└── pnpm-workspace.yaml     # Workspace configuration
```

## Features

### Public Marketing Site
- Landing page with feature overview and pricing
- About, FAQ, Pricing, and Demo pages
- Clerk-powered login and registration

### CRM Dashboard (protected)
- **Dashboard** — case funnel, activity charts, and firm analytics
- **Clients / Cases** — matter management and client directory
- **Tasks** — Kanban-style board with deadlines and status filtering
- **Calendar** — court hearings and meetings schedule
- **Documents** — contract storage with AI-powered risk analysis and Q&A
- **AI Tools** — intake analysis, template generation, deadline extraction, and conflict checks
- **Profile / Settings** — firm configuration, language selection, and Telegram integration

### Notifications & Integrations
- Telegram bot for case deadline reminders and status updates
- Email-ready notification infrastructure
- AI document analysis via OpenAI/OpenRouter

## Getting Started

### Prerequisites
- Node.js (managed by Replit environment)
- pnpm
- PostgreSQL database
- Clerk account and credentials
- Telegram bot token (for notifications)
- OpenAI or OpenRouter API key (for AI features)

### Environment Variables

Create and populate the required secrets:

```env
DATABASE_URL=postgresql://...
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
VITE_CLERK_PUBLISHABLE_KEY=pk_...
OPENAI_API_KEY=sk-...
# or OPENROUTER_API_KEY=...
TELEGRAM_BOT_TOKEN=...
SESSION_SECRET=...
UPLOADS_DIR=artifacts/api-server/uploads
NODE_ENV=development
```

### Development

Install dependencies:

```bash
pnpm install
```

Run the database migrations:

```bash
pnpm --filter @workspace/db db:push
```

Start the backend and frontend:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/legalflow run dev
```

Or use the configured Replit workflows for both artifacts.

### Build

```bash
pnpm build
pnpm typecheck
```

The backend is bundled with esbuild into `artifacts/api-server/dist/index.mjs`. The frontend is built into static assets by Vite.

## API Overview

The backend exposes REST endpoints under `/api/*`:

- `GET /api/healthz` — health check
- `/api/users/*` — user sync and profile
- `/api/clients` and `/api/cases` — client and matter CRUD
- `/api/tasks` and `/api/calendar` — task and event management
- `/api/documents` — upload, download, analysis, and Q&A
- `/api/ai/*` — AI analysis, templates, summaries, conflict checks
- `/api/notifications` and `/api/telegram/*` — notifications and Telegram settings
- `/api/analytics` — dashboard analytics and funnel data
- `/api/activities` — activity feed

See `lib/api-spec/openapi.yaml` for the full specification.

## Internationalization

LegalFlow supports Russian and English. The language is managed via a custom `LanguageProvider` and persisted in `localStorage`. Clerk authentication is localized for Russian users.

## Deployment

LegalFlow is designed to run on Replit. Each artifact has its own workflow and preview path. The API server must be deployed alongside the frontend, with the frontend pointing to the backend via the artifact base path. Ensure `PORT` is read from the environment and the upload directory is persistent.

## License

Private — proprietary to the LegalFlow project.
