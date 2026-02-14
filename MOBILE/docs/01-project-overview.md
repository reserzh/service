# FieldService Pro - Mobile App

## What Is This?

A React Native (Expo) mobile app for field service technicians. It connects to the existing Next.js backend at `/Users/john/WEB/SERVICE/BACK/` via its REST API at `/api/v1/*`.

Primary users are **field technicians** who need to view assigned jobs, update statuses, add notes/photos, capture customer signatures, and navigate to job sites. Think the ServiceTitan technician app.

## Tech Stack

| Category | Choice | Version |
|----------|--------|---------|
| Framework | Expo SDK | 54 |
| Routing | Expo Router | 6 |
| Language | TypeScript | 5.9 |
| UI/Styling | NativeWind (Tailwind for RN) | 4.2 |
| Icons | Lucide React Native | 0.564 |
| Animations | react-native-reanimated | 4.1 |
| Server state | TanStack Query | 5 |
| Client state | Zustand | 5 |
| Forms | React Hook Form + Zod v4 | 7.71 / 4.3 |
| Auth | @supabase/supabase-js + expo-secure-store | 2.95 |
| HTTP | Native fetch wrapper | - |
| Bottom sheets | @gorhom/bottom-sheet | 5 |
| Toasts | react-native-toast-message | 2.3 |
| Date utils | date-fns | 4 |

## Running the App

```bash
cd /Users/john/WEB/SERVICE/MOBILE

# 1. Create .env with your Supabase credentials:
# EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 2. Start Expo dev server:
npx expo start

# 3. Press 'i' for iOS simulator, 'a' for Android emulator
```

## Backend Dependency

The mobile app consumes the API from the BACK project. One backend change is still needed before the mobile app can authenticate:

**File**: `/Users/john/WEB/SERVICE/BACK/src/lib/auth/index.ts`

The `requireApiAuth` function currently only reads auth from cookies (set by `@supabase/ssr` for the web app). Mobile apps send auth via `Authorization: Bearer <token>` headers. The fix is small - modify `requireApiAuth` to also check for a Bearer token:

```typescript
export async function requireApiAuth(req: NextRequest): Promise<UserContext> {
  const supabase = await createClient();

  // Support Bearer token auth (mobile clients)
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const { data: { user } } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();

  if (!user) {
    throw new ApiAuthError("Not authenticated");
  }
  // ... rest stays the same
}
```

This is the **only** backend modification needed. All existing API endpoints, service layer, and permissions work as-is for mobile clients.
