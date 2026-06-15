CREATE TYPE "public"."fund_status" AS ENUM('Fundraising', 'Investing', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."investor_type" AS ENUM('Individual', 'Institution', 'Family Office');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('completed', 'pending', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('capital_call', 'distribution', 'fee', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'investor');--> statement-breakpoint
CREATE TABLE "fund_nav_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fund_id" uuid NOT NULL,
	"total_value" numeric(20, 2) NOT NULL,
	"pending_value" numeric(20, 2) DEFAULT '0' NOT NULL,
	"transaction_count" integer DEFAULT 0 NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "funds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"vintage_year" integer NOT NULL,
	"target_size_usd" numeric(20, 2) NOT NULL,
	"status" "fund_status" NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investor_id" uuid NOT NULL,
	"fund_id" uuid NOT NULL,
	"amount_usd" numeric(20, 2) NOT NULL,
	"investment_date" date NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "amount_usd_positive" CHECK ("investments"."amount_usd" > 0)
);
--> statement-breakpoint
CREATE TABLE "investors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"investor_type" "investor_type" NOT NULL,
	"email" varchar(255) NOT NULL,
	"country_of_domicile" varchar(2),
	"kyc_status" "kyc_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "investors_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "transaction_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"previous_status" "transaction_status" NOT NULL,
	"new_status" "transaction_status" NOT NULL,
	"reason" text,
	"changed_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"transaction_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fund_id" uuid NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"fee_percentage" numeric(5, 2) NOT NULL,
	"calculated_fees" numeric(20, 2),
	"status" "transaction_status" DEFAULT 'pending',
	"transaction_type" "transaction_type" DEFAULT 'fee' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "amount_positive" CHECK ("transactions"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'investor' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "fund_nav_snapshots" ADD CONSTRAINT "fund_nav_snapshots_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_investor_id_investors_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_audit_log" ADD CONSTRAINT "transaction_audit_log_transaction_id_transactions_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("transaction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE no action ON UPDATE no action;