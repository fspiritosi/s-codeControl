-- alter table "public"."service_items" drop constraint "public_service_items_costumer_id_fkey";

-- alter table "public"."measure_units" enable row level security;

-- alter table "public"."service_items" drop column "customer_id";

-- alter table "public"."service_items" enable row level security;

-- create policy "Enable read access for all users"
-- on "public"."measure_units"
-- as permissive
-- for select
-- to authenticated
-- using (true);



