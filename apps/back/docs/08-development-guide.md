# Development Guide

## Prerequisites

- Node.js 20+ (LTS)
- pnpm 9+ (`npm install -g pnpm`)
- Supabase CLI
- Git

## Getting Started

```bash
# Clone the repo
git clone <repo-url>
cd service

# Install all dependencies (monorepo-wide)
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in Supabase, Stripe, etc.

# Start Supabase locally
npx supabase start

# Run database migrations (from back app)
pnpm --filter back db:migrate

# Seed development data
pnpm --filter back db:seed

# Start all apps in development
pnpm dev

# Or start individual apps:
pnpm --filter back dev      # Admin dashboard at localhost:3000
pnpm --filter front dev     # Public sites at localhost:3001
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (Resend)
RESEND_API_KEY=re_...

# SMS (Twilio) — optional for local dev
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Website Builder (optional — for custom domain provisioning)
VERCEL_API_TOKEN=            # Vercel API token for domain management
VERCEL_PROJECT_ID=           # The FRONT project ID on Vercel
VERCEL_TEAM_ID=              # (optional) Vercel team ID

# FRONT app
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_BACK_URL=http://localhost:3000
```

## Project Scripts

```json
// Root package.json
{
  "dev": "turbo dev",
  "build": "turbo build",
  "lint": "turbo lint",
  "typecheck": "turbo typecheck"
}

// apps/back/package.json
{
  "dev": "next dev",
  "build": "next build",
  "typecheck": "tsc --noEmit",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}

// apps/front/package.json
{
  "dev": "next dev --port 3001",
  "build": "next build",
  "typecheck": "tsc --noEmit"
}
```

## Code Style & Conventions

### TypeScript

- Strict mode enabled
- No `any` types — use `unknown` and narrow
- Prefer interfaces for object shapes, types for unions/intersections
- Use `as const` for constant objects
- Zod schemas are the source of truth for runtime validation

### File Naming

- Components: PascalCase (`CustomerList.tsx`)
- Utilities/hooks: camelCase (`useCustomers.ts`, `formatCurrency.ts`)
- Schema files: kebab-case (`job-schema.ts`)
- Route files: Next.js conventions (`page.tsx`, `layout.tsx`, `route.ts`)

### Component Structure

```typescript
// 1. Imports
import { ... } from '...';

// 2. Types
interface CustomerListProps {
  initialData: Customer[];
}

// 3. Component
export function CustomerList({ initialData }: CustomerListProps) {
  // hooks
  // derived state
  // handlers
  // render
}
```

### Server Actions

```typescript
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { createCustomer } from '@/lib/services/customers';

const schema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  // ...
});

export async function createCustomerAction(formData: FormData) {
  const ctx = await requireAuth();
  const input = schema.parse(Object.fromEntries(formData));
  const customer = await createCustomer(ctx, input);
  revalidatePath('/customers');
  return customer;
}
```

### API Routes

```typescript
// src/app/api/v1/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { listCustomers, createCustomer } from '@/lib/services/customers';

export async function GET(req: NextRequest) {
  const ctx = await requireApiAuth(req);
  const params = parseQueryParams(req);
  const result = await listCustomers(ctx, params);
  return NextResponse.json({ data: result.data, meta: result.meta });
}

export async function POST(req: NextRequest) {
  const ctx = await requireApiAuth(req);
  const body = await req.json();
  const customer = await createCustomer(ctx, body);
  return NextResponse.json({ data: customer }, { status: 201 });
}
```

### Service Layer

```typescript
// apps/back/src/lib/services/customers.ts
import { db } from '@/lib/db';
import { customers } from '@fieldservice/shared/db/schema';
import type { UserContext } from '@/lib/auth';

export async function createCustomer(ctx: UserContext, input: CreateCustomerInput) {
  assertPermission(ctx, 'customers', 'create');

  const [customer] = await db.insert(customers).values({
    tenantId: ctx.tenantId,
    createdBy: ctx.userId,
    ...input,
  }).returning();

  await logActivity(ctx, 'customer', customer.id, 'created');
  return customer;
}
```

## Working with the Shared Package

The `@fieldservice/shared` package (`packages/shared/`) contains code shared between apps:

- **Database schema** (`db/schema/`) — All Drizzle schema definitions. Both apps import from here.
- **Types** (`types/`) — Shared TypeScript types (UserContext, SiteTheme, SectionContent, etc.)
- **Templates** (`templates/`) — Website starter templates (HVAC, Plumbing, General)

To add new shared code:
1. Add files to `packages/shared/src/`
2. Export from `packages/shared/src/index.ts` or add a new export path in `package.json`
3. Import in apps using `@fieldservice/shared` or `@fieldservice/shared/db/schema`

The shared package uses TypeScript path mapping — no build step required. Changes are picked up immediately in dev mode.

## Testing Strategy

### Unit Tests (Vitest)

- Service layer functions
- Utility functions
- Zod schemas
- Permission logic

### Integration Tests (Vitest + test DB)

- API routes with real database
- Server actions
- Complex queries

### E2E Tests (Playwright)

- Critical user flows: login, create customer, create job, create estimate, create invoice, process payment
- Dispatch board drag-and-drop
- Estimate approval flow

### Test Database

- Separate Supabase project or local instance for tests
- Migrations applied before test suite
- Each test gets a clean tenant (created in beforeEach, cleaned in afterEach)
- Factory functions for generating test data

## CI/CD Pipeline

```yaml
# GitHub Actions
on: [push, pull_request]

jobs:
  check:
    - pnpm install
    - pnpm lint
    - pnpm typecheck
    - pnpm test
    - pnpm build

  e2e:
    - Start test Supabase
    - Run migrations
    - pnpm test:e2e

  deploy:
    - Vercel auto-deploys from main (production) and PRs (preview)
```

## Database Migrations Workflow

```bash
# 1. Modify schema files in packages/shared/src/db/schema/
# 2. Generate migration (from back app, which has drizzle.config.ts)
pnpm --filter back db:generate

# 3. Review generated SQL
# 4. Apply migration locally
pnpm --filter back db:migrate

# 5. Test
pnpm typecheck

# 6. Commit migration files
git add .
git commit -m "Add site_settings table"
```

## Error Handling

```typescript
// Custom error classes
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super('FORBIDDEN', 'You do not have permission to perform this action', 403);
  }
}

// Global error handler in API routes
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }
  // Log unexpected errors, return generic 500
  console.error(error);
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 }
  );
}
```
