---
name: Profile infinite loop fix
description: How the Profile.tsx "Maximum update depth exceeded" loop was caused and fixed
---

## Rule
`profile` in `use-profile.ts` must be wrapped in `useMemo` with primitive string deps (`user?.name`, `user?.email`, etc.). Without this, any `useEffect` or `useCallback` that includes `profile` as a dependency re-fires on every render.

## Why
`const profile = { name: ..., email: ... }` creates a new object reference on every render. Profile.tsx had two effects that depended on this object:
1. `useEffect(() => { form.reset(profile); }, [profile])` — called react-hook-form's setState on every render → infinite loop
2. `useEffect(..., [serverUser, profile, updateProfile])` — `updateProfile` also depended on `profile` via `useCallback`, so it changed every render too

## How to apply
Any hook that returns a composite object used in downstream `useEffect` / `useCallback` deps MUST memoize it. Use `useMemo` with individual primitive field deps, never create plain objects in hook bodies.
