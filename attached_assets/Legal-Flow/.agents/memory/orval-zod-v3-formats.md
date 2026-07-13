---
name: Orval Zod v3 format gotcha
description: Why OpenAPI `format: uuid` and `format: email` break generated Zod schemas in this workspace and how to avoid it.
---

Orval v8 generates `z.uuid()` and `z.email()` for OpenAPI `format: uuid` / `format: email`. These are Zod v4 APIs. In this workspace zod is pinned to `catalog:` (resolves to `^3.x`), so generated files fail to typecheck with errors like `z.uuid is not a function`.

**Rule:** Remove `format: uuid` and `format: email` from `lib/api-spec/openapi.yaml`. Use plain `type: string` instead. The `Uuid` helper schema in the spec is already defined as `type: string` with no format — use `$ref: "#/components/schemas/Uuid"` for UUID fields.

**Why:** The workspace uses `zod@^3` and `drizzle-zod` which require Zod v3. Orval does not auto-downgrade generated validators for older zod versions.

**How to apply:** After editing `openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` and then `pnpm run typecheck` to catch any new `z.uuid()`/`z.email()` occurrences before they break the build.
