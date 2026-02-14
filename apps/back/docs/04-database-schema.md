# Database Schema Design

## Design Principles

1. **Tenant isolation**: Every table includes `tenant_id` as a required column and part of composite indexes
2. **Soft deletes**: Critical business data uses `deleted_at` instead of hard deletes
3. **Audit trail**: All tables have `created_at`, `updated_at`, and where relevant `created_by`, `updated_by`
4. **UUIDs**: All primary keys use UUIDs (better for distributed systems, no sequential ID leakage)
5. **Enums as pgEnum**: Status fields use PostgreSQL enums for type safety and performance
6. **Timestamps with timezone**: All timestamps stored as `timestamptz` in UTC

## Entity Relationship Overview

```
tenants
  ├── users (team members)
  ├── customers
  │     ├── properties
  │     │     └── equipment
  │     ├── jobs
  │     │     ├── job_notes
  │     │     ├── job_photos
  │     │     ├── job_signatures
  │     │     └── job_line_items
  │     ├── estimates
  │     │     ├── estimate_options
  │     │     │     └── estimate_option_items
  │     │     └── estimate_signatures
  │     └── invoices
  │           ├── invoice_line_items
  │           └── payments
  └── settings / configurations
```

## Core Tables

### tenants

The root entity. Each company is a tenant.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | varchar(255) | Company name |
| slug | varchar(100) | URL-safe identifier, unique |
| email | varchar(255) | Primary company email |
| phone | varchar(50) | Company phone |
| address_line1 | varchar(255) | |
| address_line2 | varchar(255) | nullable |
| city | varchar(100) | |
| state | varchar(50) | |
| zip | varchar(20) | |
| country | varchar(2) | ISO 3166-1 alpha-2, default 'US' |
| timezone | varchar(50) | e.g., 'America/New_York' |
| logo_url | text | nullable |
| website | varchar(255) | nullable |
| license_number | varchar(100) | nullable, trade license |
| stripe_customer_id | varchar(255) | nullable, for platform billing |
| stripe_connect_id | varchar(255) | nullable, for payment processing |
| subscription_status | enum | trialing, active, past_due, canceled |
| subscription_plan | varchar(50) | nullable |
| settings | jsonb | Flexible settings (tax rates, business hours, etc.) |
| onboarding_completed | boolean | default false |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | nullable, soft delete |

### users

Team members who access the platform. Linked to Supabase Auth.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, matches Supabase Auth user ID |
| tenant_id | uuid | FK -> tenants.id |
| email | varchar(255) | |
| first_name | varchar(100) | |
| last_name | varchar(100) | |
| phone | varchar(50) | nullable |
| role | enum | admin, office_manager, dispatcher, csr, technician |
| avatar_url | text | nullable |
| is_active | boolean | default true |
| color | varchar(7) | Hex color for calendar display |
| hourly_rate | decimal(10,2) | nullable, for job costing |
| can_be_dispatched | boolean | default false (true for technicians) |
| notification_preferences | jsonb | Email/SMS/push preferences |
| last_login_at | timestamptz | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### customers

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| first_name | varchar(100) | |
| last_name | varchar(100) | |
| email | varchar(255) | nullable |
| phone | varchar(50) | |
| alt_phone | varchar(50) | nullable |
| company_name | varchar(255) | nullable, for commercial customers |
| type | enum | residential, commercial |
| source | varchar(100) | nullable, how they found the company |
| tags | text[] | Array of tags |
| notes | text | nullable, general notes |
| do_not_contact | boolean | default false |
| stripe_customer_id | varchar(255) | nullable, for payment processing |
| created_by | uuid | FK -> users.id |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | nullable |

**Indexes:** `(tenant_id, last_name, first_name)`, `(tenant_id, email)`, `(tenant_id, phone)`, full-text on `first_name || last_name || email || phone`

### properties

A customer can have multiple service locations.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| customer_id | uuid | FK -> customers.id |
| name | varchar(255) | nullable, e.g., "Main Office", "Lake House" |
| address_line1 | varchar(255) | |
| address_line2 | varchar(255) | nullable |
| city | varchar(100) | |
| state | varchar(50) | |
| zip | varchar(20) | |
| latitude | decimal(10,7) | nullable, for mapping/routing |
| longitude | decimal(10,7) | nullable |
| access_notes | text | nullable, gate codes, parking, etc. |
| is_primary | boolean | default false |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### equipment

