# Tech Stack & Architecture

## Stack Overview

| Layer | Technology | Rationale |
|---|---|---|
| **Build System** | Turborepo + pnpm workspaces | Monorepo with shared code across apps, parallel builds, dependency caching |
| **Framework** | Next.js 15 (App Router) | Full-stack React framework, SSR/SSG, API routes, middleware, great Vercel integration |
| **UI Components** | shadcn/ui + Tailwind CSS v4 | Beautiful, accessible, customizable components. Not a dependency — code lives in your project |
| **Database** | PostgreSQL (Supabase) | Battle-tested relational DB, excellent for multi-tenant SaaS, row-level security |
| **ORM** | Drizzle ORM | Type-safe, lightweight, SQL-like syntax, excellent DX with TypeScript |
| **Auth** | Supabase Auth | Built-in email/password, OAuth, magic links, JWTs, row-level security integration |
| **File Storage** | Supabase Storage | S3-compatible, integrated with auth, good for photos/documents/signatures |
| **Real-Time** | Supabase Realtime | WebSocket-based real-time subscriptions for dispatch board, job status updates |
| **Payments** | Stripe Connect | Multi-tenant payment processing, each company gets their own Stripe account |
| **Email/SMS** | Resend (email) + Twilio (SMS) | Transactional emails and SMS for notifications, estimates, invoices |
| **Hosting** | Vercel | Zero-config Next.js deployment, edge functions, preview deployments |
| **Mobile** | React Native / Expo | Cross-platform iOS and Android from a single codebase, shared types with web apps |
| **Monitoring** | Sentry | Error tracking, performance monitoring |
| **Analytics** | PostHog (self-serve) | Product analytics, feature flags, session replay |

## Architecture Decisions

### Multi-Tenancy Strategy: Shared Database, Tenant Column

We use a **shared database with a `tenant_id` column** on every table. This is the most cost-effective and operationally simple approach for SaaS.

**Why not separate databases per tenant?**
- Supabase pricing is per-project; separate DBs = separate projects = high cost
- Schema migrations become exponentially harder to manage
- Shared DB with proper RLS and application-level enforcement is industry standard

**Data Isolation Strategy:**
1. **Application Layer**: All queries include `tenant_id` filter via Drizzle middleware/helper
2. **Database Layer**: PostgreSQL Row-Level Security (RLS) policies as a second line of defense
3. **API Layer**: Middleware extracts tenant from authenticated user session and injects into request context

### API Design: Server Actions + REST API + Direct DB

Three apps consume data in different ways:

- **BACK app** (admin dashboard): Server Actions for mutations, REST API routes (`/api/v1/*`) for mobile app consumption
- **FRONT app** (public tenant sites): Direct DB queries via shared Drizzle schema for fast, cacheable reads
- **MOBILE app** (React Native): REST API (`/api/v1/*`) served by the BACK app

All three share the same Drizzle schema and TypeScript types from `@fieldservice/shared`. The BACK app's service layer contains business logic shared by server actions and REST API routes — no duplication.

