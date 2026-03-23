-- ============================================================
-- Production Migration: Bring DB up to current schema
-- Safe to run multiple times (all statements are idempotent)
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

-- New enum values on existing enums
DO $$ BEGIN
  ALTER TYPE fieldservice.job_status ADD VALUE IF NOT EXISTS 'en_route' BEFORE 'in_progress';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- New enums
DO $$ BEGIN CREATE TYPE fieldservice.job_assignment_role AS ENUM ('lead', 'member'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fieldservice.photo_type AS ENUM ('general', 'before', 'after'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fieldservice.time_entry_type AS ENUM ('clock_in', 'clock_out', 'break_start', 'break_end'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fieldservice.communication_type AS ENUM ('email', 'sms'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fieldservice.communication_status AS ENUM ('pending', 'sent', 'delivered', 'bounced', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fieldservice.agreement_status AS ENUM ('draft', 'active', 'paused', 'completed', 'canceled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fieldservice.billing_frequency AS ENUM ('monthly', 'quarterly', 'semi_annual', 'annual', 'one_time'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fieldservice.agreement_visit_status AS ENUM ('scheduled', 'completed', 'skipped', 'canceled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fieldservice.call_direction AS ENUM ('inbound', 'outbound'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fieldservice.call_status AS ENUM ('initiated', 'ringing', 'in_progress', 'completed', 'busy', 'no_answer', 'failed', 'canceled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fieldservice.recording_status AS ENUM ('processing', 'completed', 'failed', 'deleted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fieldservice.transcription_status AS ENUM ('none', 'processing', 'completed', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fieldservice.tracking_session_status AS ENUM ('active', 'completed', 'expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add 'sms' to communication_type if it only has 'email'
DO $$ BEGIN
  ALTER TYPE fieldservice.communication_type ADD VALUE IF NOT EXISTS 'sms';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. NEW COLUMNS ON EXISTING TABLES
-- ============================================================

-- users
ALTER TABLE fieldservice.users ADD COLUMN IF NOT EXISTS bio text;

-- jobs
ALTER TABLE fieldservice.jobs ADD COLUMN IF NOT EXISTS start_latitude numeric(10, 7);
ALTER TABLE fieldservice.jobs ADD COLUMN IF NOT EXISTS start_longitude numeric(10, 7);
ALTER TABLE fieldservice.jobs ADD COLUMN IF NOT EXISTS end_latitude numeric(10, 7);
ALTER TABLE fieldservice.jobs ADD COLUMN IF NOT EXISTS end_longitude numeric(10, 7);
ALTER TABLE fieldservice.jobs ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp with time zone;

-- job_photos
DO $$ BEGIN
  ALTER TABLE fieldservice.job_photos ADD COLUMN photo_type fieldservice.photo_type DEFAULT 'general' NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
ALTER TABLE fieldservice.job_photos ADD COLUMN IF NOT EXISTS estimate_id uuid;

-- customers
ALTER TABLE fieldservice.customers ADD COLUMN IF NOT EXISTS invited_at timestamp with time zone;
ALTER TABLE fieldservice.customers ADD COLUMN IF NOT EXISTS last_portal_login_at timestamp with time zone;

-- properties
ALTER TABLE fieldservice.properties ADD COLUMN IF NOT EXISTS lot_size_sqft integer;
ALTER TABLE fieldservice.properties ADD COLUMN IF NOT EXISTS lawn_area_sqft integer;
ALTER TABLE fieldservice.properties ADD COLUMN IF NOT EXISTS property_metadata jsonb;

-- communication_log
ALTER TABLE fieldservice.communication_log ADD COLUMN IF NOT EXISTS recipient_phone varchar(50);

-- site_pages
ALTER TABLE fieldservice.site_pages ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;

-- ============================================================
-- 3. NEW TABLES (Migration 0001: assignments, checklists, templates, time entries)
-- ============================================================

CREATE TABLE IF NOT EXISTS fieldservice.job_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES fieldservice.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES fieldservice.users(id),
  role fieldservice.job_assignment_role DEFAULT 'member' NOT NULL,
  assigned_at timestamp with time zone DEFAULT now() NOT NULL,
  assigned_by uuid NOT NULL REFERENCES fieldservice.users(id)
);

CREATE TABLE IF NOT EXISTS fieldservice.job_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES fieldservice.jobs(id) ON DELETE CASCADE,
  label varchar(500) NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamp with time zone,
  completed_by uuid REFERENCES fieldservice.users(id),
  group_name varchar(255),
  group_sort_order integer DEFAULT 0 NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  job_type varchar(100),
  is_active boolean DEFAULT true NOT NULL,
  auto_apply_on_dispatch boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.checklist_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES fieldservice.checklist_templates(id) ON DELETE CASCADE,
  label varchar(500) NOT NULL,
  group_name varchar(255),
  group_sort_order integer DEFAULT 0 NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.estimate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  summary varchar(500),
  notes text,
  job_type varchar(100),
  auto_apply_for_job_type boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.estimate_template_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES fieldservice.estimate_templates(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  is_recommended boolean DEFAULT false NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.estimate_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES fieldservice.estimate_template_options(id) ON DELETE CASCADE,
  pricebook_item_id uuid REFERENCES fieldservice.pricebook_items(id),
  description varchar(500) NOT NULL,
  quantity numeric(10, 2) DEFAULT '1' NOT NULL,
  unit_price numeric(12, 2) NOT NULL,
  type fieldservice.line_item_type DEFAULT 'service' NOT NULL,
  quantity_formula varchar(255),
  base_quantity numeric(10, 2),
  sort_order integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES fieldservice.users(id) ON DELETE CASCADE,
  type fieldservice.time_entry_type NOT NULL,
  "timestamp" timestamp with time zone NOT NULL,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  job_id uuid REFERENCES fieldservice.jobs(id),
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- 4. NEW TABLES (Migration 0002: QB, AI, calls, tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS fieldservice.qb_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  realm_id varchar(50) NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  access_token_expires_at timestamp with time zone NOT NULL,
  refresh_token_expires_at timestamp with time zone NOT NULL,
  company_name varchar(255),
  is_active boolean DEFAULT true NOT NULL,
  connected_by uuid REFERENCES fieldservice.users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.qb_entity_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  entity_type varchar(50) NOT NULL,
  local_entity_id uuid NOT NULL,
  qb_entity_id varchar(100) NOT NULL,
  qb_sync_token varchar(50),
  last_sync_status varchar(20) DEFAULT 'success' NOT NULL,
  last_sync_error text,
  last_synced_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.qb_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  entity_type varchar(50) NOT NULL,
  local_entity_id uuid NOT NULL,
  qb_entity_id varchar(100),
  operation varchar(20) NOT NULL,
  status varchar(20) NOT NULL,
  request_payload text,
  response_payload text,
  error_message text,
  duration_ms integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES fieldservice.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES fieldservice.ai_conversations(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.ai_custom_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES fieldservice.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES fieldservice.ai_conversations(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  report_config jsonb NOT NULL,
  query_definition jsonb NOT NULL,
  cached_data jsonb,
  last_refreshed_at timestamp DEFAULT now(),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.ai_dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES fieldservice.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES fieldservice.ai_conversations(id) ON DELETE SET NULL,
  title text NOT NULL,
  widget_config jsonb NOT NULL,
  query_definition jsonb NOT NULL,
  cached_data jsonb,
  last_refreshed_at timestamp DEFAULT now(),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.user_dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES fieldservice.users(id) ON DELETE CASCADE,
  widget_order jsonb DEFAULT '[]'::jsonb NOT NULL,
  widget_sizes jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT user_dashboard_layouts_tenant_user_uniq UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS fieldservice.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  call_sid varchar(64) NOT NULL,
  direction fieldservice.call_direction NOT NULL,
  from_number varchar(50) NOT NULL,
  to_number varchar(50) NOT NULL,
  status fieldservice.call_status DEFAULT 'initiated' NOT NULL,
  duration integer,
  customer_id uuid REFERENCES fieldservice.customers(id),
  job_id uuid REFERENCES fieldservice.jobs(id),
  user_id uuid REFERENCES fieldservice.users(id),
  notes text,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.call_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  call_id uuid NOT NULL REFERENCES fieldservice.calls(id) ON DELETE CASCADE,
  recording_sid varchar(64) NOT NULL,
  duration integer,
  recording_url text,
  status fieldservice.recording_status DEFAULT 'processing' NOT NULL,
  transcription_text text,
  transcription_status fieldservice.transcription_status DEFAULT 'none' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.tracking_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES fieldservice.jobs(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES fieldservice.users(id),
  token varchar(64) NOT NULL,
  status fieldservice.tracking_session_status DEFAULT 'active' NOT NULL,
  current_latitude numeric(10, 7),
  current_longitude numeric(10, 7),
  destination_latitude numeric(10, 7),
  destination_longitude numeric(10, 7),
  eta_minutes integer,
  last_location_at timestamp with time zone,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  ended_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- 5. NEW TABLES (Migration 0003: landscaping - daily reports, equipment, snapshots)
-- ============================================================

CREATE TABLE IF NOT EXISTS fieldservice.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES fieldservice.users(id),
  report_date date NOT NULL,
  material_requests text,
  equipment_issues text,
  office_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT daily_reports_tenant_user_date_uniq UNIQUE (tenant_id, user_id, report_date)
);

CREATE TABLE IF NOT EXISTS fieldservice.company_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  type varchar(100) NOT NULL,
  serial_number varchar(100),
  brand varchar(100),
  model varchar(100),
  purchase_date date,
  purchase_cost numeric(12, 2),
  last_service_date date,
  next_service_due date,
  hours_used integer DEFAULT 0,
  service_interval_days integer,
  service_interval_hours integer,
  status varchar(50) DEFAULT 'available' NOT NULL,
  assigned_to uuid REFERENCES fieldservice.users(id),
  notes text,
  last_reminder_sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.equipment_maintenance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES fieldservice.company_equipment(id) ON DELETE CASCADE,
  type varchar(100) NOT NULL,
  description text,
  cost numeric(12, 2),
  performed_by uuid REFERENCES fieldservice.users(id),
  performed_at date NOT NULL,
  hours_at_service integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fieldservice.job_daily_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES fieldservice.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES fieldservice.users(id),
  snapshot_date date NOT NULL,
  completion_percent integer,
  labor_hours numeric(10, 2),
  labor_cost numeric(12, 2),
  material_cost numeric(12, 2),
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- 6. NEW TABLE: Push Tokens (not in any migration)
-- ============================================================

CREATE TABLE IF NOT EXISTS fieldservice.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES fieldservice.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES fieldservice.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform varchar(10) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- 7. COLUMNS ADDED AFTER MIGRATIONS (not in 0000-0003)
-- ============================================================

-- company_equipment (if table was created by migration 0003 without these)
ALTER TABLE fieldservice.company_equipment ADD COLUMN IF NOT EXISTS service_interval_days integer;
ALTER TABLE fieldservice.company_equipment ADD COLUMN IF NOT EXISTS service_interval_hours integer;
ALTER TABLE fieldservice.company_equipment ADD COLUMN IF NOT EXISTS last_reminder_sent_at timestamp with time zone;

-- job_checklist_items (if table was created by migration 0001 without group columns)
ALTER TABLE fieldservice.job_checklist_items ADD COLUMN IF NOT EXISTS group_name varchar(255);
ALTER TABLE fieldservice.job_checklist_items ADD COLUMN IF NOT EXISTS group_sort_order integer DEFAULT 0 NOT NULL;

-- checklist_template_items
ALTER TABLE fieldservice.checklist_template_items ADD COLUMN IF NOT EXISTS group_name varchar(255);
ALTER TABLE fieldservice.checklist_template_items ADD COLUMN IF NOT EXISTS group_sort_order integer DEFAULT 0 NOT NULL;

-- checklist_templates
ALTER TABLE fieldservice.checklist_templates ADD COLUMN IF NOT EXISTS auto_apply_on_dispatch boolean DEFAULT false NOT NULL;

-- estimate_templates
ALTER TABLE fieldservice.estimate_templates ADD COLUMN IF NOT EXISTS job_type varchar(100);
ALTER TABLE fieldservice.estimate_templates ADD COLUMN IF NOT EXISTS auto_apply_for_job_type boolean DEFAULT false NOT NULL;

-- estimate_template_items
ALTER TABLE fieldservice.estimate_template_items ADD COLUMN IF NOT EXISTS quantity_formula varchar(255);
ALTER TABLE fieldservice.estimate_template_items ADD COLUMN IF NOT EXISTS base_quantity numeric(10, 2);

-- ============================================================
-- 8. INDEXES (all idempotent with IF NOT EXISTS)
-- ============================================================

-- job_assignments
CREATE INDEX IF NOT EXISTS job_assignments_job_idx ON fieldservice.job_assignments (tenant_id, job_id);
CREATE INDEX IF NOT EXISTS job_assignments_user_idx ON fieldservice.job_assignments (tenant_id, user_id);

-- job_checklist_items
CREATE INDEX IF NOT EXISTS job_checklist_items_job_idx ON fieldservice.job_checklist_items (tenant_id, job_id);

-- checklist_templates
CREATE INDEX IF NOT EXISTS checklist_templates_tenant_idx ON fieldservice.checklist_templates (tenant_id);
CREATE INDEX IF NOT EXISTS checklist_template_items_template_idx ON fieldservice.checklist_template_items (tenant_id, template_id);

-- estimate_templates
CREATE INDEX IF NOT EXISTS estimate_templates_tenant_idx ON fieldservice.estimate_templates (tenant_id);
CREATE INDEX IF NOT EXISTS estimate_template_options_template_idx ON fieldservice.estimate_template_options (tenant_id, template_id);
CREATE INDEX IF NOT EXISTS estimate_template_items_option_idx ON fieldservice.estimate_template_items (tenant_id, option_id);

-- time_entries
CREATE INDEX IF NOT EXISTS time_entries_user_timestamp_idx ON fieldservice.time_entries (tenant_id, user_id, "timestamp");
CREATE INDEX IF NOT EXISTS time_entries_timestamp_idx ON fieldservice.time_entries (tenant_id, "timestamp");

-- qb
CREATE UNIQUE INDEX IF NOT EXISTS qb_connections_tenant_id_idx ON fieldservice.qb_connections (tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS qb_entity_mappings_unique_idx ON fieldservice.qb_entity_mappings (tenant_id, entity_type, local_entity_id);
CREATE INDEX IF NOT EXISTS qb_entity_mappings_tenant_type_idx ON fieldservice.qb_entity_mappings (tenant_id, entity_type);
CREATE INDEX IF NOT EXISTS qb_sync_log_tenant_idx ON fieldservice.qb_sync_log (tenant_id);
CREATE INDEX IF NOT EXISTS qb_sync_log_tenant_entity_idx ON fieldservice.qb_sync_log (tenant_id, entity_type, local_entity_id);
CREATE INDEX IF NOT EXISTS qb_sync_log_tenant_status_idx ON fieldservice.qb_sync_log (tenant_id, status);
CREATE INDEX IF NOT EXISTS qb_sync_log_created_idx ON fieldservice.qb_sync_log (created_at);

-- ai
CREATE INDEX IF NOT EXISTS ai_conversations_tenant_user_idx ON fieldservice.ai_conversations (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS ai_conversations_tenant_updated_idx ON fieldservice.ai_conversations (tenant_id, updated_at);
CREATE INDEX IF NOT EXISTS ai_messages_conversation_idx ON fieldservice.ai_messages (conversation_id);
CREATE INDEX IF NOT EXISTS ai_messages_tenant_idx ON fieldservice.ai_messages (tenant_id);
CREATE INDEX IF NOT EXISTS ai_custom_reports_tenant_user_idx ON fieldservice.ai_custom_reports (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS ai_custom_reports_active_idx ON fieldservice.ai_custom_reports (tenant_id, user_id, is_active);
CREATE INDEX IF NOT EXISTS ai_dashboard_widgets_tenant_user_idx ON fieldservice.ai_dashboard_widgets (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS ai_dashboard_widgets_active_idx ON fieldservice.ai_dashboard_widgets (tenant_id, user_id, is_active);
CREATE INDEX IF NOT EXISTS user_dashboard_layouts_tenant_user_idx ON fieldservice.user_dashboard_layouts (tenant_id, user_id);

-- calls
CREATE INDEX IF NOT EXISTS calls_tenant_idx ON fieldservice.calls (tenant_id);
CREATE INDEX IF NOT EXISTS calls_tenant_customer_idx ON fieldservice.calls (tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS calls_tenant_job_idx ON fieldservice.calls (tenant_id, job_id);
CREATE INDEX IF NOT EXISTS calls_tenant_created_idx ON fieldservice.calls (tenant_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS calls_call_sid_idx ON fieldservice.calls (call_sid);
CREATE INDEX IF NOT EXISTS calls_tenant_from_idx ON fieldservice.calls (tenant_id, from_number);
CREATE INDEX IF NOT EXISTS calls_tenant_to_idx ON fieldservice.calls (tenant_id, to_number);
CREATE INDEX IF NOT EXISTS call_recordings_call_idx ON fieldservice.call_recordings (call_id);
CREATE UNIQUE INDEX IF NOT EXISTS call_recordings_sid_idx ON fieldservice.call_recordings (recording_sid);

-- tracking
CREATE UNIQUE INDEX IF NOT EXISTS tracking_sessions_token_idx ON fieldservice.tracking_sessions (token);
CREATE INDEX IF NOT EXISTS tracking_sessions_tenant_job_idx ON fieldservice.tracking_sessions (tenant_id, job_id);
CREATE INDEX IF NOT EXISTS tracking_sessions_status_idx ON fieldservice.tracking_sessions (status);

-- daily_reports
CREATE INDEX IF NOT EXISTS daily_reports_tenant_date_idx ON fieldservice.daily_reports (tenant_id, report_date);
CREATE INDEX IF NOT EXISTS daily_reports_tenant_user_idx ON fieldservice.daily_reports (tenant_id, user_id, report_date);

-- company_equipment
CREATE INDEX IF NOT EXISTS company_equipment_tenant_idx ON fieldservice.company_equipment (tenant_id);
CREATE INDEX IF NOT EXISTS company_equipment_tenant_status_idx ON fieldservice.company_equipment (tenant_id, status);

-- equipment_maintenance_log
CREATE INDEX IF NOT EXISTS equipment_maintenance_log_equipment_idx ON fieldservice.equipment_maintenance_log (tenant_id, equipment_id);

-- job_daily_snapshots
CREATE INDEX IF NOT EXISTS job_daily_snapshots_job_idx ON fieldservice.job_daily_snapshots (tenant_id, job_id);
CREATE INDEX IF NOT EXISTS job_daily_snapshots_date_idx ON fieldservice.job_daily_snapshots (tenant_id, job_id, snapshot_date);

-- push_tokens
CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON fieldservice.push_tokens (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS push_tokens_token_idx ON fieldservice.push_tokens (token);

-- ============================================================
-- Done!
-- ============================================================