Equipment tracked at a property.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| property_id | uuid | FK -> properties.id |
| customer_id | uuid | FK -> customers.id |
| type | varchar(100) | e.g., "AC Unit", "Furnace", "Water Heater" |
| brand | varchar(100) | nullable |
| model | varchar(100) | nullable |
| serial_number | varchar(100) | nullable |
| install_date | date | nullable |
| warranty_expiry | date | nullable |
| location_in_property | varchar(255) | nullable, e.g., "Attic", "Basement" |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### jobs

The core work order entity.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| job_number | varchar(50) | Auto-generated, tenant-scoped sequential (e.g., "JOB-001") |
| customer_id | uuid | FK -> customers.id |
| property_id | uuid | FK -> properties.id |
| estimate_id | uuid | nullable FK -> estimates.id, if created from estimate |
| assigned_to | uuid | nullable FK -> users.id (technician) |
| status | enum | new, scheduled, dispatched, in_progress, completed, canceled |
| priority | enum | low, normal, high, emergency |
| job_type | varchar(100) | e.g., "Repair", "Install", "Maintenance", "Inspection" |
| service_type | varchar(100) | nullable, e.g., "HVAC", "Plumbing" |
| summary | varchar(500) | Short description |
| description | text | nullable, detailed description |
| scheduled_start | timestamptz | nullable |
| scheduled_end | timestamptz | nullable |
| actual_start | timestamptz | nullable, when tech starts work |
| actual_end | timestamptz | nullable, when tech completes work |
| dispatched_at | timestamptz | nullable |
| completed_at | timestamptz | nullable |
| tags | text[] | |
| internal_notes | text | nullable, staff-only notes |
| customer_notes | text | nullable, visible to customer |
| total_amount | decimal(12,2) | nullable, calculated from line items |
| is_recurring | boolean | default false |
| recurrence_rule | jsonb | nullable, iCal RRULE-like config |
| created_by | uuid | FK -> users.id |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:** `(tenant_id, status)`, `(tenant_id, assigned_to, scheduled_start)`, `(tenant_id, customer_id)`, `(tenant_id, job_number)`

### job_line_items

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| job_id | uuid | FK -> jobs.id |
| description | varchar(500) | |
| quantity | decimal(10,2) | default 1 |
| unit_price | decimal(12,2) | |
| total | decimal(12,2) | calculated: quantity * unit_price |
| type | enum | service, material, labor, other |
| sort_order | integer | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### job_notes

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| job_id | uuid | FK -> jobs.id |
| user_id | uuid | FK -> users.id |
| content | text | |
| is_internal | boolean | default true |
| created_at | timestamptz | |

### job_photos

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| job_id | uuid | FK -> jobs.id |
| user_id | uuid | FK -> users.id |
| storage_path | text | Path in Supabase Storage |
| caption | varchar(255) | nullable |
| taken_at | timestamptz | nullable, EXIF date if available |
| created_at | timestamptz | |

### job_signatures

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| job_id | uuid | FK -> jobs.id |
| signer_name | varchar(255) | |
| signer_role | enum | customer, technician |
| storage_path | text | Path to signature image in storage |
| signed_at | timestamptz | |
| created_at | timestamptz | |

### estimates

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| estimate_number | varchar(50) | Auto-generated, tenant-scoped |
| customer_id | uuid | FK -> customers.id |
| property_id | uuid | FK -> properties.id |
| job_id | uuid | nullable FK -> jobs.id |
| created_by | uuid | FK -> users.id |
| status | enum | draft, sent, viewed, approved, declined, expired |
| summary | varchar(500) | |
| notes | text | nullable, customer-facing |
| internal_notes | text | nullable |
| valid_until | date | nullable, expiration date |
| approved_at | timestamptz | nullable |
| approved_option_id | uuid | nullable FK -> estimate_options.id |
| sent_at | timestamptz | nullable |
| viewed_at | timestamptz | nullable |
| total_amount | decimal(12,2) | calculated, min of options |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### estimate_options