```
┌─────────────────────────────────────────────────────────────┐
│                       Monorepo                               │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐             │
│  │  BACK App  │  │ FRONT App  │  │  MOBILE   │             │
│  │ (Dashboard)│  │(Public Web)│  │(React     │             │
│  │ Next.js 15 │  │ Next.js 16 │  │ Native)   │             │
│  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘             │
│        │               │               │                    │
│   Server Actions   Direct DB      REST API                  │
│   + REST API       Queries       (/api/v1/*)                │
│        │               │               │                    │
│        └───────┬───────┴───────┬───────┘                    │
│                │               │                            │
│       ┌────────▼──────┐  ┌────▼──────┐                     │
│       │@fieldservice/ │  │   Auth    │                      │
│       │   shared      │  │Middleware │                      │
│       │(schema,types) │  │          │                      │
│       └────────┬──────┘  └───────────┘                     │
│                │                                            │
│       ┌────────▼──────┐                                    │
│       │  PostgreSQL   │                                    │
│       │  (Supabase)   │                                    │
│       └───────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
/SERVICE/
├── turbo.json                    # Turborepo config
├── pnpm-workspace.yaml           # Workspace definitions
├── package.json                  # Root scripts
├── apps/
│   ├── back/                     # Admin Dashboard (Next.js 15)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/       # Login, register
│   │   │   │   ├── (dashboard)/  # All admin pages
│   │   │   │   │   ├── customers/
│   │   │   │   │   ├── jobs/
│   │   │   │   │   ├── schedule/
│   │   │   │   │   ├── dispatch/
│   │   │   │   │   ├── estimates/
│   │   │   │   │   ├── invoices/
│   │   │   │   │   ├── reports/
│   │   │   │   │   ├── website/  # CMS / Website Builder
│   │   │   │   │   └── settings/
│   │   │   │   └── api/v1/       # REST API
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   │   ├── services/     # Business logic layer
│   │   │   │   ├── auth/         # Auth + RBAC
│   │   │   │   └── db/           # DB connection (imports from shared)
│   │   │   └── actions/          # Server Actions
│   │   └── docs/                 # This documentation
│   └── front/                    # Public Tenant Websites (Next.js 16)
│       └── src/
│           ├── app/
│           │   ├── [slug]/       # Dynamic CMS pages
│           │   ├── book/         # Online booking flow
│           │   └── api/booking/  # Booking submission endpoint
│           ├── components/
│           │   ├── sections/     # 14 section renderers
│           │   ├── site-header.tsx
│           │   └── site-footer.tsx
│           ├── lib/
│           │   ├── tenant.ts     # Multi-tenant resolution + LRU cache
│           │   ├── queries.ts    # Cached DB queries
│           │   └── db.ts         # DB connection (imports from shared)
│           └── middleware.ts      # Subdomain/custom domain routing
├── packages/
│   └── shared/                   # Shared code
│       └── src/
│           ├── db/schema/        # ALL Drizzle schema definitions
│           ├── types/            # Shared TypeScript types
│           └── templates/        # Starter website templates
└── MOBILE/                       # React Native / Expo app (planned)
```

### Database: PostgreSQL via Supabase

**Why PostgreSQL is the right choice:**
- Relational data model fits FSM perfectly (customers -> properties -> equipment -> jobs -> invoices)
- Row-Level Security for tenant isolation
- Full-text search for customer/job lookup
- JSON columns for flexible metadata
- PostGIS extension available for GPS/geolocation features (Phase 2)
- Excellent indexing for complex queries (reporting)
- Battle-tested at scale for multi-tenant SaaS

**Why Supabase specifically:**
- Managed PostgreSQL with automatic backups
- Built-in Auth that integrates with RLS
- Realtime subscriptions (perfect for dispatch board)
- Storage (photos, signatures, documents)
- Edge Functions if needed
- Generous free tier for development
- Easy connection from Vercel

### Real-Time Updates

The dispatch board and job status updates require real-time data. We use **Supabase Realtime** which provides PostgreSQL change data capture over WebSockets.

Key real-time features:
- Dispatch board: new jobs, reassignments, status changes
- Job status updates: tech starts/completes work
- Notification delivery: new estimates, payments received

### File Storage Strategy

Supabase Storage with organized bucket structure:

```
tenant-{id}/
├── photos/
│   └── jobs/{job-id}/{filename}
├── signatures/
│   └── {job-id}/{filename}
├── documents/
│   ├── estimates/{estimate-id}/{filename}
│   └── invoices/{invoice-id}/{filename}
└── company/
    ├── logo.{ext}
    └── branding/
```

All files are private by default, accessed through signed URLs with expiration.

### Deployment

```
Vercel
├── BACK: app.yourdomain.com (admin dashboard)
├── FRONT: *.yourdomain.com (tenant public sites)
│   └── Custom domains via Vercel Domains API
├── Preview: PR-based preview deployments
└── Environment: Edge + Serverless functions

Supabase
├── Production project
├── Staging project (linked via Supabase branching)
└── Local development via Supabase CLI
```
