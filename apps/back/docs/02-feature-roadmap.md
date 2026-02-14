# Feature Roadmap

## Phase 1: MVP (Launch)

The minimum feature set required for a service company to operate day-to-day.

### 1.1 Authentication & Multi-Tenancy
- Company (tenant) registration and onboarding wizard
- User authentication (email/password + OAuth via Supabase Auth)
- Role-based access control (Admin, Office Manager, Dispatcher, CSR, Technician)
- Tenant data isolation at the database level (tenant_id on all tables)
- Invite-based team member onboarding

### 1.2 Customer Management (CRM)
- Customer database (name, phone, email, address, notes)
- Property/service location records (a customer can have multiple properties)
- Equipment tracking per property (brand, model, serial, install date, warranty)
- Full job history per customer and property
- Notes and file attachments on customer records
- Search, filter, and sort across all customer data
- Import customers from CSV

### 1.3 Scheduling & Dispatch
- Calendar view (day, week, month) with drag-and-drop scheduling
- Dispatch board showing all techs, their assignments, and availability
- Job assignment by technician availability
- Recurring/repeat job scheduling
- Double-booking conflict detection
- Unassigned job queue
- Job duration estimation
- Color-coded job status on calendar

### 1.4 Job / Work Order Management
- Create jobs with service type, description, priority, and assignment
- Job status workflow: New -> Scheduled -> Dispatched -> In Progress -> Completed -> Closed
- Link jobs to customers and properties
- Photo and note capture on jobs
- Digital signature capture for job completion
- Job tags and categorization
- Internal notes (visible to staff only) vs customer-facing notes

### 1.5 Estimates & Quoting
- Create professional estimates with line items
- Good/Better/Best multi-option estimates
- Email and SMS estimate delivery to customers
- Customer approval workflow (digital accept/reject via link)
- Convert approved estimate to job and/or invoice
- Estimate status tracking (draft, sent, viewed, approved, declined, expired)
- Estimate templates for common services

### 1.6 Invoicing & Billing
- Auto-generate invoices from completed jobs
- Manual invoice creation
- Line items with descriptions, quantities, rates, taxes
- Email/SMS invoice delivery
- Invoice status tracking (draft, sent, viewed, paid, overdue, void)
- Automated payment reminders (configurable schedule)
- PDF invoice generation with company branding
- Partial payments and payment history

### 1.7 Payment Processing
- Stripe integration for card payments
- Online payment links (customer pays via browser)
- Payment recording for cash/check
- Payment receipts (email)
- Refund processing

### 1.8 Basic Reporting
- Revenue dashboard (daily, weekly, monthly, custom range)
- Jobs completed metrics
- Outstanding invoices / AR aging report
- Technician productivity (jobs completed, revenue generated)
- Estimate conversion rate
- Filterable by date range and technician

### 1.9 Company Settings
- Company profile (name, logo, address, phone, license numbers)
- Business hours configuration
- Service area / zones
- Tax rate configuration
- Invoice/estimate branding and templates
- Notification preferences
- User management (invite, roles, deactivate)

### 1.10 Website Builder / CMS
- Block-based page editor with 14 section types (hero, services, about, testimonials, gallery, contact_form, booking_widget, cta_banner, faq, team, map, features, pricing, custom_html)
- Per-tenant theming (colors, fonts, border radius) via CSS custom properties
- Branding settings (business name, tagline, logo, phone, email)
- SEO defaults and per-page SEO settings
- Social links
- Custom CSS overrides
- 3 industry starter templates (HVAC, Plumbing, General)
- Page management (create, edit, publish, reorder, navigation control)
- Media library for image management
- Service catalog (public-facing service listings with descriptions, pricing, booking)

### 1.11 Online Booking
- Multi-step booking form on tenant's public website
- Service selection, date/time preference, contact details
- Booking request management in admin dashboard
- Status tracking (pending, confirmed, canceled)
- Convert booking to job + customer

### 1.12 Custom Domains
- Subdomain provisioning ({slug}.yourplatform.com)
- Custom domain support with DNS verification (TXT records)
- Automatic SSL via Vercel Domains API
- Domain management UI in admin dashboard

---

## Phase 2: Growth (Months 3-6 Post-Launch)

Features customers will expect shortly after adoption.

### 2.1 Pricebook / Flat-Rate Pricing
- Centralized service and material catalog
- Flat-rate pricing with markup management
- Good/Better/Best presentation in estimates
- Category and tag organization
- Import/export pricebook

### 2.2 GPS Tracking & Basic Routing
- Real-time technician location on dispatch map
- Basic route optimization suggestions
- Map view of all active jobs and techs
- Geofencing for automatic clock-in/out

### 2.3 Automated Customer Communication
- Appointment confirmation (email/SMS)
- Appointment reminder (day before, morning of)
- "Technician on the way" notification with ETA
- Job completion summary to customer
- Review request after job completion
- Configurable message templates

### 2.4 Service Agreements / Memberships
- Create maintenance agreement plans (e.g., "Gold Plan: 2 tune-ups/year")
- Track agreement status, renewal dates, and visits used
- Automated recurring billing
- Automated renewal reminders
- Schedule maintenance visits from agreements
- Member pricing / discounts

### 2.5 Customer Portal
- Branded self-service portal per company
- Customers view job history and upcoming appointments
- Approve/decline estimates online
- Pay invoices online
- Request new service
- Message the company

---

## Phase 3: Differentiation (Months 6-12)

### 3.1 Marketing Tools
- Automated email/SMS campaigns
- Review request automation
- Unsold estimate follow-up campaigns
- Campaign performance tracking

### 3.2 Inventory Management
- Track parts on trucks and in warehouse
- Inventory usage linked to jobs
- Low-stock alerts
- Purchase orders and vendor management

### 3.3 Job Costing
- Track labor hours, materials, and overhead per job
- Profitability analysis per job, tech, service type
- Margin reporting

### 3.4 Advanced Reporting & Dashboards
- Custom dashboard builder
- Technician scorecards
- Trend analysis and forecasting
- Export to CSV/PDF

### 3.5 Timesheet & Payroll Integration
- Automated timesheet tracking (drive time, work time, breaks)
- Overtime calculation
- Export to payroll systems
- Performance pay / commission tracking

---

## Phase 4: Enterprise (12+ Months)

### 4.1 AI-Powered Dispatch
- Machine learning optimal tech assignment
- Predictive scheduling based on historical data

### 4.2 Native Mobile App (Technician)
- iOS and Android apps (React Native / Expo) — in development
- Offline-first with background sync
- Push notifications for new dispatches
- Camera integration for photos/video
- Digital signature capture
- In-field payment collection
- Turn-by-turn navigation to job sites

### 4.3 Fleet Management
- Vehicle GPS tracking
- Geofencing and alerts
- Maintenance reminders
- Fuel tracking

### 4.4 Integrated Phone System
- VoIP integration
- Call tracking and recording
- Caller ID with customer popup
- CSR performance metrics

### 4.5 Consumer Financing
- Financing options for large jobs
- Integration with financing providers (GreenSky, Wisetack, etc.)

### 4.6 Multi-Location / Multi-Brand
- Multi-location management within one account
- Brand-specific settings and branding
- Cross-location reporting

### 4.7 QuickBooks / Accounting Integration
- Two-way sync with QuickBooks Online
- Customer, invoice, and payment synchronization
- Chart of accounts mapping
