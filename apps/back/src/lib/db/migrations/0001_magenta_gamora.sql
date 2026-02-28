CREATE TYPE "fieldservice"."job_assignment_role" AS ENUM('lead', 'member');--> statement-breakpoint
CREATE TYPE "fieldservice"."photo_type" AS ENUM('general', 'before', 'after');--> statement-breakpoint
CREATE TYPE "fieldservice"."time_entry_type" AS ENUM('clock_in', 'clock_out', 'break_start', 'break_end');--> statement-breakpoint
ALTER TYPE "fieldservice"."communication_type" ADD VALUE 'sms';--> statement-breakpoint
CREATE TABLE "fieldservice"."job_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "fieldservice"."job_assignment_role" DEFAULT 'member' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."job_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"label" varchar(500) NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."checklist_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"label" varchar(500) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."checklist_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"job_type" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."estimate_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"pricebook_item_id" uuid,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"type" "fieldservice"."line_item_type" DEFAULT 'service' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."estimate_template_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_recommended" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."estimate_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"summary" varchar(500),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "fieldservice"."time_entry_type" NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"job_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fieldservice"."job_photos" ADD COLUMN "photo_type" "fieldservice"."photo_type" DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "fieldservice"."jobs" ADD COLUMN "start_latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "fieldservice"."jobs" ADD COLUMN "start_longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "fieldservice"."jobs" ADD COLUMN "end_latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "fieldservice"."jobs" ADD COLUMN "end_longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "fieldservice"."communication_log" ADD COLUMN "recipient_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "fieldservice"."job_assignments" ADD CONSTRAINT "job_assignments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_assignments" ADD CONSTRAINT "job_assignments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_assignments" ADD CONSTRAINT "job_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_assignments" ADD CONSTRAINT "job_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_checklist_items" ADD CONSTRAINT "job_checklist_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_checklist_items" ADD CONSTRAINT "job_checklist_items_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_checklist_items" ADD CONSTRAINT "job_checklist_items_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."checklist_template_items" ADD CONSTRAINT "checklist_template_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."checklist_template_items" ADD CONSTRAINT "checklist_template_items_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "fieldservice"."checklist_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."checklist_templates" ADD CONSTRAINT "checklist_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimate_template_items" ADD CONSTRAINT "estimate_template_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimate_template_items" ADD CONSTRAINT "estimate_template_items_option_id_estimate_template_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "fieldservice"."estimate_template_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimate_template_items" ADD CONSTRAINT "estimate_template_items_pricebook_item_id_pricebook_items_id_fk" FOREIGN KEY ("pricebook_item_id") REFERENCES "fieldservice"."pricebook_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimate_template_options" ADD CONSTRAINT "estimate_template_options_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimate_template_options" ADD CONSTRAINT "estimate_template_options_template_id_estimate_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "fieldservice"."estimate_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimate_templates" ADD CONSTRAINT "estimate_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."time_entries" ADD CONSTRAINT "time_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."time_entries" ADD CONSTRAINT "time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."time_entries" ADD CONSTRAINT "time_entries_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_assignments_job_idx" ON "fieldservice"."job_assignments" USING btree ("tenant_id","job_id");--> statement-breakpoint
CREATE INDEX "job_assignments_user_idx" ON "fieldservice"."job_assignments" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "job_checklist_items_job_idx" ON "fieldservice"."job_checklist_items" USING btree ("tenant_id","job_id");--> statement-breakpoint
CREATE INDEX "checklist_template_items_template_idx" ON "fieldservice"."checklist_template_items" USING btree ("tenant_id","template_id");--> statement-breakpoint
CREATE INDEX "checklist_templates_tenant_idx" ON "fieldservice"."checklist_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "estimate_template_items_option_idx" ON "fieldservice"."estimate_template_items" USING btree ("tenant_id","option_id");--> statement-breakpoint
CREATE INDEX "estimate_template_options_template_idx" ON "fieldservice"."estimate_template_options" USING btree ("tenant_id","template_id");--> statement-breakpoint
CREATE INDEX "estimate_templates_tenant_idx" ON "fieldservice"."estimate_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "time_entries_user_timestamp_idx" ON "fieldservice"."time_entries" USING btree ("tenant_id","user_id","timestamp");--> statement-breakpoint
CREATE INDEX "time_entries_timestamp_idx" ON "fieldservice"."time_entries" USING btree ("tenant_id","timestamp");