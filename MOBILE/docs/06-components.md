# Component Reference

## UI Components (`src/components/ui/`)

### Button
**File**: `src/components/ui/Button.tsx`

Pressable button with haptic feedback on tap.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | Button text |
| onPress | () => void | required | Press handler |
| variant | "primary" \| "secondary" \| "outline" \| "ghost" \| "danger" | "primary" | Visual style |
| size | "sm" \| "md" \| "lg" | "md" | Size preset |
| loading | boolean | false | Shows spinner, disables press |
| disabled | boolean | false | Disables press |
| icon | ReactNode | - | Icon element before text |
| className | string | "" | Additional NativeWind classes |

### Card
**File**: `src/components/ui/Card.tsx`

Container with white background, rounded corners, and border. Optionally pressable with scale animation.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | required | Card content |
| onPress | () => void | - | If provided, card becomes pressable |
| className | string | "" | Additional classes |

### Badge
**File**: `src/components/ui/Badge.tsx`

Small colored label, optionally with a status dot.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | required | Badge text |
| bgClass | string | "bg-slate-100" | Background color class |
| textClass | string | "text-slate-700" | Text color class |
| dotClass | string | "bg-slate-400" | Dot color class |
| showDot | boolean | false | Show colored dot before label |
| size | "sm" \| "md" | "sm" | Size preset |

### Input
**File**: `src/components/ui/Input.tsx`

Text input with optional label and error message. Supports ref forwarding.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Label above input |
| error | string | - | Error message below input (turns border red) |
| ...rest | TextInputProps | - | All React Native TextInput props |

### TextArea
**File**: `src/components/ui/TextArea.tsx`

Multiline text input (min 100px height). Same API as Input.

### Avatar
**File**: `src/components/ui/Avatar.tsx`

Circular avatar showing either an image or colored initials.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| imageUrl | string \| null | - | Image URL (uses expo-image) |
| initials | string | required | Fallback initials (e.g., "JD") |
| size | "sm" \| "md" \| "lg" | "md" | 32/40/56px |
| color | string | "#3b82f6" | Initials text + background tint color |

### Skeleton
**File**: `src/components/ui/Skeleton.tsx`

Animated loading placeholder with pulsing opacity.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | "h-4 w-full" | Size/shape classes |

### EmptyState
**File**: `src/components/ui/EmptyState.tsx`

Centered empty state with icon, title, description, and optional action button.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| icon | ReactNode | Inbox icon | Custom icon |
| title | string | required | Main text |
| description | string | - | Secondary text |
| actionLabel | string | - | Button text |
| onAction | () => void | - | Button handler |

### LoadingScreen
**File**: `src/components/ui/LoadingScreen.tsx`

Full-screen centered spinner with optional message.

---

## Job Components (`src/components/job/`)

### JobCard
**File**: `src/components/job/JobCard.tsx`

Card for job lists showing: job number + type, summary, customer name, time range, location, status badge, priority badge. Pressable with scale animation.

### JobStatusBadge
**File**: `src/components/job/JobStatusBadge.tsx`

Badge with status-specific colors and dot. Uses color maps from `src/lib/colors.ts`.

### JobPriorityBadge
**File**: `src/components/job/JobPriorityBadge.tsx`

Badge for priority level. Returns null for "normal" priority (no badge shown).

---

## Common Components (`src/components/common/`)

### SearchBar
**File**: `src/components/common/SearchBar.tsx`

Search input with magnifying glass icon and clear button. Slate background styling.

### FilterChips
**File**: `src/components/common/FilterChips.tsx`

Horizontal scrollable row of filter chips with haptic feedback on selection. Active chip is blue.

| Prop | Type | Description |
|------|------|-------------|
| chips | { key: string; label: string }[] | Available filter options |
| activeKey | string | Currently selected chip key |
| onSelect | (key: string) => void | Selection handler |

### NavigateButton
**File**: `src/components/common/NavigateButton.tsx`

Button that opens native maps app (Apple Maps on iOS, Google Maps on Android) with directions to the given address. Supports coordinates for precise navigation.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| address | string | required | Full address string |
| latitude | string \| null | - | Optional latitude for precise nav |
| longitude | string \| null | - | Optional longitude |
| size | "sm" \| "md" | "md" | "sm" = inline link style, "md" = full-width button |
