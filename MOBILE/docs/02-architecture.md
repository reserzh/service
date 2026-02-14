# Architecture

## Directory Structure

```
MOBILE/
├── app.json                        # Expo config (permissions, plugins, bundle IDs)
├── babel.config.js                 # Babel with NativeWind + Reanimated plugins
├── metro.config.js                 # Metro bundler with NativeWind integration
├── tailwind.config.js              # Tailwind v3 config for NativeWind
├── global.css                      # Tailwind imports
├── tsconfig.json                   # TypeScript with @/* path alias → ./src/*
├── nativewind-env.d.ts             # NativeWind type declarations
│
├── app/                            # Expo Router (file-based routing)
│   ├── _layout.tsx                 # Root: GestureHandler, QueryClient, AuthProvider, Toast
│   ├── index.tsx                   # Entry: checks auth → redirects to login or tabs
│   │
│   ├── (auth)/                     # Unauthenticated screens
│   │   ├── _layout.tsx             # Stack navigator with fade animation
│   │   └── login.tsx               # Email/password login via Supabase
│   │
│   └── (tabs)/                     # Main app (bottom tab navigation)
│       ├── _layout.tsx             # Tab bar: Home, Jobs, Schedule, More
│       ├── index.tsx               # Home dashboard
│       │
│       ├── jobs/
│       │   ├── _layout.tsx         # Stack navigator
│       │   ├── index.tsx           # Job list with search + filters
│       │   └── [id].tsx            # Job detail (the core screen)
│       │
│       ├── schedule/
│       │   ├── _layout.tsx         # Stack navigator
│       │   └── index.tsx           # Day/week schedule view
│       │
│       └── more/
│           ├── _layout.tsx         # Stack navigator with header configs
│           ├── index.tsx           # Menu grid (customers, estimates, profile, sign out)
│           ├── profile.tsx         # User profile
│           ├── customers/
│           │   ├── index.tsx       # Customer search + list
│           │   └── [id].tsx        # Customer detail (read-only for technicians)
│           └── estimates/
│               ├── index.tsx       # Estimate list with filters
│               ├── [id].tsx        # Estimate detail (Good/Better/Best options)
│               └── create.tsx      # Placeholder for Phase 3
│
└── src/
    ├── api/                        # API client layer
    │   ├── client.ts               # Base fetch wrapper with Bearer auth + error handling
    │   └── endpoints/
    │       ├── jobs.ts             # list, get, update, changeStatus, assign, addNote, addLineItem
    │       ├── customers.ts        # list, get
    │       ├── estimates.ts        # list, get, create
    │       ├── schedule.ts         # get (date range + technician filter)
    │       └── settings.ts         # getCompany
    │
    ├── hooks/                      # TanStack Query hooks
    │   ├── useAuth.ts              # useAuthInit, useSignIn, useSignOut
    │   ├── useJobs.ts              # useJobs, useJob, useUpdateJobStatus, useAddJobNote, useAddJobLineItem
    │   ├── useCustomers.ts         # useCustomers, useCustomer
    │   ├── useEstimates.ts         # useEstimates, useEstimate, useCreateEstimate
    │   └── useSchedule.ts          # useSchedule
    │
    ├── stores/                     # Zustand stores (client state only)
    │   └── auth.ts                 # session, user (UserContext), isLoading, isAuthenticated
    │
    ├── types/
    │   └── models.ts               # All TypeScript types mirroring backend models
    │
    ├── lib/
    │   ├── supabase.ts             # Supabase client with expo-secure-store adapter
    │   ├── constants.ts            # API_BASE_URL, VALID_TRANSITIONS, status labels
    │   ├── colors.ts               # Status/priority color maps (bg, text, dot classes)
    │   └── format.ts               # Currency, phone, date, time, address formatters
    │
    └── components/
        ├── ui/                     # Design system primitives
        │   ├── Button.tsx          # Variants: primary/secondary/outline/ghost/danger, sizes, loading
        │   ├── Card.tsx            # Pressable card with scale animation
        │   ├── Badge.tsx           # Colored badge with optional dot
        │   ├── Input.tsx           # Text input with label + error
        │   ├── TextArea.tsx        # Multiline input
        │   ├── Avatar.tsx          # Image or initials with color
        │   ├── Skeleton.tsx        # Animated loading placeholder
        │   ├── EmptyState.tsx      # Icon + title + description + optional action
        │   └── LoadingScreen.tsx   # Centered spinner with optional message
        │
        ├── job/                    # Job-specific components
        │   ├── JobCard.tsx         # Job card for lists (number, summary, customer, time, location)
        │   ├── JobStatusBadge.tsx  # Colored status badge with dot
        │   └── JobPriorityBadge.tsx # Priority badge (hidden for "normal")
        │
        └── common/                 # Shared feature components
            ├── SearchBar.tsx       # Search input with icon + clear button
            ├── FilterChips.tsx     # Horizontal scrollable filter chips with haptic
            └── NavigateButton.tsx  # Opens Apple Maps / Google Maps to address
```

## Data Flow

```
Screen → TanStack Query Hook → API Endpoint Module → API Client (fetch + Bearer token) → Backend /api/v1/*
                                                                    ↑
                                                          Supabase session token
                                                          from expo-secure-store
```

1. Screens call TanStack Query hooks (e.g., `useJobs()`)
2. Hooks call API endpoint functions (e.g., `jobsApi.list()`)
3. Endpoint functions call `api.get()` / `api.post()` etc.
4. The API client automatically injects the Bearer token from the Supabase session
5. Responses are cached by TanStack Query with 2-minute stale time

## Auth Flow

1. App launches → `app/_layout.tsx` renders `AuthProvider` which calls `useAuthInit()`
2. `useAuthInit()` checks `expo-secure-store` for an existing Supabase session
3. `app/index.tsx` reads `isAuthenticated` from Zustand store
4. If authenticated → redirect to `/(tabs)`, otherwise → redirect to `/(auth)/login`
5. On login, `supabase.auth.signInWithPassword()` stores the session securely
6. All API calls include `Authorization: Bearer <access_token>` header
7. Supabase JS client auto-refreshes expired tokens

## Technician Role Scoping

The backend automatically scopes data for technicians:
- **Jobs**: `if (ctx.role === "technician") conditions.push(eq(jobs.assignedTo, ctx.userId))` (jobs.ts:122)
- **Permissions**: Technicians can read customers/properties/schedule, read+update jobs, read+create estimates, create payments

No special mobile-only API endpoints are needed.

## Status Transitions

The valid transitions map (from `src/lib/constants.ts`, mirrors backend `jobs.ts:89-96`):

```
new → [scheduled, canceled]
scheduled → [dispatched, new, canceled]
dispatched → [in_progress, scheduled, canceled]
in_progress → [completed, dispatched]
completed → []
canceled → [new]
```

The typical technician flow: **dispatched → in_progress → completed**

The Job Detail screen shows a primary action button for the natural next step ("Start Job" / "Complete Job") and secondary status options below.
