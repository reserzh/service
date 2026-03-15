CREATE TABLE "fieldservice"."daily_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"report_date" date NOT NULL,
	"material_requests" text,
	"equipment_issues" text,
	"office_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_reports_tenant_user_date_uniq" UNIQUE("tenant_id","user_id","report_date")
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."company_equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"serial_number" varchar(100),
	"brand" varchar(100),
	"model" varchar(100),
	"purchase_date" date,
	"purchase_cost" numeric(12, 2),
	"last_service_date" date,
	"next_service_due" date,
	"hours_used" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'available' NOT NULL,
	"assigned_to" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."equipment_maintenance_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"description" text,
	"cost" numeric(12, 2),
	"performed_by" uuid,
	"performed_at" date NOT NULL,
	"hours_at_service" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."job_daily_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"snapshot_date" date NOT NULL,
	"completion_percent" integer,
	"labor_hours" numeric(10, 2),
	"labor_cost" numeric(12, 2),
	"material_cost" numeric(12, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fieldservice"."job_photos" ADD COLUMN "estimate_id" uuid;--> statement-breakpoint
ALTER TABLE "fieldservice"."daily_reports" ADD CONSTRAINT "daily_reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."daily_reports" ADD CONSTRAINT "daily_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."company_equipment" ADD CONSTRAINT "company_equipment_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."company_equipment" ADD CONSTRAINT "company_equipment_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."equipment_maintenance_log" ADD CONSTRAINT "equipment_maintenance_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."equipment_maintenance_log" ADD CONSTRAINT "equipment_maintenance_log_equipment_id_company_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "fieldservice"."company_equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."equipment_maintenance_log" ADD CONSTRAINT "equipment_maintenance_log_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_daily_snapshots" ADD CONSTRAINT "job_daily_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_daily_snapshots" ADD CONSTRAINT "job_daily_snapshots_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_daily_snapshots" ADD CONSTRAINT "job_daily_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_reports_tenant_date_idx" ON "fieldservice"."daily_reports" USING btree ("tenant_id","report_date");--> statement-breakpoint
CREATE INDEX "daily_reports_tenant_user_idx" ON "fieldservice"."daily_reports" USING btree ("tenant_id","user_id","report_date");--> statement-breakpoint
CREATE INDEX "company_equipment_tenant_idx" ON "fieldservice"."company_equipment" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "company_equipment_tenant_status_idx" ON "fieldservice"."company_equipment" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "equipment_maintenance_log_equipment_idx" ON "fieldservice"."equipment_maintenance_log" USING btree ("tenant_id","equipment_id");--> statement-breakpoint
CREATE INDEX "job_daily_snapshots_job_idx" ON "fieldservice"."job_daily_snapshots" USING btree ("tenant_id","job_id");--> statement-breakpoint
CREATE INDEX "job_daily_snapshots_date_idx" ON "fieldservice"."job_daily_snapshots" USING btree ("tenant_id","job_id","snapshot_date");