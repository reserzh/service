# Tech Stack & Architecture

## Stack Overview

| Layer | Technology | Rationale |
|---|---|---|
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

### API Design: Server Actions + REST API

- **Server Actions** (Next.js) for web app mutations — simpler, less boilerplate, built-in progressive enhancement
- **REST API routes** (`/api/v1/*`) for operations that the future mobile app will consume
- Both layers share the same service/business logic layer — no duplication
- API versioning from day one (`/api/v1/`) for future mobile app compatibility

```
┌─────────────────────────────────────────────┐
│                  Clients                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Web App  │  │ Mobile   │  │ Webhooks  │  │
│  │ (Next.js) │  │ (Future) │  │ (3rd pty) │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │              │         │
│  Server Actions   REST API      REST API     │
│       │              │              │         │
│       └──────┬───────┴──────┬───────┘         │
│              │              │                 │
│      ┌───────▼──────┐ ┌────▼─────┐           │
│      │   Service    │ │   Auth   │           │
│      │    Layer     │ │Middleware│           │
│      └───────┬──────┘ └──────────┘           │
│              │                               │
│      ┌───────▼──────┐                        │
│      │   Drizzle    │                        │
│      │     ORM      │                        │
│      └───────┬──────┘                        │
│              │                               │
│      ┌───────▼──────┐                        │
│      │  PostgreSQL  │                        │
│      │  (Supabase)  │                        │
│      └──────────────┘                        │
└─────────────────────────────────────────────┘
```

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, register, forgot password)
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/              # Authenticated app pages
│   │   ├── layout.tsx            # Dashboard shell (sidebar, topbar)
│   │   ├── page.tsx              # Dashboard home / overview
│   │   ├── customers/
│   │   ├── schedule/
│   │   ├── dispatch/
│   │   ├── jobs/
│   │   ├── estimates/
│   │   ├── invoices/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/
│   │   └── v1/                   # Versioned REST API for mobile app
│   │       ├── customers/
│   │       ├── jobs/
│   │       ├── estimates/
│   │       ├── invoices/
│   │       └── ...
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing/marketing page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Reusable form components
│   ├── layout/                   # Shell, sidebar, topbar
│   └── features/                 # Feature-specific components
│       ├── customers/
│       ├── scheduling/
│       ├── jobs/
│       ├── estimates/
│       ├── invoices/
│       └── ...
├── lib/
│   ├── db/
│   │   ├── schema/               # Drizzle schema definitions
│   │   ├── migrations/           # Generated migrations
│   │   ├── index.ts              # DB client
│   │   └── seed.ts               # Seed data for development
│   ├── auth/                     # Auth utilities
│   ├── services/                 # Business logic (shared by server actions + API)
│   │   ├── customers.ts
│   │   ├── jobs.ts
│   │   ├── estimates.ts
│   │   ├── invoices.ts
│   │   └── ...
│   ├── api/                      # API utilities (validation, error handling)
│   ├── stripe/                   # Stripe integration
│   ├── email/                    # Email sending (Resend)
│   ├── sms/                      # SMS sending (Twilio)
│   ├── storage/                  # Supabase Storage utilities
│   └── utils/                    # General utilities
├── actions/                      # Next.js Server Actions
│   ├── customers.ts
│   ├── jobs.ts
│   ├── estimates.ts
│   └── ...
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
└── middleware.ts                  # Next.js middleware (auth, tenant resolution)
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
Vercel (Next.js app)
├── Production: main branch auto-deploy
├── Staging: staging branch auto-deploy
├── Preview: PR-based preview deployments
└── Environment: Edge + Serverless functions

Supabase
├── Production project
├── Staging project (linked via Supabase branching)
└── Local development via Supabase CLI
```
