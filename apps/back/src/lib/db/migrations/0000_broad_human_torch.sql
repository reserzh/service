CREATE SCHEMA IF NOT EXISTS "fieldservice";
--> statement-breakpoint
CREATE TYPE "fieldservice"."agreement_status" AS ENUM('draft', 'active', 'paused', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "fieldservice"."agreement_visit_status" AS ENUM('scheduled', 'completed', 'skipped', 'canceled');--> statement-breakpoint
CREATE TYPE "fieldservice"."billing_frequency" AS ENUM('monthly', 'quarterly', 'semi_annual', 'annual', 'one_time');--> statement-breakpoint
CREATE TYPE "fieldservice"."booking_status" AS ENUM('pending', 'confirmed', 'canceled');--> statement-breakpoint
CREATE TYPE "fieldservice"."communication_status" AS ENUM('pending', 'sent', 'delivered', 'bounced', 'failed');--> statement-breakpoint
CREATE TYPE "fieldservice"."communication_type" AS ENUM('email');--> statement-breakpoint
CREATE TYPE "fieldservice"."customer_type" AS ENUM('residential', 'commercial');--> statement-breakpoint
CREATE TYPE "fieldservice"."domain_status" AS ENUM('pending_verification', 'active', 'failed', 'removed');--> statement-breakpoint
CREATE TYPE "fieldservice"."estimate_status" AS ENUM('draft', 'sent', 'viewed', 'approved', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "fieldservice"."invoice_status" AS ENUM('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'void');--> statement-breakpoint
CREATE TYPE "fieldservice"."job_priority" AS ENUM('low', 'normal', 'high', 'emergency');--> statement-breakpoint
CREATE TYPE "fieldservice"."job_status" AS ENUM('new', 'scheduled', 'dispatched', 'in_progress', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "fieldservice"."line_item_type" AS ENUM('service', 'material', 'labor', 'discount', 'other');--> statement-breakpoint
CREATE TYPE "fieldservice"."page_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "fieldservice"."payment_method" AS ENUM('credit_card', 'debit_card', 'ach', 'cash', 'check', 'other');--> statement-breakpoint
CREATE TYPE "fieldservice"."payment_status" AS ENUM('pending', 'succeeded', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "fieldservice"."section_type" AS ENUM('hero', 'services', 'about', 'testimonials', 'gallery', 'contact_form', 'booking_widget', 'cta_banner', 'faq', 'team', 'map', 'custom_html', 'features', 'pricing');--> statement-breakpoint
CREATE TYPE "fieldservice"."signer_role" AS ENUM('customer', 'technician');--> statement-breakpoint
CREATE TYPE "fieldservice"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled');--> statement-breakpoint
CREATE TYPE "fieldservice"."user_role" AS ENUM('admin', 'office_manager', 'dispatcher', 'csr', 'technician');--> statement-breakpoint
CREATE TABLE "fieldservice"."tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"address_line1" varchar(255),
	"address_line2" varchar(255),
	"city" varchar(100),
	"state" varchar(50),
	"zip" varchar(20),
	"country" varchar(2) DEFAULT 'US' NOT NULL,
	"timezone" varchar(50) DEFAULT 'America/New_York' NOT NULL,
	"logo_url" text,
	"website" varchar(255),
	"license_number" varchar(100),
	"stripe_customer_id" varchar(255),
	"stripe_connect_id" varchar(255),
	"subscription_status" "fieldservice"."subscription_status" DEFAULT 'trialing' NOT NULL,
	"subscription_plan" varchar(50),
	"settings" jsonb DEFAULT '{}'::jsonb,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(50),
	"role" "fieldservice"."user_role" DEFAULT 'technician' NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"color" varchar(7) DEFAULT '#3b82f6' NOT NULL,
	"hourly_rate" numeric(10, 2),
	"can_be_dispatched" boolean DEFAULT false NOT NULL,
	"notification_preferences" jsonb DEFAULT '{}'::jsonb,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50) NOT NULL,
	"alt_phone" varchar(50),
	"company_name" varchar(255),
	"type" "fieldservice"."customer_type" DEFAULT 'residential' NOT NULL,
	"source" varchar(100),
	"tags" text[],
	"notes" text,
	"do_not_contact" boolean DEFAULT false NOT NULL,
	"stripe_customer_id" varchar(255),
	"supabase_user_id" uuid,
	"portal_access_enabled" boolean DEFAULT false NOT NULL,
	"invited_at" timestamp with time zone,
	"last_portal_login_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"brand" varchar(100),
	"model" varchar(100),
	"serial_number" varchar(100),
	"install_date" date,
	"warranty_expiry" date,
	"location_in_property" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" varchar(255),
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(50) NOT NULL,
	"zip" varchar(20) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"access_notes" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."job_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"pricebook_item_id" uuid,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"type" "fieldservice"."line_item_type" DEFAULT 'service' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."job_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_internal" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."job_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"caption" varchar(255),
	"taken_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."job_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"signer_name" varchar(255) NOT NULL,
	"signer_role" "fieldservice"."signer_role" NOT NULL,
	"storage_path" text NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"job_number" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"estimate_id" uuid,
	"agreement_id" uuid,
	"agreement_visit_id" uuid,
	"assigned_to" uuid,
	"status" "fieldservice"."job_status" DEFAULT 'new' NOT NULL,
	"priority" "fieldservice"."job_priority" DEFAULT 'normal' NOT NULL,
	"job_type" varchar(100) NOT NULL,
	"service_type" varchar(100),
	"summary" varchar(500) NOT NULL,
	"description" text,
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"actual_start" timestamp with time zone,
	"actual_end" timestamp with time zone,
	"dispatched_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"tags" text[],
	"internal_notes" text,
	"customer_notes" text,
	"total_amount" numeric(12, 2),
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_rule" jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."estimate_option_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"pricebook_item_id" uuid,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"type" "fieldservice"."line_item_type" DEFAULT 'service' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."estimate_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"estimate_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"is_recommended" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"estimate_number" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"job_id" uuid,
	"created_by" uuid NOT NULL,
	"status" "fieldservice"."estimate_status" DEFAULT 'draft' NOT NULL,
	"summary" varchar(500) NOT NULL,
	"notes" text,
	"internal_notes" text,
	"valid_until" date,
	"approved_at" timestamp with time zone,
	"approved_option_id" uuid,
	"sent_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"total_amount" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."invoice_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"pricebook_item_id" uuid,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"type" "fieldservice"."line_item_type" DEFAULT 'service' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"job_id" uuid,
	"estimate_id" uuid,
	"agreement_id" uuid,
	"created_by" uuid NOT NULL,
	"status" "fieldservice"."invoice_status" DEFAULT 'draft' NOT NULL,
	"due_date" date NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"amount_paid" numeric(12, 2) DEFAULT '0' NOT NULL,
	"balance_due" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"internal_notes" text,
	"sent_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"method" "fieldservice"."payment_method" NOT NULL,
	"status" "fieldservice"."payment_status" DEFAULT 'pending' NOT NULL,
	"stripe_payment_id" varchar(255),
	"reference_number" varchar(100),
	"notes" text,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"changes" jsonb,
	"ip_address" "inet",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"platform" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."tenant_sequences" (
	"tenant_id" uuid NOT NULL,
	"sequence_type" varchar(50) NOT NULL,
	"prefix" varchar(10) NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_sequences_tenant_id_sequence_type_pk" PRIMARY KEY("tenant_id","sequence_type")
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."booking_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"service_id" uuid,
	"status" "fieldservice"."booking_status" DEFAULT 'pending' NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"address_line1" varchar(255),
	"address_line2" varchar(255),
	"city" varchar(100),
	"state" varchar(50),
	"zip" varchar(20),
	"preferred_date" date,
	"preferred_time_slot" varchar(50),
	"message" text,
	"converted_job_id" uuid,
	"converted_customer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."service_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"short_description" varchar(500),
	"icon" varchar(50),
	"image_url" text,
	"price_display" varchar(100),
	"is_bookable" boolean DEFAULT true NOT NULL,
	"estimated_duration" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."site_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"domain" varchar(255) NOT NULL,
	"status" "fieldservice"."domain_status" DEFAULT 'pending_verification' NOT NULL,
	"verification_token" varchar(255),
	"verified_at" timestamp with time zone,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."site_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"storage_path" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" varchar(100),
	"size_bytes" integer,
	"alt_text" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."site_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"status" "fieldservice"."page_status" DEFAULT 'draft' NOT NULL,
	"is_homepage" boolean DEFAULT false NOT NULL,
	"seo" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"show_in_nav" boolean DEFAULT true NOT NULL,
	"nav_label" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."site_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"type" "fieldservice"."section_type" NOT NULL,
	"content" jsonb,
	"settings" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"subdomain_slug" varchar(100) NOT NULL,
	"theme" jsonb,
	"branding" jsonb,
	"seo_defaults" jsonb,
	"social_links" jsonb,
	"analytics" jsonb,
	"custom_css" text,
	"template_id" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."pricebook_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"sku" varchar(100),
	"category" varchar(100),
	"type" "fieldservice"."line_item_type" DEFAULT 'service' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"unit" varchar(50),
	"cost_price" numeric(12, 2),
	"taxable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."communication_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid,
	"recipient_email" varchar(255) NOT NULL,
	"recipient_name" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"channel" "fieldservice"."communication_type" DEFAULT 'email' NOT NULL,
	"status" "fieldservice"."communication_status" DEFAULT 'pending' NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"sent_by" uuid NOT NULL,
	"resend_message_id" varchar(255),
	"error_message" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."communication_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "fieldservice"."communication_type" DEFAULT 'email' NOT NULL,
	"trigger" varchar(100),
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."agreement_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"agreement_id" uuid NOT NULL,
	"pricebook_item_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."agreement_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"agreement_id" uuid NOT NULL,
	"visit_number" integer NOT NULL,
	"status" "fieldservice"."agreement_visit_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_date" date,
	"completed_date" date,
	"job_id" uuid,
	"invoice_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"agreement_number" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"status" "fieldservice"."agreement_status" DEFAULT 'draft' NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"billing_frequency" "fieldservice"."billing_frequency" DEFAULT 'annual' NOT NULL,
	"billing_amount" numeric(12, 2) NOT NULL,
	"total_value" numeric(12, 2) NOT NULL,
	"visits_per_year" integer DEFAULT 1 NOT NULL,
	"auto_renew" boolean DEFAULT false NOT NULL,
	"renewal_reminder_days" integer DEFAULT 30 NOT NULL,
	"notes" text,
	"internal_notes" text,
	"created_by" uuid NOT NULL,
	"activated_at" timestamp with time zone,
	"paused_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fieldservice"."customer_portal_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fieldservice"."users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."customers" ADD CONSTRAINT "customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."equipment" ADD CONSTRAINT "equipment_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."equipment" ADD CONSTRAINT "equipment_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "fieldservice"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."equipment" ADD CONSTRAINT "equipment_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "fieldservice"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."properties" ADD CONSTRAINT "properties_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."properties" ADD CONSTRAINT "properties_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "fieldservice"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_line_items" ADD CONSTRAINT "job_line_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_line_items" ADD CONSTRAINT "job_line_items_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_notes" ADD CONSTRAINT "job_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_notes" ADD CONSTRAINT "job_notes_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_notes" ADD CONSTRAINT "job_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_photos" ADD CONSTRAINT "job_photos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_photos" ADD CONSTRAINT "job_photos_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_photos" ADD CONSTRAINT "job_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_signatures" ADD CONSTRAINT "job_signatures_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."job_signatures" ADD CONSTRAINT "job_signatures_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."jobs" ADD CONSTRAINT "jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."jobs" ADD CONSTRAINT "jobs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "fieldservice"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."jobs" ADD CONSTRAINT "jobs_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "fieldservice"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."jobs" ADD CONSTRAINT "jobs_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimate_option_items" ADD CONSTRAINT "estimate_option_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimate_option_items" ADD CONSTRAINT "estimate_option_items_option_id_estimate_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "fieldservice"."estimate_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimate_options" ADD CONSTRAINT "estimate_options_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimate_options" ADD CONSTRAINT "estimate_options_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "fieldservice"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimates" ADD CONSTRAINT "estimates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimates" ADD CONSTRAINT "estimates_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "fieldservice"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimates" ADD CONSTRAINT "estimates_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "fieldservice"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimates" ADD CONSTRAINT "estimates_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."estimates" ADD CONSTRAINT "estimates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."invoice_line_items" ADD CONSTRAINT "invoice_line_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "fieldservice"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "fieldservice"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."invoices" ADD CONSTRAINT "invoices_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."invoices" ADD CONSTRAINT "invoices_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "fieldservice"."estimates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "fieldservice"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "fieldservice"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."activity_log" ADD CONSTRAINT "activity_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."push_tokens" ADD CONSTRAINT "push_tokens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "fieldservice"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."tenant_sequences" ADD CONSTRAINT "tenant_sequences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."booking_requests" ADD CONSTRAINT "booking_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."booking_requests" ADD CONSTRAINT "booking_requests_service_id_service_catalog_id_fk" FOREIGN KEY ("service_id") REFERENCES "fieldservice"."service_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."booking_requests" ADD CONSTRAINT "booking_requests_converted_job_id_jobs_id_fk" FOREIGN KEY ("converted_job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."booking_requests" ADD CONSTRAINT "booking_requests_converted_customer_id_customers_id_fk" FOREIGN KEY ("converted_customer_id") REFERENCES "fieldservice"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."service_catalog" ADD CONSTRAINT "service_catalog_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."site_domains" ADD CONSTRAINT "site_domains_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."site_media" ADD CONSTRAINT "site_media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."site_pages" ADD CONSTRAINT "site_pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."site_sections" ADD CONSTRAINT "site_sections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."site_sections" ADD CONSTRAINT "site_sections_page_id_site_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "fieldservice"."site_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."site_settings" ADD CONSTRAINT "site_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."pricebook_items" ADD CONSTRAINT "pricebook_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."communication_log" ADD CONSTRAINT "communication_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."communication_log" ADD CONSTRAINT "communication_log_template_id_communication_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "fieldservice"."communication_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."communication_log" ADD CONSTRAINT "communication_log_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."communication_templates" ADD CONSTRAINT "communication_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."agreement_services" ADD CONSTRAINT "agreement_services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."agreement_services" ADD CONSTRAINT "agreement_services_agreement_id_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "fieldservice"."agreements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."agreement_services" ADD CONSTRAINT "agreement_services_pricebook_item_id_pricebook_items_id_fk" FOREIGN KEY ("pricebook_item_id") REFERENCES "fieldservice"."pricebook_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."agreement_visits" ADD CONSTRAINT "agreement_visits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."agreement_visits" ADD CONSTRAINT "agreement_visits_agreement_id_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "fieldservice"."agreements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."agreement_visits" ADD CONSTRAINT "agreement_visits_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "fieldservice"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."agreement_visits" ADD CONSTRAINT "agreement_visits_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "fieldservice"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."agreements" ADD CONSTRAINT "agreements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."agreements" ADD CONSTRAINT "agreements_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "fieldservice"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."agreements" ADD CONSTRAINT "agreements_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "fieldservice"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."agreements" ADD CONSTRAINT "agreements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "fieldservice"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."customer_portal_tokens" ADD CONSTRAINT "customer_portal_tokens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "fieldservice"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fieldservice"."customer_portal_tokens" ADD CONSTRAINT "customer_portal_tokens_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "fieldservice"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_tenant_id_idx" ON "fieldservice"."users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "fieldservice"."users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customers_tenant_id_idx" ON "fieldservice"."customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "customers_tenant_name_idx" ON "fieldservice"."customers" USING btree ("tenant_id","last_name","first_name");--> statement-breakpoint
CREATE INDEX "customers_tenant_email_idx" ON "fieldservice"."customers" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "customers_tenant_phone_idx" ON "fieldservice"."customers" USING btree ("tenant_id","phone");--> statement-breakpoint
CREATE INDEX "equipment_tenant_id_idx" ON "fieldservice"."equipment" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "equipment_property_id_idx" ON "fieldservice"."equipment" USING btree ("tenant_id","property_id");--> statement-breakpoint
CREATE INDEX "properties_tenant_id_idx" ON "fieldservice"."properties" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "properties_customer_id_idx" ON "fieldservice"."properties" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "job_line_items_job_idx" ON "fieldservice"."job_line_items" USING btree ("tenant_id","job_id");--> statement-breakpoint
CREATE INDEX "job_notes_job_idx" ON "fieldservice"."job_notes" USING btree ("tenant_id","job_id");--> statement-breakpoint
CREATE INDEX "job_photos_job_idx" ON "fieldservice"."job_photos" USING btree ("tenant_id","job_id");--> statement-breakpoint
CREATE INDEX "job_signatures_job_idx" ON "fieldservice"."job_signatures" USING btree ("tenant_id","job_id");--> statement-breakpoint
CREATE INDEX "jobs_tenant_status_idx" ON "fieldservice"."jobs" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "jobs_tenant_assigned_idx" ON "fieldservice"."jobs" USING btree ("tenant_id","assigned_to","scheduled_start");--> statement-breakpoint
CREATE INDEX "jobs_tenant_customer_idx" ON "fieldservice"."jobs" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "jobs_tenant_number_idx" ON "fieldservice"."jobs" USING btree ("tenant_id","job_number");--> statement-breakpoint
CREATE INDEX "estimate_option_items_option_idx" ON "fieldservice"."estimate_option_items" USING btree ("tenant_id","option_id");--> statement-breakpoint
CREATE INDEX "estimate_options_estimate_idx" ON "fieldservice"."estimate_options" USING btree ("tenant_id","estimate_id");--> statement-breakpoint
CREATE INDEX "estimates_tenant_status_idx" ON "fieldservice"."estimates" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "estimates_tenant_customer_idx" ON "fieldservice"."estimates" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "estimates_tenant_number_idx" ON "fieldservice"."estimates" USING btree ("tenant_id","estimate_number");--> statement-breakpoint
CREATE INDEX "invoice_line_items_invoice_idx" ON "fieldservice"."invoice_line_items" USING btree ("tenant_id","invoice_id");--> statement-breakpoint
CREATE INDEX "invoices_tenant_status_idx" ON "fieldservice"."invoices" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "invoices_tenant_customer_idx" ON "fieldservice"."invoices" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "invoices_tenant_number_idx" ON "fieldservice"."invoices" USING btree ("tenant_id","invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_tenant_due_date_idx" ON "fieldservice"."invoices" USING btree ("tenant_id","due_date");--> statement-breakpoint
CREATE INDEX "payments_tenant_invoice_idx" ON "fieldservice"."payments" USING btree ("tenant_id","invoice_id");--> statement-breakpoint
CREATE INDEX "payments_tenant_customer_idx" ON "fieldservice"."payments" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "activity_log_entity_idx" ON "fieldservice"."activity_log" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "activity_log_tenant_date_idx" ON "fieldservice"."activity_log" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "fieldservice"."notifications" USING btree ("tenant_id","user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "push_tokens_user_idx" ON "fieldservice"."push_tokens" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "push_tokens_token_idx" ON "fieldservice"."push_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "booking_requests_tenant_status_idx" ON "fieldservice"."booking_requests" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "booking_requests_tenant_created_idx" ON "fieldservice"."booking_requests" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "service_catalog_tenant_slug_idx" ON "fieldservice"."service_catalog" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "service_catalog_tenant_active_idx" ON "fieldservice"."service_catalog" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "site_domains_tenant_id_idx" ON "fieldservice"."site_domains" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "site_domains_domain_idx" ON "fieldservice"."site_domains" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "site_media_tenant_id_idx" ON "fieldservice"."site_media" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "site_pages_tenant_slug_idx" ON "fieldservice"."site_pages" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "site_pages_tenant_status_idx" ON "fieldservice"."site_pages" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "site_sections_tenant_page_idx" ON "fieldservice"."site_sections" USING btree ("tenant_id","page_id");--> statement-breakpoint
CREATE INDEX "pricebook_items_tenant_idx" ON "fieldservice"."pricebook_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "pricebook_items_tenant_category_idx" ON "fieldservice"."pricebook_items" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE INDEX "pricebook_items_tenant_active_idx" ON "fieldservice"."pricebook_items" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "pricebook_items_tenant_sku_idx" ON "fieldservice"."pricebook_items" USING btree ("tenant_id","sku") WHERE "fieldservice"."pricebook_items"."sku" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "comm_log_tenant_entity_idx" ON "fieldservice"."communication_log" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "comm_log_tenant_sent_idx" ON "fieldservice"."communication_log" USING btree ("tenant_id","sent_at");--> statement-breakpoint
CREATE INDEX "comm_templates_tenant_idx" ON "fieldservice"."communication_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "comm_templates_tenant_trigger_idx" ON "fieldservice"."communication_templates" USING btree ("tenant_id","trigger");--> statement-breakpoint
CREATE INDEX "agreement_services_agreement_idx" ON "fieldservice"."agreement_services" USING btree ("tenant_id","agreement_id");--> statement-breakpoint
CREATE INDEX "agreement_visits_agreement_idx" ON "fieldservice"."agreement_visits" USING btree ("tenant_id","agreement_id");--> statement-breakpoint
CREATE INDEX "agreement_visits_job_idx" ON "fieldservice"."agreement_visits" USING btree ("tenant_id","job_id");--> statement-breakpoint
CREATE INDEX "agreements_tenant_status_idx" ON "fieldservice"."agreements" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "agreements_tenant_customer_idx" ON "fieldservice"."agreements" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agreements_tenant_number_idx" ON "fieldservice"."agreements" USING btree ("tenant_id","agreement_number");--> statement-breakpoint
CREATE INDEX "agreements_tenant_end_date_idx" ON "fieldservice"."agreements" USING btree ("tenant_id","end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "portal_tokens_token_idx" ON "fieldservice"."customer_portal_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "portal_tokens_tenant_customer_idx" ON "fieldservice"."customer_portal_tokens" USING btree ("tenant_id","customer_id");