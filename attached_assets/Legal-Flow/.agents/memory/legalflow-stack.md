---
name: LegalFlow stack
description: Key architecture decisions, gotchas, and pointers for the LegalFlow AI-CRM project.
---

## RBAC
Five roles: `owner > admin > lawyer > assistant > client`. Every DB query in api-server routes applies a per-role SQL filter from `lib/rbac.ts`. Super-roles (owner/admin) bypass all filters with `undefined` returned from access filter helpers.

## AI provider waterfall
Priority order in `artifacts/api-server/src/lib/ai.ts`:
1. `AI_INTEGRATIONS_OPENAI_API_KEY` + `AI_INTEGRATIONS_OPENAI_BASE_URL` (Replit AI Integrations)
2. `OPENROUTER_API_KEY` → base URL `https://openrouter.ai/api/v1`
3. `OPENAI_API_KEY` + optional `OPENAI_BASE_URL`

No AI key configured → AI features return 503. The frontend (`lib/ai.ts`) has a local heuristic fallback for intake analysis when the backend AI is unavailable.

## Clerk proxy
`clerkProxyMiddleware` in `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` must be mounted **before** `express.json()` — it streams raw bytes. Production-only (no-op in dev). `VITE_CLERK_PROXY_URL` is auto-populated in production — never hardcode it.

## pdf-parse workaround
`documentText.ts` loads pdf-parse via CJS `createRequire` workaround due to ESM bundling issues with pdf-parse v2 in esbuild.

**Why:** pdf-parse v2 is ESM-only without a default export when bundled by esbuild. CJS require works around this.

**Do not** change to `import pdfParse from 'pdf-parse'` — it will break the esbuild bundle.

## Codegen rule
Run `pnpm --filter @workspace/api-spec run codegen` after any change to `lib/api-spec/openapi.yaml`. Codegen also runs `pnpm -w run typecheck:libs`. Never use `format: uuid` or `format: email` in the spec — see `orval-zod-v3-formats.md`.

## Activity automation
`artifacts/legalflow/src/lib/automation.ts` contains automation helpers (`runCreateClientAutomation`, `recordClientDeleted`, etc.). These write activities via `POST /activities` and optionally send Telegram notifications via `POST /notifications/telegram`. They are backend-driven — not localStorage.

## File uploads
Max file size: 10 MB. Supported types: PDF, DOCX, DOC, ODT, TXT, MD, RTF. Text is extracted at upload time and stored in `textContent` column for later AI analysis. Storage path is relative to `UPLOADS_DIR` (default: `artifacts/api-server/uploads/`).

## Clerk Russian localization
`artifacts/legalflow/src/lib/clerk-localization.ts` deep-merges the official `@clerk/localizations` `ruRU` package with project-specific overrides.

**Why:** Hand-rolled overrides left many Clerk screens partially in English (password placeholders, strength hints, payment-method dev labels). Using the official `ruRU` resource covers the full surface, while overrides keep the product tone consistent.

**How to apply:** Always add new Clerk strings through `customOverrides` and merge into `ruRU`. Type `customOverrides` as `Record<string, unknown>` (not `LocalizationResource`) because some override keys, such as `passwordComplexity`, are missing from `@clerk/types` and would fail strict type-check.

## JSX component in strict TS monorepo
`artifacts/legalflow/src/components/dashboard/FunnelChart.jsx` is intentionally plain JSX, not TSX. It ships with a sibling `FunnelChart.d.ts` ambient declaration so TypeScript consumers can import it without errors.

**Why:** The project is configured for strict TypeScript and has no `allowJs` + implicit JS-file type acquisition. A JSX file without a declaration would break `tsc --noEmit` for consumers.

**How to apply:** When adding a plain JS/JSX component to this package, create a matching `.d.ts` ambient declaration that exports the component type. Update both files together when the component signature changes.
