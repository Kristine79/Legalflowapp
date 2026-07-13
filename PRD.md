# Product Requirements Document — LegalFlow

**Status:** In development
**Last updated:** 2026-07-13
**Target market:** Small and medium Russian law firms

---

## 1. Vision

LegalFlow is an AI-augmented legal practice management platform that replaces scattered spreadsheets, email threads, and document folders with a single, secure workspace. It helps attorneys spend less time on administration and more time practicing law.

### Problem Statement

Russian law firms manage cases, documents, deadlines, and client communication across disconnected tools. This leads to:
- Missed deadlines and lost billable hours
- Difficulty finding and reusing past case materials
- Repetitive manual work on contracts and court documents
- Fragmented client communication

### Solution

A unified platform with built-in AI that:
- Organizes cases, clients, documents, and tasks
- Analyzes contracts and legal documents for risks and deadlines
- Sends reminders via Telegram and email
- Provides analytics on firm performance and case pipeline

---

## 2. Target Users

| Persona | Role | Primary Needs |
|---|---|---|
| **Managing Partner** | Firm owner | Firm performance, pipeline visibility, user management |
| **Attorney** | Case owner | Case notes, deadlines, document analysis, client communication |
| **Paralegal** | Support | Task tracking, document organization, calendar updates |
| **Client** | External | Receives updates and notifications (via Telegram/email) |

---

## 3. Functional Requirements

### 3.1 Authentication & User Management

- **FR-1.1** Users must sign in and sign up via Clerk (email + OAuth providers).
- **FR-1.2** The platform must support role-based access: owner, attorney, paralegal.
- **FR-1.3** Users must be synced to the internal database on first login.
- **FR-1.4** Users can select interface language (Russian or English) and theme (light/dark).

### 3.2 Marketing Site

- **FR-2.1** Public landing page must present value proposition, features, pricing, and CTA.
- **FR-2.2** Public pages: About, Pricing, FAQ, Demo, Login, Register.
- **FR-2.3** Marketing copy must be localized for Russian and English audiences.

### 3.3 Dashboard

- **FR-3.1** Dashboard must display a case funnel chart showing matter stages.
- **FR-3.2** Dashboard must display activity charts and recent activity feed.
- **FR-3.3** Dashboard must show quick-action buttons for common tasks.
- **FR-3.4** Analytics must summarize active cases, completed tasks, and client count.

### 3.4 Clients & Cases

- **FR-4.1** Users can create, edit, and archive clients.
- **FR-4.2** Users can create, edit, and archive cases linked to clients.
- **FR-4.3** Cases must have status, category, assigned attorney, and deadline fields.
- **FR-4.4** Client and case pages must support search and filtering.

### 3.5 Tasks

- **FR-5.1** Users can create tasks with title, description, due date, status, and assignee.
- **FR-5.2** Tasks must be filterable by status and searchable by title/description.
- **FR-5.3** Tasks must be displayed in a Kanban-style board grouped by status.
- **FR-5.4** Overdue tasks must be visually highlighted.

### 3.6 Calendar

- **FR-6.1** Users can create, edit, and delete calendar events linked to cases.
- **FR-6.2** Events must support title, date/time, location, and type (hearing, meeting, deadline).
- **FR-6.3** Calendar must support month/week/day views.

### 3.7 Documents

- **FR-7.1** Users can upload, download, and delete documents.
- **FR-7.2** Supported formats: PDF, DOCX, TXT.
- **FR-7.3** Users can request AI analysis of a document to extract risks and key points.
- **FR-7.4** Users can ask questions about a document and receive AI-generated answers.
- **FR-7.5** Documents must be searchable by title and metadata.

### 3.8 AI Tools

- **FR-8.1** AI can analyze client intake text and suggest a legal category and next steps.
- **FR-8.2** AI can generate document templates based on case context.
- **FR-8.3** AI can suggest deadlines and tasks from case materials.
- **FR-8.4** AI can generate case summaries.
- **FR-8.5** AI can perform conflict-of-interest checks against existing clients.

### 3.9 Notifications

