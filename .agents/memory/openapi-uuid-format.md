---
name: OpenAPI UUID format incompatibility
description: format:uuid in OpenAPI spec causes Orval to generate zod.uuid() which breaks in zod v3
---

## Rule
Never use `format: uuid` on string fields in `lib/api-spec/openapi.yaml`.

## Why
Orval generates `zod.uuid()` for fields with `format: uuid`. In zod v3 (workspace catalog uses ^3.x), `zod.uuid()` does not exist as a top-level method — it's `z.string().uuid()`. This causes a TypeScript compile error in the generated api-zod package that blocks codegen.

## How to apply
Use `type: string` (no format) for all UUID path/body parameters and response fields. The runtime validation from the DB layer (drizzle UUID columns) is sufficient.
