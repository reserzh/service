# API Design

## Overview

The API serves two consumers:
1. **Next.js Web App** — Uses Server Actions for mutations, direct DB queries in Server Components for reads
2. **Future Mobile App** — Uses REST API endpoints (`/api/v1/*`)

Both share the same **service layer** for business logic, ensuring consistent behavior.

## REST API Conventions

### Base URL

```
Production:  https://app.yourdomain.com/api/v1
Staging:     https://staging.yourdomain.com/api/v1
```

### Authentication

All API requests require a Bearer token (JWT from Supabase Auth):

```
Authorization: Bearer <access_token>
```

### Response Format

All responses follow a consistent envelope:

```json
// Success
{
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 142
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Must be a valid email" }
    ]
  }
}
```

### HTTP Status Codes

| Code | Usage |
|---|---|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Not authorized (wrong role/permissions) |
| 404 | Resource not found (within tenant scope) |
| 409 | Conflict (e.g., duplicate email) |
| 422 | Unprocessable entity (business rule violation) |
| 429 | Rate limited |
| 500 | Internal server error |

### Pagination

```
GET /api/v1/customers?page=2&pageSize=25&sort=lastName&order=asc
```

- Default page size: 25
- Maximum page size: 100
- Cursor-based pagination available for large datasets

### Filtering

```
GET /api/v1/jobs?status=scheduled,dispatched&assignedTo=<userId>&from=2025-01-01&to=2025-01-31
```

### Search

```
GET /api/v1/customers?search=john+smith
```

Full-text search across relevant fields.

## Endpoint Reference

### Customers

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/customers | List customers (paginated, filterable, searchable) |
| POST | /api/v1/customers | Create a customer |
| GET | /api/v1/customers/:id | Get customer details |
| PATCH | /api/v1/customers/:id | Update a customer |
| DELETE | /api/v1/customers/:id | Soft delete a customer |
| GET | /api/v1/customers/:id/properties | List customer properties |
| POST | /api/v1/customers/:id/properties | Add property to customer |
| GET | /api/v1/customers/:id/jobs | List customer job history |
| GET | /api/v1/customers/:id/invoices | List customer invoices |

### Properties

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/properties/:id | Get property details |
| PATCH | /api/v1/properties/:id | Update a property |
| DELETE | /api/v1/properties/:id | Delete a property |
| GET | /api/v1/properties/:id/equipment | List equipment at property |
| POST | /api/v1/properties/:id/equipment | Add equipment to property |

### Equipment

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/equipment/:id | Get equipment details |
| PATCH | /api/v1/equipment/:id | Update equipment |
| DELETE | /api/v1/equipment/:id | Delete equipment |

### Jobs

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/jobs | List jobs (paginated, filterable by status/date/tech) |
| POST | /api/v1/jobs | Create a job |
| GET | /api/v1/jobs/:id | Get job details (includes line items, notes, photos) |
| PATCH | /api/v1/jobs/:id | Update a job |
| POST | /api/v1/jobs/:id/status | Change job status (with validation) |
| POST | /api/v1/jobs/:id/assign | Assign/reassign technician |
| POST | /api/v1/jobs/:id/notes | Add a note to job |
| POST | /api/v1/jobs/:id/photos | Upload photo(s) to job |
| POST | /api/v1/jobs/:id/signatures | Capture signature |
| GET | /api/v1/jobs/:id/line-items | List job line items |
| POST | /api/v1/jobs/:id/line-items | Add line item |
| PATCH | /api/v1/jobs/:id/line-items/:itemId | Update line item |
| DELETE | /api/v1/jobs/:id/line-items/:itemId | Remove line item |

### Schedule / Dispatch

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/schedule | Get schedule for date range (all techs or specific) |
| GET | /api/v1/schedule/availability | Get tech availability for a time slot |
| GET | /api/v1/dispatch/board | Get dispatch board state (all active jobs/techs) |
| POST | /api/v1/dispatch/assign | Assign job to tech with time slot |
| POST | /api/v1/dispatch/unassign | Remove tech assignment |

### Estimates

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/estimates | List estimates |
| POST | /api/v1/estimates | Create an estimate |
| GET | /api/v1/estimates/:id | Get estimate with options and items |
| PATCH | /api/v1/estimates/:id | Update an estimate |
| POST | /api/v1/estimates/:id/send | Send estimate to customer (email/SMS) |
| POST | /api/v1/estimates/:id/approve | Mark as approved (used by customer portal) |
| POST | /api/v1/estimates/:id/decline | Mark as declined |
| POST | /api/v1/estimates/:id/convert | Convert to job and/or invoice |

### Invoices

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/invoices | List invoices |
| POST | /api/v1/invoices | Create an invoice |
| GET | /api/v1/invoices/:id | Get invoice with line items and payments |
| PATCH | /api/v1/invoices/:id | Update an invoice |
| POST | /api/v1/invoices/:id/send | Send invoice to customer |
| POST | /api/v1/invoices/:id/void | Void an invoice |
| GET | /api/v1/invoices/:id/pdf | Generate and download invoice PDF |

### Payments

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/payments | List payments |
| POST | /api/v1/payments | Record a payment |
| POST | /api/v1/payments/charge | Process a card payment via Stripe |
| GET | /api/v1/payments/:id | Get payment details |
| POST | /api/v1/payments/:id/refund | Process a refund |

### Users / Team

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/users | List team members |
| POST | /api/v1/users/invite | Invite a new team member |
| GET | /api/v1/users/:id | Get user details |
| PATCH | /api/v1/users/:id | Update user |
| POST | /api/v1/users/:id/deactivate | Deactivate user |
| GET | /api/v1/users/me | Get current user profile |
| PATCH | /api/v1/users/me | Update current user profile |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/reports/revenue | Revenue report (filterable by date range) |
| GET | /api/v1/reports/jobs | Job metrics report |
| GET | /api/v1/reports/invoices | Invoice / AR aging report |
| GET | /api/v1/reports/technicians | Technician productivity report |
| GET | /api/v1/reports/estimates | Estimate conversion report |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/notifications | List notifications for current user |
| PATCH | /api/v1/notifications/:id/read | Mark as read |
| POST | /api/v1/notifications/read-all | Mark all as read |

### Company Settings

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/settings | Get company settings |
| PATCH | /api/v1/settings | Update company settings |
| POST | /api/v1/settings/logo | Upload company logo |

## Webhooks (Inbound)

### Stripe Webhooks

```
POST /api/webhooks/stripe
```

Handles: `payment_intent.succeeded`, `payment_intent.payment_failed`, `invoice.paid`, `customer.subscription.updated`, etc.

- Signature verification using Stripe webhook secret
- Idempotent processing using event IDs

## Real-Time Events (Supabase Realtime)

Channels the web/mobile app subscribes to:

| Channel | Events | Purpose |
|---|---|---|
| `tenant:{tenantId}:jobs` | INSERT, UPDATE | Dispatch board updates |
| `tenant:{tenantId}:notifications:{userId}` | INSERT | User notifications |
| `tenant:{tenantId}:schedule` | UPDATE | Schedule changes |

## Mobile App Considerations

The REST API is designed with mobile in mind:

1. **Offline Support**: Mobile app can cache data locally and sync when online
2. **Batch Operations**: Endpoints accept arrays for bulk creates/updates
3. **Partial Responses**: `?fields=id,name,status` to reduce payload size
4. **ETags**: For conditional requests and cache validation
5. **Push Notifications**: Webhook/Supabase Realtime to trigger push via FCM/APNs
6. **Photo Upload**: Multipart form data with compression metadata
7. **Signature Capture**: Base64 encoded PNG in request body (small files)
