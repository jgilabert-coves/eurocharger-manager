# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start dev server on port 8081
yarn build        # TypeScript check + Vite build
yarn lint         # ESLint check
yarn lint:fix     # ESLint autofix
yarn fm:fix       # Prettier autofix
yarn fix:all      # lint:fix + fm:fix
yarn tsc:watch    # Watch mode TypeScript check (no emit)
```

No test suite exists in this project.

## Architecture

**Eurocharger Manager** is a React 18 + TypeScript SPA for managing EV charging stations. Built on Material UI v6, Vite 6, React Router 7, and TanStack Query.

### Key files

| File | Purpose |
|---|---|
| `src/global-config.ts` | Central config; reads `VITE_SERVER_URL`, `VITE_MAPBOX_API_KEY`, etc. |
| `src/lib/axios.ts` | Axios instance with JWT interceptors + all `endpoints` constants |
| `src/routes/paths.ts` | All client-side route paths |
| `src/routes/sections/index.tsx` | Combines all route sections |
| `src/layouts/nav-config-dashboard.tsx` | Sidebar nav items with optional `roles` filtering |
| `src/auth/types.ts` | `Role` and `Permission` union types |

### Auth

JWT stored in `sessionStorage` under key `jwt_access_token`. The axios request interceptor adds `Authorization: Bearer <token>` automatically. A 401 response clears the token and redirects to sign-in. The `AuthProvider` (`src/auth/context/jwt/auth-provider.tsx`) fetches the current user from `GET /auth/me` on load.

### Adding a new section (pattern)

Every feature follows the same pattern. Use tickets as the reference implementation:

1. **Type** — `src/types/<feature>.d.ts`
2. **API endpoints** — add to `endpoints` object in `src/lib/axios.ts`
3. **Paths** — add to `paths` in `src/routes/paths.ts`
4. **Route section** — `src/routes/sections/<feature>.tsx` (lazy-loaded page, wrapped in `AuthGuard` + dashboard layout)
5. **Register routes** — import and spread in `src/routes/sections/index.tsx`
6. **Pages** — `src/pages/<feature>/` with list and detail views
7. **Nav item** — add entry in `src/layouts/nav-config-dashboard.tsx`; add `roles` array to restrict visibility

### Data fetching

TanStack Query with `staleTime: 2m`, `gcTime: 5m`, no refetch on focus/reconnect. Use `fetcher` for GET, `post`/`patch`/`put`/`del` helpers from `src/lib/axios.ts` as `useMutation` `mutationFn`. Always invalidate related query keys in `onSuccess`.

### Role-based nav visibility

Nav items without a `roles` prop are visible to all authenticated users. Add `roles: ['Eurocharger']` (or other roles from `src/auth/types.ts`) to restrict an item. The layout (`src/layouts/dashboard/layout.tsx`) filters nav items against `user?.roles` from `useAuthContext()`.

### Import order (ESLint enforced)

The perfectionist ESLint plugin enforces strict import ordering. Groups in order: external libs → MUI → routes → utils → layouts/lib → types → components → relative. Within each group, sorted by line length descending. Run `yarn lint:fix` to auto-sort.

### Path aliases

`src/` is aliased — use `import { foo } from 'src/lib/axios'` (no relative `../../`). Also `~` maps to `node_modules/`.

### Environment variables

Required: `VITE_SERVER_URL` (API base URL). Optional: `VITE_MAPBOX_API_KEY`, Firebase/Amplify/Auth0/Supabase vars (unused in current JWT-only config).
