# src/CLAUDE.md

> **Inherits from:** [`../CLAUDE.md`](../CLAUDE.md) — all root directives apply here.

## Scope

This guide applies to all code within `src/`. It extends root directives with Vercel/Next.js/TypeScript-specific guardrails.

**References:** `.agents/frontend.md` for detailed patterns | `system_design_docs/PRD_frontend.md` for file structure

---

## Next.js App Router Essentials

- **Server Components by default**: Only add `'use client'` when necessary (interactivity, hooks, browser APIs)
- **File conventions**: Use `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- **Route Groups**: Use `(groupName)` folders for organization without affecting URLs
- **No Pages Router patterns**: No `getServerSideProps`/`getStaticProps` — use Server Components
- **Route Handlers**: Use `route.ts` with named exports (`GET`, `POST`, etc.)
- **Validate inputs**: Use Zod at API boundaries; return proper status codes

---

## TypeScript Quick Rules

- **No `any`**: Use `unknown` + type narrowing, or define interfaces
- **No `@ts-ignore`**: Use `@ts-expect-error` with explanation, or fix the type
- **Explicit return types**: Required for exported functions and API handlers
- **Readonly by default**: Use `readonly` for props and immutable data
- **Null safety**: Use `?.` and `??` — never use non-null assertions (`!`)
- **Interfaces for objects, types for unions**: See `.agents/frontend.md` for examples

---

## Vercel Deployment & Performance

### Environment Variables

- **`NEXT_PUBLIC_*`**: Only for client-safe values (never secrets)
- **Server secrets**: Access via `process.env` in Server Components/API routes only
- **Validate at startup**: Check required env vars exist early

### Performance Optimization

- **Eliminate waterfalls**: Parallelize independent fetches with `Promise.all()`
- **Streaming**: Use Suspense boundaries for progressive loading
- **Preload on intent**: Prefetch resources on hover/focus before click
- **Bundle analysis**: Monitor with `@next/bundle-analyzer`; avoid large client imports
- **Dynamic imports**: Use `next/dynamic` for heavy components not needed initially
- **Image/Font optimization**: Always use `next/image` and `next/font`

### Caching Strategy

- **`fetch()` caching**: Leverage Next.js automatic deduplication
- **ISR**: Use `revalidate` for static pages needing periodic updates
- **Stale-while-revalidate**: Return cached data immediately, refresh in background

### Platform Awareness

- **Fluid Compute**: Auto-scales, zero-config — write normal async code
- **Edge Runtime**: If using `runtime = 'edge'`, avoid Node.js-only APIs
- **Serverless limits**: 50MB function size, 10s default timeout
- **Preview deployments**: Every PR gets a preview URL

---

## Anti-Patterns (Quick Reference)

| Anti-Pattern | Do Instead |
|--------------|------------|
| `any` type | `unknown` + narrowing |
| Inline styles | Tailwind utilities |
| `<div onClick>` | `<button>` semantic HTML |
| Sequential awaits | `Promise.all()` for independent fetches |
| Barrel imports (`index.ts` re-exports) | Direct imports |
| `useEffect` for data fetching | Server Components |
| `useState` + `useEffect` for form state | `useActionState` |
| Props drilling | Composition, context, or server components |

---

## React 19 Patterns

- **Server Actions**: Use `'use server'` directive; validate all inputs
- **Hooks at top level only**: Never in conditions, loops, or nested functions
- **`useActionState`**: For form submission state
- **`useOptimistic`**: For optimistic UI updates
- **Suspense boundaries**: Wrap async components for loading states
- **Error boundaries**: Use `error.tsx` at route level

---

## Pre-Commit Checklist

- [ ] No `'use client'` unless required?
- [ ] No `any` types introduced?
- [ ] No request waterfalls (parallel fetches)?
- [ ] Heavy components use `next/dynamic`?
- [ ] API inputs validated with Zod?
- [ ] Images use `next/image`?
- [ ] No secrets in `NEXT_PUBLIC_*` vars?
- [ ] `npm run build` succeeds?
