export type FeatureStatus = "complete" | "in-progress" | "planned" | "beta";

export interface Feature {
  name: string;
  description: string;
  status: FeatureStatus;
}

export interface FeatureCategory {
  name: string;
  description: string;
  features: Feature[];
}

export interface FeatureComponent {
  id: string;
  name: string;
  description: string;
  categories: FeatureCategory[];
}

export const featureComponents: FeatureComponent[] = [
  {
    id: "admin",
    name: "Admin Dashboard",
    description: "Back-office web application for managing all business operations (port 3200)",
    categories: [
      {
        name: "Dashboard & Navigation",
        description: "Home screen and site-wide features",
        features: [
          { name: "Customizable dashboard", description: "7 theme presets (Classic, Blueprint, Mission Control, Glass, Executive, Arctic, Ocean) with widget management", status: "complete" },
          { name: "Command palette", description: "Quick search and navigation across the entire app", status: "complete" },
          { name: "Notification center", description: "Real-time notification dropdown with mark-as-read", status: "complete" },
          { name: "Role-based access control", description: "5 roles (Admin, Office Manager, Dispatcher, CSR, Technician) with granular permissions", status: "complete" },
          { name: "Activity feed", description: "Recent activity log on dashboard", status: "complete" },
        ],
      },
      {
        name: "Schedule & Dispatch",
        description: "Job scheduling and real-time dispatch",
        features: [
          { name: "Calendar schedule view", description: "Week/day view with technician filtering and date navigation", status: "complete" },
          { name: "Dispatch board", description: "Real-time dispatch with unassigned queue, technician list, and drag assignment", status: "complete" },
          { name: "Live technician tracking", description: "Real-time GPS location of en-route technicians on a map", status: "complete" },
        ],
      },
      {
        name: "Customer Management",
        description: "Customer records and property management",
        features: [
          { name: "Customer CRUD", description: "Create, view, edit, delete customers with contact info and addresses", status: "complete" },
          { name: "Customer search & filters", description: "Search by name/contact, filter by type (residential/commercial)", status: "complete" },
          { name: "Properties", description: "Multiple properties per customer with address and equipment tracking", status: "complete" },
          { name: "Customer portal access", description: "Invite customers to self-service portal, manage access", status: "complete" },
          { name: "Bulk export", description: "Export customer data to CSV", status: "complete" },
        ],
      },
      {
        name: "Job Management",
        description: "Full job lifecycle management",
        features: [
          { name: "Job CRUD", description: "Create, view, edit, delete jobs with full details", status: "complete" },
          { name: "Job status workflow", description: "State machine: New → Scheduled → Dispatched → In Progress → Completed (+ Cancel)", status: "complete" },
          { name: "Technician assignment", description: "Single or multiple technician assignment to jobs", status: "complete" },
          { name: "Line items", description: "Service, material, labor, discount, and other line item types with pricing", status: "complete" },
          { name: "Job notes", description: "Internal and customer-facing notes", status: "complete" },
          { name: "Job photos", description: "Photo upload with tagging and organization", status: "complete" },
          { name: "Signatures", description: "Digital signature capture for proof of work", status: "complete" },
          { name: "Job checklists", description: "Configurable checklists with template auto-apply on dispatch", status: "complete" },
          { name: "Search & filters", description: "Filter by status, priority, technician, date range", status: "complete" },
          { name: "Bulk export", description: "Export job data to CSV", status: "complete" },
          { name: "Job costing", description: "Labor hours × hourly rate, material costs, P&L analysis per job", status: "complete" },
          { name: "Daily snapshots", description: "Multi-day job progress tracking with completion %, labor, and material cost snapshots", status: "complete" },
        ],
      },
      {
        name: "Estimates",
        description: "Multi-option estimate creation and approval workflow",
        features: [
          { name: "Estimate CRUD", description: "Create, view, edit, delete estimates", status: "complete" },
          { name: "Multi-option estimates", description: "Multiple named options per estimate with recommended flag", status: "complete" },
          { name: "Line items per option", description: "Full line item management with quantities and pricing per option", status: "complete" },
          { name: "Status workflow", description: "Draft → Sent → Viewed → Approved/Declined/Expired", status: "complete" },
          { name: "Email sending", description: "Send estimates to customers via email with templates", status: "complete" },
          { name: "Convert to job", description: "One-click conversion of approved estimates to jobs", status: "complete" },
          { name: "Estimate templates", description: "Reusable templates with pre-configured line items", status: "complete" },
          { name: "PDF export", description: "Generate and download estimate PDFs", status: "complete" },
        ],
      },
      {
        name: "Invoices & Payments",
        description: "Invoicing, payment tracking, and Stripe integration",
        features: [
          { name: "Invoice CRUD", description: "Create, view, edit, delete invoices with line items", status: "complete" },
          { name: "Status workflow", description: "Draft → Sent → Viewed → Paid/Partial/Overdue/Void", status: "complete" },
          { name: "Payment recording", description: "Record payments with method, amount, date tracking", status: "complete" },
          { name: "Partial payments", description: "Support for multiple partial payments with balance tracking", status: "complete" },
          { name: "Stripe checkout", description: "Online payment via Stripe Checkout from customer portal", status: "complete" },
          { name: "Email sending", description: "Send invoices to customers via email with templates", status: "complete" },
          { name: "Tax calculation", description: "Configurable tax rates applied to line items", status: "complete" },
          { name: "PDF export", description: "Generate and download invoice PDFs", status: "complete" },
          { name: "Overdue tracking", description: "Automatic overdue detection and management", status: "complete" },
        ],
      },
      {
        name: "Reports & Analytics",
        description: "Business intelligence and reporting",
        features: [
          { name: "Revenue report", description: "Revenue by day/week/month with date range filtering", status: "complete" },
          { name: "Jobs report", description: "Job completion metrics, status breakdown, performance trends", status: "complete" },
          { name: "Invoices & AR report", description: "Outstanding invoices, AR aging analysis, payment tracking", status: "complete" },
          { name: "Technician report", description: "Productivity metrics, jobs completed, revenue per technician", status: "complete" },
          { name: "Timesheets report", description: "Time tracking records, clock in/out, break tracking", status: "complete" },
          { name: "AI custom reports", description: "AI-powered custom report creation with saved queries and widgets", status: "complete" },
          { name: "Daily reports", description: "End-of-day technician reports with material requests, equipment issues, and office notes", status: "complete" },
        ],
      },
      {
        name: "Voice & Calls",
        description: "Twilio voice integration",
        features: [
          { name: "Call history", description: "Paginated call log with direction/status filters and search", status: "complete" },
          { name: "WebRTC calling", description: "Make and receive calls via browser using Twilio Voice", status: "complete" },
          { name: "Call recording", description: "Automatic recording with playback and storage", status: "complete" },
          { name: "Transcription", description: "Call transcription display when enabled", status: "complete" },
          { name: "Call analytics", description: "Duration, completion rates, and call volume metrics", status: "complete" },
          { name: "Customer/job linking", description: "Associate calls with customers and jobs", status: "complete" },
        ],
      },
      {
        name: "Service Agreements",
        description: "Recurring contracts and maintenance plans",
        features: [
          { name: "Agreement CRUD", description: "Create, view, edit, delete recurring service agreements", status: "complete" },
          { name: "Status workflow", description: "Draft → Active → Paused → Completed (+ Cancel)", status: "complete" },
          { name: "Visit scheduling", description: "Schedule recurring visits with tracking", status: "complete" },
          { name: "Auto-job generation", description: "Automatically create jobs from scheduled visits", status: "complete" },
          { name: "Auto-invoicing", description: "Generate invoices based on billing frequency", status: "complete" },
          { name: "Auto-renewal", description: "Configurable auto-renewal with reminder days", status: "complete" },
          { name: "Billing frequencies", description: "Monthly, quarterly, annual, and custom billing cycles", status: "complete" },
        ],
      },
      {
        name: "Website Builder",
        description: "Multi-tenant CMS for public business websites",
        features: [
          { name: "Visual section editors", description: "14 dedicated form editors for all section types — no raw JSON editing", status: "complete" },
          { name: "Drag-and-drop reordering", description: "Reorder sections via drag handle with dnd-kit sortable", status: "complete" },
          { name: "Live preview panel", description: "Split-pane layout with real-time section preview using tenant theme", status: "complete" },
          { name: "Visual section picker", description: "Categorized icon grid dialog for adding new sections", status: "complete" },
          { name: "Section settings", description: "Per-section background color, text color, padding, max width, and full-width toggle", status: "complete" },
          { name: "Sanitized HTML preview", description: "Custom HTML sections render with XSS-safe sanitization in preview", status: "complete" },
          { name: "Page templates", description: "Pre-built page templates for quick setup", status: "complete" },
          { name: "Theme & branding", description: "Custom colors, fonts, logo, border radius, and CSS injection", status: "complete" },
          { name: "SEO management", description: "Per-page title, meta description, and slug configuration", status: "complete" },
          { name: "Service catalog", description: "Manage services displayed on the public website", status: "complete" },
          { name: "Media library", description: "Image upload, organization, and tagging", status: "complete" },
          { name: "Custom domains", description: "Add and verify custom domains with SSL via Vercel DNS", status: "complete" },
          { name: "Online bookings", description: "Public booking form with confirmation/rejection workflow", status: "complete" },
          { name: "Publish workflow", description: "Draft/published states for pages and site", status: "complete" },
        ],
      },
      {
        name: "Communications",
        description: "Email and notification management",
        features: [
          { name: "Email templates", description: "Create and manage email templates with variable substitution", status: "complete" },
          { name: "Triggered notifications", description: "Auto-send emails on estimate sent, invoice sent, job scheduled, etc.", status: "complete" },
          { name: "Communication log", description: "Full history of all sent communications", status: "complete" },
          { name: "Resend integration", description: "Email delivery via Resend API", status: "complete" },
        ],
      },
      {
        name: "AI Assistant",
        description: "AI-powered help and report generation",
        features: [
          { name: "Conversational AI", description: "Multi-turn AI chat for business queries", status: "complete" },
          { name: "Database queries", description: "AI can query business data to answer questions", status: "complete" },
          { name: "Custom report generation", description: "Generate visual reports from natural language", status: "complete" },
        ],
      },
      {
        name: "Settings & Configuration",
        description: "System administration",
        features: [
          { name: "Company profile", description: "Business name, address, logo, license, operating hours", status: "complete" },
          { name: "Team management", description: "Invite users, assign roles, activate/deactivate", status: "complete" },
          { name: "Services & pricing", description: "Service types, tax rates, business hours configuration", status: "complete" },
          { name: "Pricebook catalog", description: "Standard pricing for services, materials, labor with categories", status: "complete" },
          { name: "Checklist templates", description: "Reusable job checklists with auto-apply rules", status: "complete" },
          { name: "Estimate templates", description: "Reusable estimate templates with pre-configured items", status: "complete" },
          { name: "Voice & calls config", description: "Twilio phone number, recording, voicemail, transcription settings", status: "complete" },
          { name: "Notification settings", description: "Email template management and trigger configuration", status: "complete" },
          { name: "Company equipment", description: "Equipment registry with maintenance logs and assignment tracking", status: "complete" },
          { name: "QuickBooks integration", description: "OAuth connection, sync invoices/customers, error tracking", status: "complete" },
          { name: "Billing & subscription", description: "Subscription plan and payment method management", status: "planned" },
          { name: "Vehicle & trailer maintenance", description: "Periodic reminders for vehicle maintenance, tire checks, battery checks, trailer inspections", status: "complete" },
          { name: "Day-before appointment reminders", description: "Automated SMS/email reminder to customers the day before scheduled appointments", status: "complete" },
          { name: "Landscape area calculator", description: "Area measurement with instant good/better/best pricing for landscaping estimates", status: "complete" },
        ],
      },
    ],
  },
  {
    id: "mobile",
    name: "Mobile App",
    description: "React Native / Expo technician field app for iOS and Android",
    categories: [
      {
        name: "Home & Dashboard",
        description: "Technician daily overview",
        features: [
          { name: "Daily stats", description: "Today's jobs, in-progress, completed count, and daily earnings", status: "complete" },
          { name: "Next job card", description: "Highlighted upcoming job with quick access", status: "complete" },
          { name: "Today's schedule", description: "Scrollable list of all daily jobs", status: "complete" },
          { name: "Clock widget", description: "One-tap clock in/out with break tracking on home screen", status: "complete" },
          { name: "Quick actions", description: "Rapid access buttons for common tasks", status: "complete" },
        ],
      },
      {
        name: "Job Management",
        description: "Core technician workflow",
        features: [
          { name: "Job list", description: "Filterable job list (Active, Completed, All) with search", status: "complete" },
          { name: "Job detail with tabs", description: "Overview, Work, Media, History tabs for each job", status: "complete" },
          { name: "Status transitions", description: "Guided status changes with confirmation dialogs and haptic feedback", status: "complete" },
          { name: "Time tracker", description: "Start/stop work time tracking per job", status: "complete" },
          { name: "Checklists", description: "Toggle checklist items with offline queue support", status: "complete" },
          { name: "Line items", description: "Add labor, material, service items with pricing", status: "complete" },
          { name: "Job notes", description: "Add notes with voice-to-text input support", status: "complete" },
          { name: "Photo capture", description: "Camera integration with offline storage and auto-upload", status: "complete" },
          { name: "Photo gate on completion", description: "Minimum 3 after photos required before job can be completed, server-enforced", status: "complete" },
          { name: "Signature capture", description: "Customer signature collection with canvas", status: "complete" },
          { name: "Quick action bar", description: "Call, Navigate, Add Note, Take Photo, Create Invoice shortcuts", status: "complete" },
          { name: "GPS navigation", description: "Launch Apple Maps, Google Maps, or Waze to job location", status: "complete" },
          { name: "Create invoice from job", description: "Quick invoice creation when job is completed", status: "complete" },
        ],
      },
      {
        name: "Schedule",
        description: "Calendar and timeline views",
        features: [
          { name: "Day view", description: "List or timeline visualization for single day", status: "complete" },
          { name: "Week view", description: "7-day calendar with job counts per day", status: "complete" },
          { name: "Timeline view", description: "Visual timeline grid (6AM-8PM) with color-coded job blocks", status: "complete" },
          { name: "Gap detection", description: "Highlights breaks >= 1 hour between jobs", status: "complete" },
          { name: "Unscheduled jobs", description: "Section showing jobs without scheduled times", status: "complete" },
        ],
      },
      {
        name: "Estimates",
        description: "Create and view estimates in the field",
        features: [
          { name: "Estimate list", description: "Filterable list with status badges and amounts", status: "complete" },
          { name: "Multi-step create wizard", description: "5-step wizard: Customer → Property → Options → Details → Review", status: "complete" },
          { name: "Pricebook integration", description: "Select items from pricebook when building estimates", status: "complete" },
          { name: "Draft auto-save", description: "Wizard state persisted to resume unfinished estimates", status: "complete" },
          { name: "Estimate detail view", description: "Full estimate view with all options and line items", status: "complete" },
        ],
      },
      {
        name: "Invoices & Customers",
        description: "View invoices and customer info",
        features: [
          { name: "Invoice list", description: "Searchable list with status filters (Draft, Sent, Paid, Overdue)", status: "complete" },
          { name: "Invoice detail", description: "Full invoice view with line items, payments, and balance", status: "complete" },
          { name: "Payment recording", description: "Record payments with amount and method", status: "complete" },
          { name: "Customer list", description: "Searchable customer browser with contact info", status: "complete" },
          { name: "Customer detail", description: "Contact info, properties, job history, invoices", status: "complete" },
        ],
      },
      {
        name: "Time Tracking",
        description: "Clock in/out and break management",
        features: [
          { name: "Clock in/out", description: "One-tap with optional GPS capture, persists across app restarts", status: "complete" },
          { name: "Break tracking", description: "Start/end breaks within clocked-in sessions", status: "complete" },
          { name: "Clock-out prompts", description: "End-of-day prompt for material requests, equipment issues, and office notes for tomorrow", status: "complete" },
          { name: "Offline queueing", description: "Clock events queued when offline with exponential backoff retry", status: "complete" },
        ],
      },
      {
        name: "Offline & Sync",
        description: "Offline-first capabilities",
        features: [
          { name: "Offline mutation queue", description: "Automatic queueing of all mutations when offline", status: "complete" },
          { name: "Offline photo storage", description: "Photos saved to filesystem, auto-upload when online (max 100)", status: "complete" },
          { name: "Optimistic updates", description: "UI updates immediately with temp IDs, syncs in background", status: "complete" },
          { name: "Network monitoring", description: "Real-time connectivity detection with toast notifications", status: "complete" },
          { name: "Auto-retry", description: "Exponential backoff (1s-16s) with max 5 retries per mutation", status: "complete" },
          { name: "Pending sync badge", description: "Visual indicator showing queued mutation count", status: "complete" },
        ],
      },
      {
        name: "Location & Tracking",
        description: "GPS and navigation features",
        features: [
          { name: "Live location sharing", description: "Background GPS updates every 15s when en route to customer", status: "complete" },
          { name: "Location capture on status change", description: "GPS snapshot on en_route, in_progress, completed transitions", status: "complete" },
          { name: "Navigation integration", description: "Launch preferred map app (Apple Maps, Google Maps, Waze)", status: "complete" },
          { name: "En route indicator", description: "Shows live location sharing status on job detail", status: "complete" },
          { name: "Geofencing", description: "Auto-triggers job details when arriving at property (100m radius), requires dispatched status to avoid false triggers", status: "complete" },
        ],
      },
      {
        name: "Property & Context",
        description: "Job site context and history for field workers",
        features: [
          { name: "Property history banner", description: "Shows gate codes, obstacles, last visit info, and previous job notes when arriving at a property", status: "complete" },
          { name: "Substitute tech context", description: "Detects when a different technician is covering and surfaces all prior property history", status: "complete" },
          { name: "Daily reports", description: "End-of-day report submission with material requests, equipment issues, and notes", status: "complete" },
        ],
      },
      {
        name: "Accessibility & UX",
        description: "Enhanced usability features",
        features: [
          { name: "Field Mode", description: "High-contrast mode with enlarged tap targets (56px+) for outdoor use", status: "complete" },
          { name: "Voice-to-text", description: "Voice input for notes via speech recognition with locale support", status: "complete" },
          { name: "Dark mode", description: "System default or manual light/dark override", status: "complete" },
          { name: "Haptic feedback", description: "Tactile feedback on button presses and status changes", status: "complete" },
          { name: "Biometric lock", description: "Session timeout with biometric re-authentication", status: "complete" },
          { name: "Push notifications", description: "Job assigned, job updated, new estimate notifications", status: "complete" },
        ],
      },
      {
        name: "Profile & Settings",
        description: "User profile and app configuration",
        features: [
          { name: "User profile", description: "Name, role, email, and performance metrics display", status: "complete" },
          { name: "Map app preference", description: "Choose default navigation app (Google Maps, Waze, Apple Maps)", status: "complete" },
          { name: "Notification toggles", description: "Per-type notification enable/disable", status: "complete" },
          { name: "Performance stats", description: "Jobs completed, satisfaction ratings, avg job duration", status: "complete" },
        ],
      },
    ],
  },
  {
    id: "website",
    name: "Customer Website",
    description: "Public-facing tenant website with CMS-driven pages (port 3201)",
    categories: [
      {
        name: "CMS & Content",
        description: "Dynamic content management system",
        features: [
          { name: "Multi-tenant sites", description: "Each tenant gets a unique subdomain or custom domain", status: "complete" },
          { name: "Dynamic homepage", description: "CMS-driven homepage with configurable sections", status: "complete" },
          { name: "Dynamic pages", description: "Unlimited CMS pages with custom slugs (About, Services, etc.)", status: "complete" },
          { name: "13+ section types", description: "Hero, Services Grid, About, Testimonials, Gallery, Contact, FAQ, Team, Map, Features, Pricing, CTA, Custom HTML", status: "complete" },
          { name: "SEO metadata", description: "Per-page title, description, and slug for search engines", status: "complete" },
          { name: "Tenant caching", description: "5-minute LRU cache for performance", status: "complete" },
        ],
      },
      {
        name: "Branding & Theming",
        description: "Visual customization per tenant",
        features: [
          { name: "Color customization", description: "Primary, secondary, accent colors via CSS variables", status: "complete" },
          { name: "Font customization", description: "Custom heading and body fonts", status: "complete" },
          { name: "Logo display", description: "Tenant logo in header and branding areas", status: "complete" },
          { name: "Custom CSS", description: "Inject custom CSS for advanced styling", status: "complete" },
          { name: "Border radius control", description: "Customize UI roundness globally", status: "complete" },
        ],
      },
      {
        name: "Online Booking",
        description: "Public booking form for customers",
        features: [
          { name: "Booking wizard", description: "Multi-step form: Service → Date/Time → Contact → Review → Confirmation", status: "complete" },
          { name: "Service selection", description: "Choose from tenant's published services with pricing", status: "complete" },
          { name: "Date/time picker", description: "Calendar date selection with morning/afternoon/evening slots", status: "complete" },
          { name: "Contact capture", description: "Name, email, phone, and optional address collection", status: "complete" },
        ],
      },
      {
        name: "Live Tracking",
        description: "Customer-facing technician tracking",
        features: [
          { name: "Tracking page", description: "Token-based shareable URL, no login required", status: "complete" },
          { name: "Live map", description: "Real-time technician location on map with routing", status: "complete" },
          { name: "ETA display", description: "Estimated arrival time with countdown", status: "complete" },
          { name: "Status updates", description: "Active, Completed (arrived), Expired states", status: "complete" },
        ],
      },
      {
        name: "Navigation & Layout",
        description: "Site structure",
        features: [
          { name: "Dynamic header", description: "Logo, navigation links, phone number", status: "complete" },
          { name: "Dynamic footer", description: "Company info, phone, email, social media links", status: "complete" },
          { name: "Responsive design", description: "Mobile-friendly layout across all pages", status: "complete" },
        ],
      },
    ],
  },
  {
    id: "portal",
    name: "Customer Portal",
    description: "Self-service portal for customers to view jobs, pay invoices, and approve estimates",
    categories: [
      {
        name: "Authentication",
        description: "Customer login and onboarding",
        features: [
          { name: "Portal login", description: "Supabase Auth email/password login for customers", status: "complete" },
          { name: "Invite acceptance", description: "Set password flow from email invitation link", status: "complete" },
          { name: "Access control", description: "Portal access gated by admin-controlled flag per customer", status: "complete" },
          { name: "Login tracking", description: "Last portal login timestamp tracked", status: "complete" },
        ],
      },
      {
        name: "Dashboard",
        description: "Customer overview page",
        features: [
          { name: "KPI cards", description: "Total jobs, open invoices (count + amount), pending estimates, active agreements", status: "complete" },
        ],
      },
      {
        name: "Jobs",
        description: "View job history and status",
        features: [
          { name: "Job list", description: "Table of all customer jobs with status badges", status: "complete" },
          { name: "Job detail", description: "Summary, description, priority, type, dates, address, notes", status: "complete" },
          { name: "Live tracking link", description: "Track Your Technician button when job is en_route", status: "complete" },
        ],
      },
      {
        name: "Invoices",
        description: "View and pay invoices",
        features: [
          { name: "Invoice list", description: "Table with status, due date, total, and balance due", status: "complete" },
          { name: "Invoice detail", description: "Line items, subtotal/tax/total, payment history", status: "complete" },
          { name: "Online payment", description: "Pay Now button via Stripe Checkout for outstanding balance", status: "complete" },
        ],
      },
      {
        name: "Estimates",
        description: "Review and respond to estimates",
        features: [
          { name: "Estimate list", description: "Table with status, total, and validity date", status: "complete" },
          { name: "Estimate detail", description: "Multi-option view with items, quantities, pricing per option", status: "complete" },
          { name: "Approve / decline", description: "Customer can approve or decline estimates directly", status: "complete" },
        ],
      },
      {
        name: "Agreements",
        description: "View service agreements and visits",
        features: [
          { name: "Agreement list", description: "Table with status, dates, and total value", status: "complete" },
          { name: "Agreement detail", description: "Services, visits with scheduled/completed dates, billing info", status: "complete" },
        ],
      },
      {
        name: "Profile",
        description: "Customer account management",
        features: [
          { name: "View profile", description: "Name and email display", status: "complete" },
          { name: "Change password", description: "Password update form", status: "complete" },
        ],
      },
    ],
  },
  {
    id: "platform",
    name: "Platform & Infrastructure",
    description: "Cross-cutting capabilities and integrations",
    categories: [
      {
        name: "Multi-Tenancy",
        description: "Shared infrastructure with data isolation",
        features: [
          { name: "Tenant isolation", description: "All data scoped by tenant_id at app and RLS level", status: "complete" },
          { name: "Subdomain routing", description: "Each tenant gets a unique subdomain for their website", status: "complete" },
          { name: "Custom domains", description: "Tenants can add verified custom domains with SSL", status: "complete" },
          { name: "Tenant-scoped sequences", description: "Atomic sequential numbering per tenant for invoices, estimates, etc.", status: "complete" },
        ],
      },
      {
        name: "Integrations",
        description: "Third-party service connections",
        features: [
          { name: "Stripe Connect", description: "Payment processing for invoices via Stripe Checkout", status: "complete" },
          { name: "Stripe webhooks", description: "Automatic payment status updates via webhook", status: "complete" },
          { name: "Twilio Voice", description: "VoIP calling with WebRTC, recording, transcription", status: "complete" },
          { name: "Resend email", description: "Transactional email delivery for all notifications", status: "complete" },
          { name: "QuickBooks Online", description: "OAuth sync for invoices and customers", status: "complete" },
          { name: "Vercel DNS", description: "Custom domain verification and SSL provisioning", status: "complete" },
          { name: "Supabase Auth", description: "Authentication for both admin users and portal customers", status: "complete" },
          { name: "Supabase Storage", description: "File storage for photos, media, and documents", status: "complete" },
        ],
      },
      {
        name: "API",
        description: "REST API for mobile and integrations",
        features: [
          { name: "Versioned REST API", description: "100+ endpoints under /api/v1/* for mobile app and integrations", status: "complete" },
          { name: "Public API", description: "Unauthenticated endpoints for website and booking", status: "complete" },
          { name: "Webhook endpoints", description: "Stripe, Twilio voice/recording/transcription webhooks", status: "complete" },
          { name: "Shared type system", description: "@fieldservice/api-types package for type-safe API contracts", status: "complete" },
        ],
      },
      {
        name: "Database",
        description: "Data layer and ORM",
        features: [
          { name: "Drizzle ORM", description: "Type-safe PostgreSQL access with 34 tables across all modules", status: "complete" },
          { name: "Schema namespacing", description: "All tables under 'fieldservice' PostgreSQL schema", status: "complete" },
          { name: "Seed scripts", description: "Dev and production seed scripts for initial data setup", status: "complete" },
          { name: "Row-level security", description: "Supabase RLS policies for additional data protection", status: "complete" },
        ],
      },
      {
        name: "DevOps",
        description: "Development and deployment infrastructure",
        features: [
          { name: "Turborepo monorepo", description: "pnpm workspaces with parallel builds and type checking", status: "complete" },
          { name: "Docker development", description: "Containerized dev environment with Claude Code support", status: "complete" },
          { name: "Vercel deployment", description: "Production hosting for admin and front apps", status: "complete" },
          { name: "Shared packages", description: "api-types and shared packages for code reuse across apps", status: "complete" },
        ],
      },
    ],
  },
];
