# Implementation Phases

## Phase Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | **COMPLETE** | Project setup, auth, navigation, base UI |
| Phase 2 | **COMPLETE** | Core job management screens |
| Phase 3 | NOT STARTED | Schedule polish, customers, estimate creation form |
| Phase 4 | NOT STARTED | Native features (camera, signatures, GPS, push) |
| Phase 5 | NOT STARTED | Polish, offline support, production readiness |

---

## Phase 1: Project Setup, Auth & Navigation - COMPLETE

What was done:
1. Initialized Expo project with TypeScript
2. Installed and configured NativeWind v4 + Tailwind CSS v3
3. Set up Expo Router with `(auth)` and `(tabs)` route groups
4. Created Supabase client with `expo-secure-store` adapter for session persistence
5. Built Login screen with email/password + validation + error toasts
6. Built root layout with auth check and redirect logic
7. Configured 4-tab bar (Home, Jobs, Schedule, More) with Lucide icons
8. Built API client (`src/api/client.ts`) with Bearer token interceptor
9. Built 9 base UI components (Button, Card, Badge, Input, TextArea, Avatar, Skeleton, EmptyState, LoadingScreen)
10. Created all TypeScript types mirroring backend models
11. Verified: TypeScript compiles clean, Expo builds for both iOS and Android

## Phase 2: Core Job Management - COMPLETE

What was done:
1. Built all API endpoint modules (jobs, customers, estimates, schedule, settings)
2. Built all TanStack Query hooks with cache invalidation
3. Built job-specific components (JobCard, JobStatusBadge, JobPriorityBadge)
4. Built common components (SearchBar, FilterChips, NavigateButton)
5. **Home Dashboard**: Today's jobs, 3 stat cards, greeting, pull-to-refresh
6. **Job List**: Search + status filter chips, FlatList with job cards
7. **Job Detail**: Full screen with customer card (tap to call), property card (navigate to maps), line items, notes timeline, inline add-note, status transitions with haptic + confirmation alerts, fixed bottom action bar
8. **Schedule**: Day/week toggle, date navigation, week day selector, job list per day
9. **More Menu**: Profile header, menu items, sign out
10. **Customer Search + Detail**: Search, list, read-only detail with call/email actions
11. **Estimate List + Detail**: Filters, Good/Better/Best option cards with approved state
12. **Profile**: Avatar, role badge, account info

---

## Phase 3: Schedule Polish, Customers, Estimates - NOT STARTED

What needs to be done:
1. **Create Estimate form** (`app/(tabs)/more/estimates/create.tsx`) - Currently a placeholder
   - Multi-step form: select customer → select property → add options with line items → review → submit
   - Use `useCreateEstimate()` hook (already built)
   - Customer search/select component needed
2. **Customer detail enhancements** - Show properties with addresses, equipment list, job history
   - Backend endpoint `GET /customers/:id` returns relations (properties, jobs, estimates, invoices)
   - Need to use the full response shape
3. **Schedule improvements** - Better time-slot visualization, possibly a timeline view
4. **Invoices** - Add invoice endpoints + hooks + list/detail screens under More tab
   - Backend has full invoice API already (`/api/v1/invoices/*`)

## Phase 4: Native Features - NOT STARTED

### Camera / Photos
- Use `expo-image-picker` for capture from camera or gallery
- Compress images (max 1200px wide, 80% JPEG quality)
- Upload to Supabase Storage bucket: `job-photos/{tenantId}/{jobId}/{filename}`
- Save metadata via API: `POST /api/v1/jobs/:id/photos` (may need to add this backend endpoint)
- Build `PhotoCapture` component (camera/gallery picker with caption)
- Build `PhotoGrid` component (thumbnail grid in job detail)
- Add photos section to Job Detail screen

### Signature Capture
- Use `react-native-signature-canvas` package (already in plan, not yet installed)
- Full-screen modal with drawing canvas
- Clear / redo / done buttons
- Signer name input + role selector (customer / technician)
- Upload signature image to Supabase Storage: `job-signatures/{tenantId}/{jobId}/{filename}`
- Save metadata via API: `POST /api/v1/jobs/:id/signatures` (may need to add this backend endpoint)
- Build `SignatureCanvas` component
- Add signatures section to Job Detail screen

### GPS / Maps
- `expo-location` - get technician's current location
- `react-native-maps` - embed a small MapPreview in job detail showing property pin
- NavigateButton already built (opens Apple Maps / Google Maps)
- Could add: distance/ETA display, live location tracking

### Push Notifications
- `expo-notifications` + Expo Push Notification service
- Register device push token on login
- Send token to backend: `POST /api/v1/users/me/push-token` (needs new backend endpoint)
- Handle notification tap → navigate to relevant job
- Notification preferences screen (toggle: job assigned, estimate approved, payment received)
- Backend needs to send push notifications when events occur (job assigned, status changed, etc.)

**New backend endpoints needed for Phase 4:**
- `POST /api/v1/jobs/:id/photos` - Save job photo metadata
- `POST /api/v1/jobs/:id/signatures` - Save signature metadata
- `POST /api/v1/users/me/push-token` - Register push notification token
- `GET /api/v1/users/me` - Get current user profile

## Phase 5: Polish & Production Readiness - NOT STARTED

1. **Animations**
   - Page transition animations with react-native-reanimated
   - Animated status badge transitions
   - Custom pull-to-refresh animation
   - Swipe gestures on job cards (swipe to start / navigate)
   - Tab bar micro-animations

2. **Haptic feedback**
   - Already on status changes and button presses
   - Add to: filter chip selection, pull-to-refresh, swipe actions

3. **Loading states**
   - Skeleton screens already implemented for lists
   - Add shimmer animation refinement

4. **Empty states**
   - Already implemented with EmptyState component
   - Could add custom illustrations

5. **Offline support**
   - TanStack Query `gcTime` / `staleTime` tuning
   - `react-native-mmkv` as TanStack Query persister (package already installed)
   - "Offline" banner when no connectivity
   - Queue mutations when offline, flush when online

6. **Dark mode**
   - NativeWind `dark:` classes already used throughout
   - Verify all screens look good in dark mode
   - System theme detection already enabled (`userInterfaceStyle: "automatic"` in app.json)

7. **Error handling**
   - Global error boundary component
   - API error toasts (already implemented)
   - Retry buttons on failed loads

8. **App icon & splash screen**
   - Custom icon design
   - Splash screen with app logo (currently using placeholder)

9. **EAS Build configuration**
   - `eas.json` for development, preview, and production builds
   - TestFlight (iOS) + Internal Testing (Android) setup
   - OTA updates with `expo-updates`
