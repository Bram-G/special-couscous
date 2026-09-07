# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is the **frontend** repo. The git root is `special-couscous/`, but the Next.js
app lives in the `MovieMonday/` subdirectory — `package.json`, `app/`, `components/`,
etc. are all there. **Run every command from inside `MovieMonday/`.**

The backend is a separate repo (`SpecialCouscousBackEnd`, also configured as a
working directory). The frontend talks to it over HTTP; there is no shared code.

## Commands

Run from `MovieMonday/` (package manager is **yarn**):

```bash
yarn dev      # next dev — local dev server on :3000
yarn build    # next build
yarn start    # serve a production build
yarn lint     # eslint --fix over .ts/.tsx
```

There is no test suite.

`next.config.js` sets `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors`,
so **`yarn build` will not catch type or lint errors**. For real type checking run
`npx tsc --noEmit` from `MovieMonday/`.

## Environment

- `NEXT_PUBLIC_API_URL` — backend base URL; defaults to `http://localhost:8000`
  when unset (see `contexts/AuthContext.tsx`, `hooks/useAnalyticsTable.ts`, and
  many components that each declare their own `API_BASE_URL` const).
- `NEXT_PUBLIC_TMDB_API_KEY` — TMDB v3 API key. TMDB is called **directly from
  client components** (`utils/analyticsUtils.tsx`, `utils/watchlistUtils.tsx`,
  homepage scrollers, actor pages), not proxied through the backend.

## Architecture

**App Router (Next 14).** Path alias `@/*` resolves to `MovieMonday/*`. Pages are
mostly `"use client"`. Root `app/layout.tsx` wraps everything in `Providers`
(HeroUI + `next-themes`, default theme **dark**, with a mounted-gate to avoid
hydration mismatch) then `AuthProvider`, then a persistent `Navbar` + centered
`main` container.

**UI kit is HeroUI v2** (`@heroui/*`) — the former NextUI. The README is the stock
NextUI template and is out of date; ignore it. Charts use **Recharts** (wrapped in
`components/analytics/*ChartComponent.tsx`). Drag-reorder (watchlists, movie
selections) uses **@dnd-kit**.

**Auth (`contexts/AuthContext.tsx`).** JWT stored in `localStorage` under `token`.
On mount the provider verifies it against `GET {API}/auth/verify` and hydrates
`user` (incl. `Groups`). Consumers use:
- `authFetch(url, opts)` — `fetch` wrapper that injects `Authorization: Bearer`.
- `currentGroupId` / `setCurrentGroupId` — persisted to `localStorage`; most data
  in the app is **group-scoped**, so this is effectively a required query context.
- `components/protectedRoute.tsx` gates authenticated pages.

**Data flow.** Two sources, kept separate:
1. Own backend (`/api/movie-monday`, `/api/watchlists`, `/api/groups`,
   `/api/analytics`, `/auth`, …) for all persistent app data.
2. TMDB directly from the client for movie metadata, posters, cast, and
   discovery/recommendation lists.

**Analytics** is the most involved area:
- Heavy aggregation happens server-side; the frontend consumes it.
- `hooks/useAnalyticsTable.ts` drives every paginated/sorted/filtered/searched
  table off `GET {API}/api/analytics/table/:type` (debounced search, filter-change
  resets to page 1).
- `utils/analyticsUtils.tsx` holds client-side shaping of the `MovieMonday` data
  type plus TMDB-backed "similar / recommended / by genre / by decade" helpers.
- `components/analytics/` — `AnalyticsTable`, `DataTable`, `AnalyticsOverview`,
  chart wrappers, `MovieDetailsModal`, `EmptyState`.

**Routing conventions.** Many dynamic segments: `[id]` (movies, actors),
`[slug]` (watchlists, groups, public pages), `[username]` (user profiles),
`[token]` (email verification, password reset, group invites). Public/shareable
views live under `app/public/`, `app/user/`, and `app/explore-watchlists/` and use
unauthenticated or optionally-authenticated backend endpoints.

## Deployment

Frontend deploys to Vercel (`movie-monday-beta.vercel.app`, `www.moviemonday.app` —
origins are in the backend CORS allowlist).
