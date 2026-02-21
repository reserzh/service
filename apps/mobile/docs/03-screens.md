# Screens Reference

## Navigation Structure

```
Root Layout (providers)
├── index.tsx (auth redirect)
├── (auth)/ - Stack Navigator
│   └── login.tsx
└── (tabs)/ - Bottom Tab Navigator
    ├── Home (index.tsx)
    ├── Jobs/ - Stack Navigator
    │   ├── index.tsx (list)
    │   └── [id].tsx (detail)
    ├── Schedule/ - Stack Navigator
    │   └── index.tsx
    └── More/ - Stack Navigator
        ├── index.tsx (menu)
        ├── profile.tsx
        ├── customers/index.tsx
        ├── customers/[id].tsx
        ├── estimates/index.tsx
        ├── estimates/[id].tsx
        └── estimates/create.tsx (placeholder)
```

## Tab Bar

4 tabs with Lucide icons:
| Tab | Icon | Color (active) |
|-----|------|----------------|
| Home | `Home` | #2563eb |
| Jobs | `Wrench` | #2563eb |
| Schedule | `Calendar` | #2563eb |
| More | `Menu` | #2563eb |

---

## Screen Details

### Login (`app/(auth)/login.tsx`)
- Brand header with app icon and name
- Email + password fields with inline validation
- "Sign In" button with loading state
- "Forgot your password?" link
- Error toast on failed login

### Home Dashboard (`app/(tabs)/index.tsx`)
- Greeting with user's first name + current date
- 3 stat cards: Today's Jobs, In Progress, Completed
- "Today's Schedule" header
- List of today's jobs (filtered by scheduledStart = today, status = active)
- Pull-to-refresh
- Skeleton loading state
- Empty state when no jobs

### Job List (`app/(tabs)/jobs/index.tsx`)
- Search bar (searches by summary, job number, description)
- Filter chips: Active (default), Completed, All
- FlatList of JobCard components
- Pull-to-refresh
- Skeleton loading / empty state

### Job Detail (`app/(tabs)/jobs/[id].tsx`) - **Core Screen**
- **Header**: Job number, job type, summary, status badge, priority badge
- **Schedule bar**: Time range in a blue highlighted row
- **Customer card**: Name, company, phone (tap to call with green button)
- **Location card**: Full address with MapPin icon + NavigateButton (opens maps app)
- **Line Items card**: List of items with qty × price, total sum
- **Notes card**: Timeline of notes with author + relative time, inline "Add Note" with text input
- **Description card**: Job description (if present)
- **Change Status card**: Secondary status transition buttons
- **Bottom Action Bar**: Fixed at bottom, primary CTA ("Start Job" / "Complete Job") with haptic feedback + confirmation alert
- Pull-to-refresh on scroll view

### Schedule (`app/(tabs)/schedule/index.tsx`)
- Day/Week toggle (segmented control)
- "Today" quick button
- Date navigation with chevron arrows
- Week view: 7-day horizontal selector with day dots for days with jobs
- Job list filtered to selected day
- Pull-to-refresh, skeleton loading, empty state

### More Menu (`app/(tabs)/more/index.tsx`)
- Profile header: Avatar (initials), name, email, tap to go to profile
- Menu items with icons: Customers, Estimates, Profile
- Sign Out button (destructive style)

### Customer Search (`app/(tabs)/more/customers/index.tsx`)
- Search bar with debounced query
- FlatList of customer cards (avatar, name, company, phone)
- Tap to view detail
- Skeleton loading / empty state

### Customer Detail (`app/(tabs)/more/customers/[id].tsx`)
- Profile header: Avatar, name, company, type badge (Residential/Commercial)
- Call + Email action buttons
- Contact info card: phone, alt phone, email, source
- Notes card (if present)

### Estimate List (`app/(tabs)/more/estimates/index.tsx`)
- Search bar
- Filter chips: All, Draft, Sent, Approved
- List of estimate cards (number, summary, date, amount, status badge)
- FAB (floating action button) for creating new estimate
- Skeleton loading / empty state

### Estimate Detail (`app/(tabs)/more/estimates/[id].tsx`)
- Header: Estimate number, status badge, summary, created date
- Customer card with name + address
- Option cards (Good/Better/Best): Name, recommended badge, approved badge, line items with totals
- Notes card

### Create Estimate (`app/(tabs)/more/estimates/create.tsx`)
- Placeholder screen - "Coming soon" empty state
- Will be a multi-step form in Phase 3

### Profile (`app/(tabs)/more/profile.tsx`)
- Avatar with initials, name, role badge
- Account info: email, role
- App version
