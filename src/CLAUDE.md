# src/CLAUDE.md

> **Inherits from:** [`../CLAUDE.md`](../CLAUDE.md) — all root directives apply here.

## Scope

This guide applies to all code within `src/`. It extends root directives with Vercel/Next.js/TypeScript-specific guardrails.

---

## Next.js Best Practices

### App Router Conventions

- **File-based routing**: Use `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` conventions
- **Server Components by default**: Only add `'use client'` when necessary (interactivity, hooks, browser APIs)
- **Colocation**: Keep components, styles, and tests near their route segments
- **Route Groups**: Use `(groupName)` folders for organization without affecting URL structure

### Data Fetching

- **Server Components**: Fetch data directly in components using `async/await`
- **No `getServerSideProps`/`getStaticProps`**: These are Pages Router patterns — use Server Components instead
- **Caching**: Use `fetch()` with Next.js cache options; understand `revalidate` behavior
- **Parallel fetching**: Use `Promise.all()` for independent data requests

### API Routes

- **Route Handlers**: Use `route.ts` files with named exports (`GET`, `POST`, etc.)
- **Validate inputs**: Use Zod or similar at API boundaries
- **Return proper status codes**: 400 for bad input, 401/403 for auth, 500 for server errors
- **Stream large responses**: Use `ReadableStream` for file downloads or long-running operations

---

## TypeScript Standards

### Strict Mode Enforcement

- **No `any`**: Use `unknown` and narrow types, or define proper interfaces
- **No `@ts-ignore`**: Fix the type issue or use `@ts-expect-error` with explanation
- **Explicit return types**: Required for exported functions and API handlers
- **Readonly by default**: Use `readonly` for props and immutable data

### Type Patterns

```typescript
// Prefer interfaces for objects
interface User {
  readonly id: string;
  name: string;
}

// Use type for unions, intersections, primitives
type Status = 'pending' | 'success' | 'error';

// Props pattern
interface ComponentProps {
  readonly children: React.ReactNode;
  onSubmit: (data: FormData) => Promise<void>;
}
```

### Null Safety

- **No non-null assertions (`!`)**: Handle null cases explicitly
- **Optional chaining**: Use `?.` for potentially undefined chains
- **Nullish coalescing**: Use `??` over `||` for defaults (avoids falsy bugs)

---

## Vercel Deployment Guardrails

### Environment Variables

- **`NEXT_PUBLIC_*`**: Only for client-safe values (never secrets)
- **Server-only secrets**: Access via `process.env` in Server Components/API routes only
- **Validate at startup**: Check required env vars exist in instrumentation or config

### Performance

- **Image optimization**: Always use `next/image` with explicit `width`/`height`
- **Font optimization**: Use `next/font` for self-hosted fonts
- **Bundle size**: Monitor with `@next/bundle-analyzer`; avoid large client imports
- **Dynamic imports**: Use `next/dynamic` for heavy components not needed on initial load

### Edge Compatibility

- **Edge Runtime**: If using `export const runtime = 'edge'`, avoid Node.js-only APIs
- **Middleware**: Keep lightweight; runs on every request at the edge
- **Serverless limits**: Be aware of 50MB function size limit, 10s default timeout

### Build & Deploy

- **`output: 'standalone'`**: Use for Docker deployments
- **ISR**: Use `revalidate` for static pages that need periodic updates
- **Preview deployments**: Every PR gets a preview URL — use for testing

---

## React 19 Patterns

### Server Actions

```typescript
// Define in Server Component or 'use server' file
async function submitForm(formData: FormData) {
  'use server';
  // Validate, process, redirect
}
```

### Hooks Rules

- **Only call at top level**: Never in conditions, loops, or nested functions
- **Custom hooks**: Prefix with `use`, compose smaller hooks
- **`useActionState`**: For form submission state management
- **`useOptimistic`**: For optimistic UI updates

### Component Patterns

- **Composition over props drilling**: Use children and slots
- **Suspense boundaries**: Wrap async components for loading states
- **Error boundaries**: Use `error.tsx` at route level, `ErrorBoundary` for component-level

---

## File Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (routes)/          # Route groups
│   ├── api/               # API route handlers
│   └── globals.css        # Global styles
├── components/            # Shared React components
│   ├── ui/               # Primitive UI components
│   └── features/         # Feature-specific components
├── lib/                   # Utilities, helpers, shared logic
├── types/                 # TypeScript type definitions
└── CLAUDE.md             # This file
```

---

## Checklist Before Committing

- [ ] No `'use client'` unless required?
- [ ] No `any` types introduced?
- [ ] API inputs validated?
- [ ] Images use `next/image`?
- [ ] No secrets in `NEXT_PUBLIC_*` vars?
- [ ] `npm run build` succeeds?
