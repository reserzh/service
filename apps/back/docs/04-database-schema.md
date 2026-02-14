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
  ├── site_settings
  ├── site_pages
  │     └── site_sections
  ├── site_media
  ├── site_domains
  ├── service_catalog
  ├── booking_requests
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

## Website / CMS Tables

These tables power the tenant-facing website builder and online booking system. All follow the same patterns: `tenant_id` isolation, UUID primary keys, `created_at`/`updated_at` timestamps.

### Entity Relationship

```
tenants
  └── site_settings (one per tenant)
  └── site_pages
  │     └── site_sections (ordered blocks within a page)
  └── site_media
  └── site_domains
  └── service_catalog
  └── booking_requests
        ├── → service_catalog (optional)
        ├── → customers (when converted)
        └── → jobs (when converted)
```

### New Enums

```
pageStatusEnum = ["draft", "published", "archived"]
sectionTypeEnum = ["hero", "services", "about", "testimonials", "gallery", "contact_form", "booking_widget", "cta_banner", "faq", "team", "map", "custom_html", "features", "pricing"]
domainStatusEnum = ["pending_verification", "active", "failed", "removed"]
bookingStatusEnum = ["pending", "confirmed", "canceled"]
```

### site_settings

Per-tenant website configuration. One row per tenant.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants, unique |
| is_published | boolean | Master toggle for site visibility |
| subdomain_slug | varchar(100) | Auto-set from tenants.slug |
| theme | jsonb | `{ primaryColor, secondaryColor, accentColor, fontHeading, fontBody, borderRadius, style? }` |
| branding | jsonb | `{ logoUrl?, faviconUrl?, businessName, tagline?, phone?, email? }` |
| seo_defaults | jsonb | `{ title?, description?, ogImage?, keywords? }` |
| social_links | jsonb | `{ facebook?, instagram?, google?, yelp?, nextdoor? }` |
| analytics | jsonb | `{ googleAnalyticsId?, facebookPixelId? }` |
| custom_css | text | nullable, custom CSS overrides |
| template_id | varchar(50) | Which starter template was used |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### site_pages

CMS pages for tenant websites.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| slug | varchar(255) | URL path, e.g., `about`, `services` |
| title | varchar(255) | |
| status | pageStatusEnum | draft, published, archived |
| is_homepage | boolean | Only one per tenant |
| seo | jsonb | `{ title?, description?, ogImage?, noIndex? }` |
| sort_order | integer | For navigation ordering |
| show_in_nav | boolean | Show in site navigation |
| nav_label | varchar(100) | Override for nav display text |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| published_at | timestamptz | nullable |

**Indexes:** `(tenant_id, slug)` unique, `(tenant_id, status)`

### site_sections

Block-based content sections within pages. Each section has a type that determines which component renders it and what the content JSON structure looks like.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| page_id | uuid | FK → site_pages |
| type | sectionTypeEnum | Which section component to render |
| content | jsonb | Section-specific structured content (varies by type) |
| settings | jsonb | Display settings: `{ backgroundColor?, textColor?, paddingY?, paddingX?, maxWidth?, fullWidth? }` |
| sort_order | integer | Position on page |
| is_visible | boolean | Toggle visibility without deleting |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:** `(tenant_id, page_id)`

### site_media

Media library for tenant website images.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| filename | varchar(255) | |
| storage_path | text | Supabase Storage path |
| url | text | Public URL |
| mime_type | varchar(100) | nullable |
| size_bytes | integer | nullable |
| alt_text | varchar(255) | nullable |
| created_at | timestamptz | |

**Indexes:** `(tenant_id)`

### site_domains

Custom domain mappings for tenant websites.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| domain | varchar(255) | e.g., `joesplumbing.com`, unique |
| status | domainStatusEnum | pending_verification → active |
| verification_token | varchar(255) | DNS TXT record value |
| verified_at | timestamptz | nullable |
| is_primary | boolean | Canonical URL domain |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:** `(tenant_id)`, unique `(domain)`

### service_catalog

Public-facing service listings displayed on tenant websites.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| name | varchar(255) | e.g., "AC Repair" |
| slug | varchar(255) | URL-friendly name |
| description | text | Rich description |
| short_description | varchar(500) | For cards/listings |
| icon | varchar(50) | Lucide icon name |
| image_url | text | nullable |
| price_display | varchar(100) | e.g., "Starting at $89", "Call for quote" |
| is_bookable | boolean | Can end-customers book online? |
| estimated_duration | integer | Minutes |
| sort_order | integer | |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:** `(tenant_id, slug)` unique, `(tenant_id, is_active)`

### booking_requests

Online booking submissions from public tenant websites.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| service_id | uuid | nullable FK → service_catalog |
| status | bookingStatusEnum | pending, confirmed, canceled |
| first_name | varchar(100) | |
| last_name | varchar(100) | |
| email | varchar(255) | |
| phone | varchar(50) | |
| address_line1 | varchar(255) | |
| address_line2 | varchar(255) | nullable |
| city | varchar(100) | |
| state | varchar(50) | |
| zip | varchar(20) | |
| preferred_date | date | |
| preferred_time_slot | varchar(50) | morning, afternoon, evening |
| message | text | nullable, additional details |
| converted_job_id | uuid | nullable FK → jobs, set when converted |
| converted_customer_id | uuid | nullable FK → customers, set when converted |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:** `(tenant_id, status)`, `(tenant_id, created_at)`

## Notes on Drizzle Schema

- Schema files now live in `packages/shared/src/db/schema/` (not `src/lib/db/schema/`), with one file per logical group
- Both `apps/back` and `apps/front` import schema from `@fieldservice/shared`
- Enums defined as `pgEnum` for type safety
- Relations defined using Drizzle's `relations()` API
- All `tenant_id` columns indexed and included in composite indexes
- Migrations generated via `drizzle-kit generate` and applied via `drizzle-kit migrate`