- **FR-9.1** Users can connect a Telegram bot to receive personal notifications.
- **FR-9.2** The system must send notifications for upcoming deadlines and task assignments.
- **FR-9.3** Users can configure notification preferences in Settings.
- **FR-9.4** Email notification infrastructure must be in place for future activation.

### 3.10 Search

- **FR-10.1** The global shell search bar must filter or query content on every page that has searchable data.
- **FR-10.2** Dashboard, Documents, and Tasks must support the shell search.
- **FR-10.3** Search should be responsive and debounced.

---

## 4. Non-Functional Requirements

- **NFR-1** The platform must be responsive and usable on desktop screens; mobile support is a future goal.
- **NFR-2** Page loads should be fast; use TanStack Query for caching and optimistic updates.
- **NFR-3** All API endpoints must validate input with Zod and return consistent error shapes.
- **NFR-4** User data must be isolated; access is enforced by Clerk sessions and role checks.
- **NFR-5** AI processing must be asynchronous and timeout-safe.
- **NFR-6** The app must be deployable on Replit with minimal configuration.
- **NFR-7** All user-facing strings must be extractable for localization.

---

## 5. User Flows

### 5.1 First-Time Firm Owner
1. Lands on the marketing site and clicks "Get started".
2. Registers via Clerk (email or OAuth).
3. Completes onboarding (firm name, language, theme).
4. Connects Telegram bot for notifications.
5. Creates the first client and case.
6. Uploads a contract and runs AI analysis.
7. Adds a task with a deadline.

### 5.2 Attorney Daily Workflow
1. Logs in and checks the dashboard for overdue tasks and case funnel.
2. Opens a case, reviews notes and documents.
3. Uses AI to generate a court document template.
4. Adds a calendar event for a hearing.
5. Receives a Telegram reminder before the deadline.

### 5.3 Document Analysis
1. User navigates to Documents and uploads a file.
2. System stores the file and extracts text.
3. User clicks "Analyze".
4. AI returns a structured summary of risks, obligations, and deadlines.
5. User can ask follow-up questions about the document.

---

## 6. Integrations

| Service | Purpose | Required Keys |
|---|---|---|
| **Clerk** | Authentication and user management | `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| **PostgreSQL** | Primary data store | `DATABASE_URL` |
| **OpenAI / OpenRouter** | AI analysis and generation | `OPENAI_API_KEY` or `OPENROUTER_API_KEY` |
| **Telegram Bot API** | User notifications | `TELEGRAM_BOT_TOKEN` |

---

## 7. Success Metrics

- **Activation:** % of new users who create a client and case within 48 hours.
- **Engagement:** Weekly active users, tasks completed, documents analyzed.
- **Retention:** 30-day return rate for attorneys and firm owners.
- **AI Usage:** Number of AI analyses, templates generated, and document Q&A sessions.
- **Notification Reach:** % of users with connected Telegram who receive a weekly reminder.
- **Performance:** API response time p95 < 500ms for core CRUD operations.

---

## 8. Roadmap

### Completed
- [x] Marketing site (Landing, About, Pricing, FAQ, Demo)
- [x] Clerk authentication and role sync
- [x] Dashboard with case funnel and analytics
- [x] Clients, cases, tasks, calendar, documents
- [x] AI document analysis and intake analysis
- [x] Telegram notifications
- [x] Russian and English localization
- [x] Global shell search on Dashboard, Documents, and Tasks

### In Progress / Near Term
- [ ] Email notifications and SMTP configuration
- [ ] Advanced RBAC and audit logging
- [ ] Client portal for external users
- [ ] Billing and time tracking
- [ ] Document version history

### Future
- [ ] Mobile-responsive layout
- [ ] Native mobile app
- [ ] Advanced analytics and reporting exports
- [ ] Multi-jurisdiction support beyond Russia
- [ ] Integration with court electronic filing systems

---

## 9. Open Questions

- Should the client portal be a separate artifact or a protected route within the same app?
- Should document storage be migrated to S3-compatible object storage?
- Which email provider should be the default for transactional notifications?
