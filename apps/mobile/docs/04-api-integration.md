# API Integration

## API Client (`src/api/client.ts`)

A thin wrapper around native `fetch` that:
1. Reads the Supabase session token from the auth store
2. Injects `Authorization: Bearer <token>` header on every request
3. Parses error responses matching the backend format: `{ error: { code, message, details? } }`
4. Throws `ApiError` with status code, error code, and message

```typescript
// Usage
import { api } from "@/api/client";

const response = await api.get<ApiResponse<Job[]>>("/jobs", { status: "active" });
const job = await api.post<ApiResponse<Job>>("/jobs/123/status", { status: "in_progress" });
```

## Endpoint Modules

Each module in `src/api/endpoints/` maps 1:1 to backend API routes:

### jobs.ts
| Function | Method | Endpoint |
|----------|--------|----------|
| `jobsApi.list(params)` | GET | `/jobs?page=&status=&search=...` |
| `jobsApi.get(id)` | GET | `/jobs/:id` |
| `jobsApi.update(id, data)` | PATCH | `/jobs/:id` |
| `jobsApi.changeStatus(id, status)` | POST | `/jobs/:id/status` |
| `jobsApi.assign(id, technicianId)` | POST | `/jobs/:id/assign` |
| `jobsApi.addNote(id, content, isInternal)` | POST | `/jobs/:id/notes` |
| `jobsApi.addLineItem(id, item)` | POST | `/jobs/:id/line-items` |

### customers.ts
| Function | Method | Endpoint |
|----------|--------|----------|
| `customersApi.list(params)` | GET | `/customers?page=&search=...` |
| `customersApi.get(id)` | GET | `/customers/:id` |

### estimates.ts
| Function | Method | Endpoint |
|----------|--------|----------|
| `estimatesApi.list(params)` | GET | `/estimates?page=&status=&search=...` |
| `estimatesApi.get(id)` | GET | `/estimates/:id` |
| `estimatesApi.create(data)` | POST | `/estimates` |

### schedule.ts
| Function | Method | Endpoint |
|----------|--------|----------|
| `scheduleApi.get(params)` | GET | `/schedule?from=&to=&technicianId=` |

### settings.ts
| Function | Method | Endpoint |
|----------|--------|----------|
| `settingsApi.getCompany()` | GET | `/settings/company` |

## TanStack Query Hooks (`src/hooks/`)

Each hook wraps an endpoint with caching and cache invalidation:

### useJobs.ts
- `useJobs(params)` - List jobs with filters
- `useJob(id)` - Single job with relations
- `useUpdateJobStatus()` - Mutation: change status, invalidates jobs + schedule queries
- `useAddJobNote()` - Mutation: add note, invalidates single job query
- `useAddJobLineItem()` - Mutation: add line item, invalidates single job query

### useCustomers.ts
- `useCustomers(params)` - List with search
- `useCustomer(id)` - Single customer detail

### useEstimates.ts
- `useEstimates(params)` - List with filters
- `useEstimate(id)` - Single estimate with options
- `useCreateEstimate()` - Mutation: create, invalidates estimates query

### useSchedule.ts
- `useSchedule(params)` - Jobs for date range + technician

### useAuth.ts
- `useAuthInit()` - Called once in root layout, initializes session from secure store
- `useSignIn()` - Returns function: `(email, password) => Promise`
- `useSignOut()` - Returns function: `() => Promise`, clears Zustand store

## Query Configuration

Set in `app/_layout.tsx`:
- `staleTime`: 2 minutes (data considered fresh for 2 min)
- `gcTime`: 30 minutes (unused cached data garbage collected after 30 min)
- `retry`: 2 attempts on failure
- `refetchOnWindowFocus`: disabled (not relevant for mobile)

## Error Handling

The backend returns errors in this format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{ "field": "email", "message": "Email is required" }]
  }
}
```

Error codes: `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`

The mobile `ApiError` class captures all of these fields for easy handling in UI.
