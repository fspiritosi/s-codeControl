-- alter table "public"."customers" drop constraint "customers_client_email_key";

-- alter table "public"."customers" drop constraint "customers_client_phone_key";

-- drop index if exists "public"."customers_client_email_key";

-- drop index if exists "public"."customers_client_phone_key";

-- alter table "public"."contacts" add column "reason_for_termination" text;

-- alter table "public"."contacts" add column "termination_date" date;

-- alter table "public"."customers" add column "reason_for_termination" text;

-- alter table "public"."customers" add column "termination_date" date;

-- alter table "public"."share_company_users" add column "customer_id" text;


