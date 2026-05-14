# nyanko

A full-stack anime / manga / character / voice-actor tracker. Multi-source data layer aggregating MyAnimeList (via Jikan) and AniList, with Redis-backed response caching, per-source rate limiting, and a content-based recommendation engine.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| Auth | Clerk |
| Database | PostgreSQL via Drizzle ORM |
| Cache | Upstash Redis (REST) with an in-process LRU fallback |
| External data | Jikan v4 REST (MyAnimeList) + AniList GraphQL |
| File uploads | UploadThing |

## Features

- **Track anime and manga**: per-user lists with status, score, episodes watched, notes, and dates.
- **Multi-content browsing**: anime, manga, characters, voice actors / staff — all fetched via a unified service layer.
- **Search**: basic search + advanced search across all content types.
- **Social**: friend requests, friend graph, public/private profiles.
- **Profile with stats**: segmented progress bar showing watch time broken down by status; episode-management helpers with optimistic updates.
- **Personalised recommendations**: `GET /api/recommendations` returns a ranked list of anime the user hasn't seen, scored against a content-based taste profile built from their watched list.

## Architecture

### Multi-source data layer

The app reads from **two anime metadata sources** in parallel:

| Source | Endpoint | Strengths |
|---|---|---|
| Jikan v4 (MyAnimeList) | `https://api.jikan.moe/v4` (REST) | Largest community, authoritative airing status, MAL IDs across the ecosystem |
| AniList | `https://graphql.anilist.co` (GraphQL) | Richer cover art, more accurate scores, season metadata |

`src/lib/multi-source.ts` (`multiSourceAPI`) fans out each request to both, merges the responses on a field-by-field basis (preferring the more complete value), and returns the combined record. If one source fails, the other transparently fills in.

`src/server/db/schema.ts` ships an `items` + `externalIdMappings` schema so a single internal item ID maps to N external service IDs — adding a third source (Kitsu, AnimeNewsNetwork) only requires a new adapter file, not schema changes.

### Caching

`src/lib/cache.ts` exposes a tiny `cache` object with `get` / `set` / `del` / `withCache`. Backend selection:

- If `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set: backed by **Upstash Redis** (`@upstash/redis`).
- Otherwise: an **in-process Map** with TTL + size-based eviction (suitable for local dev without an Upstash account).

Centralised TTLs (`src/lib/cache.ts → TTL`):

| Constant | Seconds | Used for |
|---|---|---|
| `SEARCH` | 300 | Search results (results change as new shows air) |
| `ITEM_DETAILS` | 3600 | Single anime / character / etc. details |
| `TOP_LISTS` | 1800 | `/top/anime`, `/top/manga` |
| `TAXONOMY` | 86400 | Genre lists (effectively static) |

Cache keys are namespaced by source (`v1:jikan:...`, `v1:anilist:...`) so we can purge one source at a time during outages.

### Rate limiting

`src/lib/rate-limiter.ts` runs a **token-bucket per source**, sized to that service's documented limit:

- `jikan`: 2 req/s sustained, burst 5 (Jikan publishes 3 req/s; we stay conservative)
- `anilist`: 1.4 req/s sustained, burst 5 (90 req/min)

Every external call funnels through `await rateLimit(source)` before issuing the fetch. The bucket refills continuously, so bursts within capacity go through with zero delay and only sustained pressure introduces backpressure.

### Recommendation engine

`src/lib/recommendation.ts` implements content-based scoring:

1. From the user's watched list, build a **taste profile**: each genre / theme / studio / demographic gets a weight, signed and scaled by the user's score for shows carrying that tag (rating-derived weight × status multiplier).
2. For each candidate (drawn from `/top/anime` and not in the user's list), sum the user's weights across the candidate's tags, then normalize by `sqrt(tag_count)` to avoid bias toward heavily-tagged shows.
3. Add a quality-prior bump based on the candidate's average rating.
4. Sort descending, return top N.

Pure, deterministic, easy to unit-test. The API route at `src/app/api/recommendations/route.ts` glues this to authenticated user state + the cached multi-source API.

## Local development

```sh
# install deps
pnpm install

# set up Postgres (local)
brew services start postgresql@15
createdb anime-web
pnpm db:push

# run
pnpm dev
```

Required env vars (`.env.local`):

```
DATABASE_URL=postgresql://user@localhost:5432/anime-web
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
UPLOADTHING_TOKEN=...
```

Optional (enables real Redis caching; falls back to in-memory if missing):

```
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

## Scripts

```sh
pnpm dev          # next dev --turbo
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # next lint
pnpm db:push      # push schema to DB
pnpm db:studio    # open Drizzle Studio
```

## Source layout

```
src/
  app/
    api/              # Next.js API routes (anime-list, friends, profile, recommendations, ...)
    *                 # App-router pages (anime/, manga/, profile/, search/, ...)
  components/         # UI components
  lib/
    cache.ts          # cache backend selector + TTL constants
    cache-keys.ts     # namespaced key generators
    rate-limiter.ts   # token-bucket per source
    multi-source.ts   # Jikan + AniList aggregator
    recommendation.ts # taste-profile scoring engine
    enhanced-api.ts   # internal-ID-aware wrapper over Jikan
    id-mapping.ts     # mapping table service (external IDs ↔ internal items)
    api-utils.ts      # HTTP status, error class, requireAuth/requireDatabase
  server/db/          # schema + Drizzle client
  utils/
    api.ts            # Jikan REST client
    anilist-api.ts    # AniList GraphQL client
```
