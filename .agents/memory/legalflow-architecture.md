---
name: LegalFlow architecture
description: Key decisions for the LegalFlow AI legal SaaS — auth, DB, AI, storage, RBAC, restoration from archive
---

## Stack
- Frontend: React + Vite, Wouter routing, TanStack Query, Clerk auth with custom Russian localization (`clerkRuLocalization` from `@/lib/clerk-localization`), next-themes, i18n context
- Backend: Express + esbuild, Clerk middleware, Drizzle ORM + PostgreSQL
- AI: Replit AI proxy → OpenRouter → OpenAI waterfall
- Storage: local FS `uploads/` directory, base64 JSON upload (25MB limit)
- Telegram: Bot API via TELEGRAM_BOT_TOKEN

## Source of truth
`attached_assets/Legal-Flow/` contains the canonical source code from the archive.
To restore: `cp -r attached_assets/Legal-Flow/artifacts/legalflow/src artifacts/legalflow/src` etc.

## RBAC roles (owner > admin > lawyer > assistant > client)
- Only owner/admin see all data (no userId filter)
- lawyer sees own clients + cases assigned as lawyerId
- assistant sees cases assigned as assistantId
- client sees cases linked to their email

## DB schema (original) — full audit done
All 9 tables align with Drizzle schemas. Applied these manual SQL fixes to bring DB in line:
- `documents`: rename `ai_analysis` → `ai_summary`; add `status text NOT NULL DEFAULT 'pending'`
- `tasks`: drop `assignee_id`
- `users`: drop `onboarding_complete`
- `notifications`: rename `is_read` → `read`; add `channel text`
- `notifications.type`: drop NOT NULL constraint (nullable in schema)
Documents `clientId`/`caseId`: use `|| null` not `?? null` when inserting (empty string fails UUID constraint)

## Clerk proxy
- `clerkProxyMiddleware` is production-only (guard: `NODE_ENV !== 'production'`)
- Clerk dev instances do NOT support the proxy pattern — always returns 400
- `VITE_CLERK_PROXY_URL` is read from env; in dev it should be undefined (direct fetch to clerk.accounts.dev)
- Do NOT inject VITE_CLERK_PROXY_URL in vite.config.ts for dev — it breaks Clerk initialization

**Why:** Clerk's proxy URL feature only works for production instances with a custom CNAME/domain. Dev instances reject any proxy URL with a 400 "unable to attribute this request" error. Removing the `NODE_ENV !== 'production'` guard causes Clerk to break in dev.

## Packages
- api-server requires `"zod": "catalog:"` in dependencies (not just devDependencies) — esbuild bundles it
- Frontend requires `@clerk/types` in devDependencies for type-only imports
- `@types/pdf-parse` belongs in devDependencies, not dependencies
