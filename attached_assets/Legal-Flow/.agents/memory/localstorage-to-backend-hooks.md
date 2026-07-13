---
name: Legacy localStorage-to-backend migration
description: Pattern for migrating legacy demo apps that store domain data in localStorage to the workspace's generated React Query hooks.
---

When porting a localStorage-first app into this workspace, keep only transient UX state in `localStorage` (e.g., onboarding flag, language preference). All domain data (clients, cases, activities, notifications, documents) must flow through the generated React Query hooks in `@workspace/api-client-react`.

**Rule:** Replace local `recordActivity`/`saveX` helpers with calls to the generated mutation hooks (`useCreateActivity`, `useCreateClient`, etc.), and invalidate related query keys on success.

**Why:** The backend owns the data and provides the shared source of truth across devices and users. LocalStorage-only updates create a split-brain where the UI shows stale data and the backend never sees the change.

**How to apply:**
1. Identify every place that writes to `localStorage` for domain data.
2. Map the write to a generated mutation hook or a direct backend endpoint.
3. Add `queryClient.invalidateQueries({ queryKey: [...] })` in the mutation's `onSuccess`.
4. Keep only UI-only flags (e.g., `onboardingComplete`, `language`) in `localStorage`.
5. Remove the old storage helper or restrict it to export/backup utilities only.

**In LegalFlow specifically:** `lib/automation.ts` contains `runCreateClientAutomation` and `record*` helpers. These call `POST /activities` and `POST /notifications/telegram` through the API — they are already backend-driven. The `lib/storage.ts` file now only handles the onboarding completion flag.
