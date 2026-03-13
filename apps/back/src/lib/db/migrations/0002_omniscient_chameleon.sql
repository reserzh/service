CREATE TYPE "fieldservice"."call_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "fieldservice"."call_status" AS ENUM('initiated', 'ringing', 'in_progress', 'completed', 'busy', 'no_answer', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "fieldservice"."recording_status" AS ENUM('processing', 'completed', 'failed', 'deleted');--> statement-breakpoint
CREATE TYPE "fieldservice"."transcription_status" AS ENUM('none', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "fieldservice"."tracking_session_status" AS ENUM('active', 'completed', 'expired');--> statement-breakpoint
ALTER TYPE "fieldservice"."job_status" ADD VALUE 'en_route' BEFORE 'in_progress';--> statement-breakpoint
CREATE TABLE "fieldservice"."qb_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"realm_id" varchar(50) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"access_token_expires_at" timestamp with time zone NOT NULL,
	"refresh_token_expires_at" timestamp with time zone NOT NULL,
	"company_name" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"connected_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."qb_entity_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"local_entity_id" uuid NOT NULL,
	"qb_entity_id" varchar(100) NOT NULL,
	"qb_sync_token" varchar(50),
	"last_sync_status" varchar(20) DEFAULT 'success' NOT NULL,
	"last_sync_error" text,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."qb_sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"local_entity_id" uuid NOT NULL,
	"qb_entity_id" varchar(100),
	"operation" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"request_payload" text,
	"response_payload" text,
	"error_message" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."ai_custom_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"conversation_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"report_config" jsonb NOT NULL,
	"query_definition" jsonb NOT NULL,
	"cached_data" jsonb,
	"last_refreshed_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."ai_dashboard_widgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"conversation_id" uuid,
	"title" text NOT NULL,
	"widget_config" jsonb NOT NULL,
	"query_definition" jsonb NOT NULL,
	"cached_data" jsonb,
	"last_refreshed_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."user_dashboard_layouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"widget_order" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"widget_sizes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_dashboard_layouts_tenant_user_uniq" UNIQUE("tenant_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."call_recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"call_id" uuid NOT NULL,
	"recording_sid" varchar(64) NOT NULL,
	"duration" integer,
	"recording_url" text,
	"status" "fieldservice"."recording_status" DEFAULT 'processing' NOT NULL,
	"transcription_text" text,
	"transcription_status" "fieldservice"."transcription_status" DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"call_sid" varchar(64) NOT NULL,
	"direction" "fieldservice"."call_direction" NOT NULL,
	"from_number" varchar(50) NOT NULL,
	"to_number" varchar(50) NOT NULL,
	"status" "fieldservice"."call_status" DEFAULT 'initiated' NOT NULL,
	"duration" integer,
	"customer_id" uuid,
	"job_id" uuid,
	"user_id" uuid,
	"notes" text,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."tracking_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"technician_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"status" "fieldservice"."tracking_session_status" DEFAULT 'active' NOT NULL,
	"current_latitude" numeric(10, 7),
	"current_longitude" numeric(10, 7),
	"destination_latitude" numeric(10, 7),
	"destination_longitude" numeric(10, 7),
	"eta_minutes" integer,
	"last_location_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fieldservice"."properties" ADD COLUMN "lot_size_sqft" integer;--> statement-breakpoint
ALTER TABLE "fieldservice"."properties" ADD COLUMN "lawn_area_sqft" integer;--> statement-breakpoint
ALTER TABLE "fieldservice"."properties" ADD COLUMN "property_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_checklist_items" ADD COLUMN "group_name" varchar(255);--> statement-breakpoint
ALTER TABLE "fieldservice"."job_checklist_items" ADD COLUMN "group_sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fieldservice"."checklist_template_items" ADD COLUMN "group_name" varchar(255);--> statement-breakpoint
ALTER TABLE "fieldservice"."checklist_template_items" ADD COLUMN "group_sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fieldservice"."checklist_templates" ADD COLUMN "auto_apply_on_dispatch" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "fieldservice"."qb_connections" ADD CONSTRAINT "qb_connections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."qb_connections" ADD CONSTRAINT "qb_connections_connected_by_users_id_fk" FOREIGN KEY ("connected_by") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."qb_entity_mappings" ADD CONSTRAINT "qb_entity_mappings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."qb_sync_log" ADD CONSTRAINT "qb_sync_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."ai_conversations" ADD CONSTRAINT "ai_conversations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "fieldservice"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."ai_messages" ADD CONSTRAINT "ai_messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."ai_custom_reports" ADD CONSTRAINT "ai_custom_reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."ai_custom_reports" ADD CONSTRAINT "ai_custom_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."ai_custom_reports" ADD CONSTRAINT "ai_custom_reports_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "fieldservice"."ai_conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."ai_dashboard_widgets" ADD CONSTRAINT "ai_dashboard_widgets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."ai_dashboard_widgets" ADD CONSTRAINT "ai_dashboard_widgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."ai_dashboard_widgets" ADD CONSTRAINT "ai_dashboard_widgets_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "fieldservice"."ai_conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."user_dashboard_layouts" ADD CONSTRAINT "user_dashboard_layouts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."user_dashboard_layouts" ADD CONSTRAINT "user_dashboard_layouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."call_recordings" ADD CONSTRAINT "call_recordings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."call_recordings" ADD CONSTRAINT "call_recordings_call_id_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "fieldservice"."calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."calls" ADD CONSTRAINT "calls_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."calls" ADD CONSTRAINT "calls_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "fieldservice"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."calls" ADD CONSTRAINT "calls_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."calls" ADD CONSTRAINT "calls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."tracking_sessions" ADD CONSTRAINT "tracking_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."tracking_sessions" ADD CONSTRAINT "tracking_sessions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."tracking_sessions" ADD CONSTRAINT "tracking_sessions_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "qb_connections_tenant_id_idx" ON "fieldservice"."qb_connections" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "qb_entity_mappings_unique_idx" ON "fieldservice"."qb_entity_mappings" USING btree ("tenant_id","entity_type","local_entity_id");--> statement-breakpoint
CREATE INDEX "qb_entity_mappings_tenant_type_idx" ON "fieldservice"."qb_entity_mappings" USING btree ("tenant_id","entity_type");--> statement-breakpoint
CREATE INDEX "qb_sync_log_tenant_idx" ON "fieldservice"."qb_sync_log" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "qb_sync_log_tenant_entity_idx" ON "fieldservice"."qb_sync_log" USING btree ("tenant_id","entity_type","local_entity_id");--> statement-breakpoint
CREATE INDEX "qb_sync_log_tenant_status_idx" ON "fieldservice"."qb_sync_log" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "qb_sync_log_created_idx" ON "fieldservice"."qb_sync_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_conversations_tenant_user_idx" ON "fieldservice"."ai_conversations" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "ai_conversations_tenant_updated_idx" ON "fieldservice"."ai_conversations" USING btree ("tenant_id","updated_at");--> statement-breakpoint
CREATE INDEX "ai_messages_conversation_idx" ON "fieldservice"."ai_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "ai_messages_tenant_idx" ON "fieldservice"."ai_messages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_custom_reports_tenant_user_idx" ON "fieldservice"."ai_custom_reports" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "ai_custom_reports_active_idx" ON "fieldservice"."ai_custom_reports" USING btree ("tenant_id","user_id","is_active");--> statement-breakpoint
CREATE INDEX "ai_dashboard_widgets_tenant_user_idx" ON "fieldservice"."ai_dashboard_widgets" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "ai_dashboard_widgets_active_idx" ON "fieldservice"."ai_dashboard_widgets" USING btree ("tenant_id","user_id","is_active");--> statement-breakpoint
CREATE INDEX "user_dashboard_layouts_tenant_user_idx" ON "fieldservice"."user_dashboard_layouts" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "call_recordings_call_idx" ON "fieldservice"."call_recordings" USING btree ("call_id");--> statement-breakpoint
CREATE UNIQUE INDEX "call_recordings_sid_idx" ON "fieldservice"."call_recordings" USING btree ("recording_sid");--> statement-breakpoint
CREATE INDEX "calls_tenant_idx" ON "fieldservice"."calls" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "calls_tenant_customer_idx" ON "fieldservice"."calls" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "calls_tenant_job_idx" ON "fieldservice"."calls" USING btree ("tenant_id","job_id");--> statement-breakpoint
CREATE INDEX "calls_tenant_created_idx" ON "fieldservice"."calls" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "calls_call_sid_idx" ON "fieldservice"."calls" USING btree ("call_sid");--> statement-breakpoint
CREATE INDEX "calls_tenant_from_idx" ON "fieldservice"."calls" USING btree ("tenant_id","from_number");--> statement-breakpoint
CREATE INDEX "calls_tenant_to_idx" ON "fieldservice"."calls" USING btree ("tenant_id","to_number");--> statement-breakpoint
CREATE UNIQUE INDEX "tracking_sessions_token_idx" ON "fieldservice"."tracking_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "tracking_sessions_tenant_job_idx" ON "fieldservice"."tracking_sessions" USING btree ("tenant_id","job_id");--> statement-breakpoint
CREATE INDEX "tracking_sessions_status_idx" ON "fieldservice"."tracking_sessions" USING btree ("status");