Good/Better/Best options within an estimate.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| estimate_id | uuid | FK -> estimates.id |
| name | varchar(100) | e.g., "Good", "Better", "Best" |
| description | text | nullable |
| total | decimal(12,2) | calculated from items |
| is_recommended | boolean | default false |
| sort_order | integer | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### estimate_option_items

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| option_id | uuid | FK -> estimate_options.id |
| description | varchar(500) | |
| quantity | decimal(10,2) | default 1 |
| unit_price | decimal(12,2) | |
| total | decimal(12,2) | |
| type | enum | service, material, labor, other |
| sort_order | integer | |
| created_at | timestamptz | |

### invoices

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| invoice_number | varchar(50) | Auto-generated, tenant-scoped |
| customer_id | uuid | FK -> customers.id |
| job_id | uuid | nullable FK -> jobs.id |
| estimate_id | uuid | nullable FK -> estimates.id |
| created_by | uuid | FK -> users.id |
| status | enum | draft, sent, viewed, paid, partial, overdue, void |
| due_date | date | |
| subtotal | decimal(12,2) | |
| tax_rate | decimal(5,4) | e.g., 0.0825 for 8.25% |
| tax_amount | decimal(12,2) | |
| total | decimal(12,2) | |
| amount_paid | decimal(12,2) | default 0 |
| balance_due | decimal(12,2) | calculated: total - amount_paid |
| notes | text | nullable, customer-facing |
| internal_notes | text | nullable |
| sent_at | timestamptz | nullable |
| viewed_at | timestamptz | nullable |
| paid_at | timestamptz | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:** `(tenant_id, status)`, `(tenant_id, customer_id)`, `(tenant_id, due_date)`

### invoice_line_items

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| invoice_id | uuid | FK -> invoices.id |
| description | varchar(500) | |
| quantity | decimal(10,2) | |
| unit_price | decimal(12,2) | |
| total | decimal(12,2) | |
| type | enum | service, material, labor, discount, other |
| sort_order | integer | |
| created_at | timestamptz | |

### payments

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| invoice_id | uuid | FK -> invoices.id |
| customer_id | uuid | FK -> customers.id |
| amount | decimal(12,2) | |
| method | enum | credit_card, debit_card, ach, cash, check, other |
| status | enum | pending, succeeded, failed, refunded |
| stripe_payment_id | varchar(255) | nullable |
| reference_number | varchar(100) | nullable, for check/cash reference |
| notes | text | nullable |
| processed_at | timestamptz | |
| created_at | timestamptz | |

### activity_log

Audit trail for important actions.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| user_id | uuid | nullable FK -> users.id (null for system actions) |
| entity_type | varchar(50) | e.g., 'job', 'invoice', 'customer' |
| entity_id | uuid | |
| action | varchar(50) | e.g., 'created', 'updated', 'status_changed', 'deleted' |
| changes | jsonb | nullable, before/after snapshot |
| ip_address | inet | nullable |
| created_at | timestamptz | |

**Index:** `(tenant_id, entity_type, entity_id)`, `(tenant_id, created_at)`

### notifications

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK -> tenants.id |
| user_id | uuid | FK -> users.id (recipient) |
| type | varchar(50) | e.g., 'job_assigned', 'estimate_approved', 'payment_received' |
| title | varchar(255) | |
| message | text | |
| entity_type | varchar(50) | nullable |
| entity_id | uuid | nullable |
| is_read | boolean | default false |
| read_at | timestamptz | nullable |
| created_at | timestamptz | |

**Index:** `(tenant_id, user_id, is_read, created_at)`

## Sequential Number Generation

Job numbers, estimate numbers, and invoice numbers are tenant-scoped sequential values. We use a `tenant_sequences` table to manage this:

| Column | Type | Notes |
|---|---|---|
| tenant_id | uuid | PK (composite) |
| sequence_type | varchar(50) | PK (composite), e.g., 'job', 'estimate', 'invoice' |
| prefix | varchar(10) | e.g., 'JOB', 'EST', 'INV' |
| current_value | integer | Last used number |
| updated_at | timestamptz | |

Number generation uses `SELECT ... FOR UPDATE` to prevent race conditions.

## Notes on Drizzle Schema

- All tables defined in `src/lib/db/schema/` with one file per logical group
- Enums defined as `pgEnum` for type safety
- Relations defined using Drizzle's `relations()` API
- All `tenant_id` columns indexed and included in composite indexes
- Migrations generated via `drizzle-kit generate` and applied via `drizzle-kit migrate`
