# FieldService Pro — Documentation

## Table of Contents

| # | Document | Description |
|---|---|---|
| 01 | [Product Overview](./01-product-overview.md) | Vision, target users, market opportunity, competitive landscape |
| 02 | [Feature Roadmap](./02-feature-roadmap.md) | Full feature breakdown across 4 phases (MVP through Enterprise) |
| 03 | [Tech Stack & Architecture](./03-tech-stack.md) | Technology choices, project structure, architecture decisions |
| 04 | [Database Schema](./04-database-schema.md) | Complete schema design with all tables, columns, indexes |
| 05 | [Security Architecture](./05-security.md) | Auth, authorization, tenant isolation, data protection, API security |
| 06 | [API Design](./06-api-design.md) | REST API conventions, all endpoints, real-time events, mobile considerations |
| 07 | [UI/UX Design Principles](./07-ui-design-principles.md) | Design philosophy, color system, key screens, component library, accessibility |
| 08 | [Development Guide](./08-development-guide.md) | Setup, conventions, testing strategy, CI/CD, error handling |

## Quick Start

See [Development Guide](./08-development-guide.md) for setup instructions.

## MVP Feature Summary

The minimum viable product includes:

1. **Auth & Multi-Tenancy** — Company registration, user auth (Supabase), RBAC (5 roles), tenant data isolation
2. **Customer Management** — Customers, properties, equipment, job history, search
3. **Scheduling & Dispatch** — Calendar views, drag-and-drop dispatch board, tech assignment, conflict detection
4. **Job Management** — Create/assign/track jobs, status workflow, photos, notes, signatures
5. **Estimates** — Good/Better/Best options, send to customer, digital approval, convert to job
6. **Invoicing** — Generate from jobs, send to customer, status tracking, payment reminders
7. **Payments** — Stripe integration, online payment links, cash/check recording
8. **Basic Reporting** — Revenue, jobs, invoices, tech productivity
9. **Company Settings** — Branding, tax rates, business hours, user management

## Tech Stack

- **Next.js 15** (App Router) + **React**
- **shadcn/ui** + **Tailwind CSS v4**
- **PostgreSQL** via **Supabase** (DB, Auth, Storage, Realtime)
- **Drizzle ORM**
- **Stripe Connect** (payments)
- **Vercel** (hosting)
