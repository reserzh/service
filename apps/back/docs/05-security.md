# Security Architecture

## Principles

1. **Defense in Depth** — Multiple layers of protection, never rely on a single control
2. **Least Privilege** — Users and services get minimum necessary permissions
3. **Secure by Default** — Safe defaults; opt-in to less restrictive behavior
4. **Data Isolation** — Tenant data must never leak across boundaries
5. **Audit Everything** — Critical actions are logged for accountability

## Authentication

### Supabase Auth

- Email/password with bcrypt hashing (handled by Supabase)
- OAuth providers (Google, Microsoft) for SSO convenience
- Magic link / passwordless option
- Email verification required for new accounts
- Password requirements: minimum 8 characters, checked against breached password lists

### Session Management

- JWT tokens issued by Supabase Auth
- Short-lived access tokens (1 hour) with refresh token rotation
- Refresh tokens stored as HttpOnly, Secure, SameSite=Strict cookies
- Server-side session validation on every request via Next.js middleware
- Automatic token refresh handled transparently

### Multi-Factor Authentication (MFA)

- TOTP-based MFA available for all users (via Supabase Auth)
- Strongly recommended for Admin users
- Configurable enforcement per tenant (Admin can require MFA for all users)

## Authorization

### Role-Based Access Control (RBAC)

| Permission | Admin | Office Manager | Dispatcher | CSR | Technician |
|---|---|---|---|---|---|
| Company settings | Full | Read | - | - | - |
| User management | Full | Read | - | - | - |
| Customer data | Full | Full | Read | Full | Assigned only |
| Scheduling | Full | Full | Full | Create | Own schedule |
| Jobs | Full | Full | Full | Create | Assigned only |
| Estimates | Full | Full | Read | Create | Assigned only |
| Invoices | Full | Full | Read | Read | - |
| Payments | Full | Full | - | - | Collect only |
| Reports | Full | Full | Limited | - | Own stats |
| Website / CMS | Full | Full | - | - | - |

### Implementation

```typescript
// Middleware extracts user context
interface UserContext {
  userId: string;
  tenantId: string;
  role: UserRole;
}

// Permission check at the service layer
function assertPermission(ctx: UserContext, resource: string, action: string): void {
  // Throws ForbiddenError if not allowed
}
```

- Permissions checked in the service layer (not just UI)
- API routes validate permissions before executing business logic
- UI conditionally renders based on role (but never relies on client-side checks alone)

## Tenant Data Isolation

### Layer 1: Application (Drizzle ORM)

Every database query automatically includes `tenant_id` filtering:

```typescript
// Helper that wraps all queries with tenant_id
function tenantQuery(ctx: UserContext) {
  return {
    where: (table) => eq(table.tenantId, ctx.tenantId),
    // ... other helpers
  };
}
```

### Layer 2: Database (Row-Level Security)

PostgreSQL RLS policies as a safety net:

```sql
-- Example: customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON customers
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

- RLS is ALWAYS ON, even for service roles
- The application sets `app.current_tenant_id` at the start of each database connection/transaction
- Even if application code has a bug, RLS prevents cross-tenant data access

### Layer 3: API Validation

- All API endpoints extract `tenant_id` from the authenticated session (never from request body/params)
- ID parameters in URLs are validated to belong to the current tenant
- Foreign key references are validated within tenant scope

## Public Site Security

The FRONT app serves public tenant websites without authentication. Security considerations:

- **No admin data exposed**: Public queries only return published pages, active services, and visible sections
- **Tenant isolation in public queries**: All queries filter by resolved `tenant_id` from middleware
- **Rate limiting**: Booking submission endpoints are rate-limited to prevent abuse
- **Input validation**: Booking form data validated with Zod schemas server-side
- **Custom domain verification**: DNS TXT record verification before domain activation
- **No direct DB writes from FRONT**: Write operations (bookings) go through validated API routes

## Input Validation & Sanitization

### Server-Side Validation

- All inputs validated using Zod schemas
- Validation happens at the API/server action boundary
- Type coercion with strict rules (no unexpected type conversions)

```typescript
const createCustomerSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/).optional(),
  // ...
});
```

### SQL Injection Prevention

- Drizzle ORM uses parameterized queries exclusively
- No raw SQL concatenation anywhere in the codebase
- Database user has minimum required permissions (no DDL in production)

### XSS Prevention

- React automatically escapes rendered content
- Content-Security-Policy headers configured
- No `dangerouslySetInnerHTML` without explicit sanitization (DOMPurify)
- User-uploaded file types are validated and served with correct Content-Type headers

### CSRF Protection

- Next.js Server Actions include built-in CSRF protection
- API routes validate Origin header
- SameSite cookie attribute prevents cross-site request forgery

## API Security

### Rate Limiting

- Global rate limit: 100 requests/minute per IP (unauthenticated)
- Authenticated rate limit: 300 requests/minute per user
- Sensitive endpoints (login, password reset): 5 requests/minute per IP
- Rate limiting via Vercel Edge Middleware or upstash/ratelimit

### API Key Authentication (for future integrations/mobile)

- API keys are tenant-scoped and role-restricted
- Keys are hashed (SHA-256) before storage; only prefix is shown in UI
- Keys have configurable expiration
- Key rotation supported (old key valid for grace period)

### Request Validation

- All request bodies validated against Zod schemas
- Maximum request body size enforced
- File upload size limits (10MB default)
- Allowed file types restricted (images, PDFs only)

## Data Protection

### Encryption

- **In Transit**: TLS 1.3 enforced (handled by Vercel + Supabase)
- **At Rest**: AES-256 encryption (handled by Supabase/AWS infrastructure)
- **Application-Level**: Sensitive fields (API keys, tokens) encrypted with AES-256-GCM before storage
- Database connection via SSL required

### Sensitive Data Handling

- Payment card data NEVER stored; handled entirely by Stripe (PCI DSS compliance)
- Passwords never logged or returned in API responses
- PII excluded from application logs
- Customer data export/deletion capability (GDPR/CCPA readiness)

### File Upload Security

- File type validation (magic bytes, not just extension)
- Virus scanning consideration for uploaded files
- Files stored in private Supabase Storage buckets
- Access via short-lived signed URLs (5-minute expiry)
- File size limits enforced server-side

## HTTP Security Headers

```typescript
// next.config.ts security headers
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',  // Disabled in favor of CSP
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' ...",
}
```

## Logging & Monitoring

### Application Logging

- Structured JSON logging (pino or similar)
- Request ID tracking across all logs
- Sensitive data redacted from logs (passwords, tokens, card numbers)
- Log levels: error, warn, info, debug

### Audit Logging

All of these actions are recorded in the `activity_log` table:
- User login/logout
- Customer create/update/delete
- Job status changes
- Estimate sent/approved/declined
- Invoice sent/paid
- Payment processed/refunded
- User role changes
- Settings changes

### Error Tracking

- Sentry for error capture and alerting
- Source maps uploaded for readable stack traces
- User context attached (tenant_id, user_id, role) — no PII
- Alert thresholds for error rate spikes

## Dependency Security

- `pnpm audit` in CI/CD pipeline
- Dependabot or Renovate for automated dependency updates
- Lock file (`pnpm-lock.yaml`) committed and verified
- No `eval()`, `Function()`, or dynamic `require()` / `import()`

## Incident Response

- Ability to disable a tenant account immediately
- Ability to force-logout all sessions for a user
- API key revocation
- Database point-in-time recovery (Supabase handles backups)
