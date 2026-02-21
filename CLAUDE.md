# SERVICE — FieldService Pro Monorepo

Multi-tenant field service management platform: backend API, web dashboard, and mobile app.

## Monorepo Structure

```
SERVICE/
├── apps/
│   ├── back/        — Next.js 16 API backend (port 3200)
│   ├── front/       — Next.js 16 web dashboard (port 3201)
│   └── mobile/      — React Native / Expo mobile app
├── packages/
│   ├── api-types/   — Shared API contract types, enums, constants
│   └── shared/      — DB schema (Drizzle), templates, website types
├── supabase/        — Local Supabase config
├── turbo.json       — Turborepo task config
├── pnpm-workspace.yaml
└── .npmrc           — node-linker=hoisted (required for React Native)
```

**Package manager:** pnpm 10.29.3
**Build orchestrator:** Turborepo

## Workspace Packages

| Package | Name | Exports |
|---------|------|---------|
| `packages/api-types` | `@fieldservice/api-types` | `.`, `./enums`, `./models`, `./constants`, `./api` |
| `packages/shared` | `@fieldservice/shared` | `.`, `./db`, `./db/schema`, `./types`, `./templates` |

### Dependency Graph

```
apps/back    → @fieldservice/shared, @fieldservice/api-types
apps/front   → @fieldservice/shared, @fieldservice/api-types
apps/mobile  → @fieldservice/api-types
packages/shared → @fieldservice/api-types
```

`@fieldservice/api-types` is the single source of truth for all API contract types, enums, and business constants (status transitions, label maps). It has no runtime dependencies.

`@fieldservice/shared` derives its Drizzle enum definitions from `api-types` and re-exports `UserRole`/`UserContext` from it. It also owns the DB schema, connection, and website/CMS types.

## Commands

```bash
# Dev (all apps)
pnpm dev

# Dev (single app)
pnpm dev --filter back
pnpm dev --filter front

# Typecheck all
pnpm typecheck

# Build all
pnpm build

# Lint all
pnpm lint

# Database (from apps/back/)
pnpm db:generate    # Generate Drizzle migrations
pnpm db:migrate     # Run migrations
pnpm db:push        # Push schema to DB
pnpm db:studio      # Open Drizzle Studio
pnpm db:seed        # Seed database

# Mobile (from apps/mobile/)
npx expo start
```

## Database

- **ORM:** Drizzle ORM with PostgreSQL
- **Schema location:** `packages/shared/src/db/schema/`
- **Migrations:** `apps/back/src/lib/db/migrations/`
- **Drizzle config:** `apps/back/drizzle.config.ts`
- **DB schema namespace:** `fieldservice`
- **Local Supabase:** port 54331 (API), port 54332 (DB)
- **Connection:** `DATABASE_URL` env var (default: `postgresql://postgres:postgres@localhost:54332/postgres`)

Schema modules: `tenants`, `users`, `customers`, `jobs`, `estimates`, `invoices`, `system`, `website`, `enums`

## Environment Variables

Copy `.env.example` to `.env.local` in `apps/back/` and `apps/front/`. Key vars:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase auth
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side Supabase admin
- `DATABASE_URL` — Direct Postgres connection for Drizzle
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Payments
- `RESEND_API_KEY` — Email
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3200`

## Mobile App

- **Framework:** Expo SDK 54, React Native 0.81, Expo Router 6
- **Bundle ID:** `com.fieldservicepro.app`
- **Styling:** NativeWind (Tailwind for RN)
- **State:** Zustand + TanStack Query with MMKV persistence
- **Auth:** Supabase via `@supabase/supabase-js` + Expo Secure Store

Metro is configured for monorepo resolution (`metro.config.js` watches the monorepo root and resolves `node_modules` from both local and root).

Mobile imports types via `@fieldservice/api-types`. The local `src/types/models.ts` and `src/lib/constants.ts` are re-export barrels — all definitions live in `packages/api-types/`.

## Conventions

- TypeScript strict mode everywhere
- Zod for validation
- `@/*` path alias maps to `./src/*` in all apps
- shadcn/ui + Radix UI in Next.js apps
- Lucide icons (lucide-react in web, lucide-react-native in mobile)
- All workspace packages use `workspace:*` protocol
- tsconfig `paths` + `include` entries required for each workspace dependency (no build step — raw `.ts` imports via bundler resolution)
