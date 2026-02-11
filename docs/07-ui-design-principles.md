# UI/UX Design Principles

## Design Philosophy

The UI must be **so intuitive that a dispatcher or tech can use it with zero training**. Every interaction should feel natural. The design should be clean, modern, and professional — not cluttered like legacy FSM tools.

## Core Principles

### 1. Clarity Over Cleverness
- Every screen has one clear purpose
- Labels are plain English, no jargon
- Status indicators use both color AND text (accessibility)
- Important actions are prominent; destructive actions require confirmation

### 2. Speed of Interaction
- Common workflows take the fewest clicks possible
- Keyboard shortcuts for power users (dispatchers who live in the app)
- Smart defaults reduce data entry
- Inline editing where it makes sense (no modal for every change)
- Optimistic UI updates for perceived speed

### 3. Information Density Done Right
- Dispatch board shows maximum useful information without clutter
- Progressive disclosure: summary first, details on demand
- Collapsible sections for less-used information
- Responsive tables that adapt to screen size

### 4. Consistent Patterns
- Same component for same action everywhere (e.g., all status changes use the same dropdown style)
- Navigation is always predictable
- Forms follow the same layout and validation patterns
- Toast notifications for success, inline errors for validation

### 5. Mobile-Responsive
- All pages usable on tablet (dispatchers may use iPads)
- Critical tech-facing pages (job details, status updates) work well on phone
- Touch-friendly tap targets (minimum 44x44px)

## Color System

Using shadcn/ui theme with custom brand colors:

| Purpose | Usage |
|---|---|
| **Primary** | Main actions (buttons, links, active states) |
| **Destructive** | Delete, cancel, void actions |
| **Success/Green** | Completed, paid, approved |
| **Warning/Amber** | Overdue, needs attention, pending |
| **Info/Blue** | Informational, scheduled, in progress |
| **Muted** | Secondary text, disabled states, borders |

### Job Status Colors

| Status | Color | Meaning |
|---|---|---|
| New | Gray | Not yet scheduled |
| Scheduled | Blue | On the calendar |
| Dispatched | Purple | Tech notified, en route |
| In Progress | Amber | Tech on site, working |
| Completed | Green | Work done |
| Canceled | Red | Canceled |

## Key Screens

### Dashboard (Home)
- Today's snapshot: jobs scheduled, revenue, outstanding invoices
- Action items: unassigned jobs, overdue invoices, pending estimates
- Quick actions: create job, create customer, create estimate
- Recent activity feed

### Dispatch Board
- Left panel: unassigned jobs queue
- Center: timeline/calendar view per technician
- Right panel: job details sidebar (click to expand)
- Drag-and-drop assignment
- Color-coded by status
- Real-time updates (no refresh needed)
- Map toggle showing tech locations and job sites

### Customer Detail
- Header: name, contact info, quick actions
- Tabs: Properties, Jobs, Estimates, Invoices, Notes, Equipment
- Timeline of all interactions

### Job Detail
- Header: status, customer, property, assigned tech
- Status progression bar (visual workflow)
- Tabs: Details, Line Items, Notes, Photos, Signatures
- Right sidebar: quick actions (change status, reassign, create invoice)

### Schedule (Calendar)
- Day / Week / Month views
- Filter by technician, job type, status
- Drag-and-drop to reschedule
- Click to create new job

### Estimates / Invoices
- List view with status badges, filters, search
- Detail view with line items, totals, action buttons
- Preview mode (see what customer sees)

## Component Library (shadcn/ui)

Key components we'll use extensively:

| Component | Usage |
|---|---|
| **DataTable** | Customer list, job list, invoice list (with sorting, filtering, pagination) |
| **Calendar** | Schedule views |
| **Sheet** | Side panels for job details, customer details |
| **Dialog** | Confirmations, quick-create forms |
| **Command** | Global search (Cmd+K) |
| **Tabs** | Section organization within detail pages |
| **Badge** | Status indicators |
| **Card** | Dashboard widgets, summary blocks |
| **DropdownMenu** | Action menus, status changes |
| **Form** | All data entry with validation |
| **Toast** | Success/error notifications |
| **Tooltip** | Contextual help |

## Accessibility

- WCAG 2.1 AA compliance target
- Semantic HTML throughout
- ARIA labels on interactive elements
- Keyboard navigation support (tab order, focus management)
- Color contrast ratios meet AA standards
- Screen reader friendly status announcements
- Skip-to-content links
- Focus trapping in modals/dialogs

## Navigation Structure

```
Sidebar (collapsible):
├── Dashboard
├── Schedule / Calendar
├── Dispatch Board
├── Customers
├── Jobs
├── Estimates
├── Invoices
├── Reports
└── Settings
    ├── Company Profile
    ├── Team Members
    ├── Services & Pricing
    ├── Notifications
    ├── Integrations
    └── Billing
```

Top bar:
- Global search (Cmd+K)
- Notifications bell
- User avatar + dropdown (profile, preferences, logout)

## Loading & Empty States

- Skeleton loaders for initial page loads (not spinners)
- Empty states with helpful illustrations and CTAs ("No customers yet. Add your first customer.")
- Error states with clear messages and retry actions
- Optimistic updates for immediate feedback
