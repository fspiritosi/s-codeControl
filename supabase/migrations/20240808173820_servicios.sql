create type "public"."condition_enum" as enum ('operativo', 'no operativo', 'en reparación');

create sequence "public"."measure_units_id_seq";

alter table "public"."customers" drop constraint "customers_client_email_key";

alter table "public"."customers" drop constraint "customers_client_phone_key";

drop index if exists "public"."customers_client_email_key";

drop index if exists "public"."customers_client_phone_key";

create table "public"."category" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "covenant_id" uuid,
    "name" text,
    "is_active" boolean default true
);


alter table "public"."category" enable row level security;

create table "public"."category_employee" (
    "created_at" timestamp with time zone not null default now(),
    "category_id" uuid,
    "emplyee_id" uuid,
    "id" uuid not null default gen_random_uuid()
);


alter table "public"."category_employee" enable row level security;

create table "public"."covenant" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text,
    "company_id" uuid,
    "is_active" boolean default true,
    "guild_id" uuid
);


alter table "public"."covenant" enable row level security;

create table "public"."customer_services" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "customer_id" uuid,
    "service_name" text,
    "service_validity" date,
    "company_id" uuid,
    "is_active" boolean default true,
    "service_start" date
);


alter table "public"."customer_services" enable row level security;

create table "public"."guild" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text,
    "company_id" uuid,
    "is_active" boolean not null default true
);


alter table "public"."guild" enable row level security;

create table "public"."measure_units" (
    "id" integer not null default nextval('measure_units_id_seq'::regclass),
    "unit" character varying(50) not null,
    "simbol" character varying(10) not null,
    "tipo" character varying(20) not null
);


create table "public"."service_items" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "customer_service_id" uuid not null,
    "company_id" uuid not null,
    "item_name" text not null,
    "item_description" text not null,
    "item_price" numeric not null,
    "item_measure_units" integer not null,
    "is_active" boolean default true,
    "customer_id" uuid not null
);


alter table "public"."contacts" add column "reason_for_termination" text;

alter table "public"."contacts" add column "termination_date" date;

alter table "public"."customers" add column "reason_for_termination" text;

alter table "public"."customers" add column "termination_date" date;

alter table "public"."employees" add column "category" uuid;

alter table "public"."employees" add column "covenants" uuid;

alter table "public"."employees" add column "guild" uuid;

alter table "public"."share_company_users" add column "customer_id" text;

alter table "public"."vehicles" add column "condition" condition_enum;

alter sequence "public"."measure_units_id_seq" owned by "public"."measure_units"."id";

CREATE UNIQUE INDEX category_employee_created_at_key ON public.category_employee USING btree (created_at);

CREATE UNIQUE INDEX category_employee_pkey ON public.category_employee USING btree (id);

CREATE UNIQUE INDEX category_pkey ON public.category USING btree (id);

CREATE UNIQUE INDEX covenant_pkey ON public.covenant USING btree (id);

CREATE UNIQUE INDEX customer_services_pkey ON public.customer_services USING btree (id);

CREATE UNIQUE INDEX guild_pkey ON public.guild USING btree (id);

CREATE UNIQUE INDEX measure_units_pkey ON public.measure_units USING btree (id);

CREATE UNIQUE INDEX service_items_pkey ON public.service_items USING btree (id);

alter table "public"."category" add constraint "category_pkey" PRIMARY KEY using index "category_pkey";

alter table "public"."category_employee" add constraint "category_employee_pkey" PRIMARY KEY using index "category_employee_pkey";

alter table "public"."covenant" add constraint "covenant_pkey" PRIMARY KEY using index "covenant_pkey";

alter table "public"."customer_services" add constraint "customer_services_pkey" PRIMARY KEY using index "customer_services_pkey";

alter table "public"."guild" add constraint "guild_pkey" PRIMARY KEY using index "guild_pkey";

alter table "public"."measure_units" add constraint "measure_units_pkey" PRIMARY KEY using index "measure_units_pkey";

alter table "public"."service_items" add constraint "service_items_pkey" PRIMARY KEY using index "service_items_pkey";

alter table "public"."category" add constraint "public_category_covenant_id_fkey" FOREIGN KEY (covenant_id) REFERENCES covenant(id) not valid;

alter table "public"."category" validate constraint "public_category_covenant_id_fkey";

alter table "public"."category_employee" add constraint "category_employee_created_at_key" UNIQUE using index "category_employee_created_at_key";

alter table "public"."category_employee" add constraint "public_covenant_category_category_id_fkey" FOREIGN KEY (category_id) REFERENCES category(id) not valid;

alter table "public"."category_employee" validate constraint "public_covenant_category_category_id_fkey";

alter table "public"."category_employee" add constraint "public_covenant_employee_emplyee_id_fkey" FOREIGN KEY (emplyee_id) REFERENCES employees(id) not valid;

alter table "public"."category_employee" validate constraint "public_covenant_employee_emplyee_id_fkey";

alter table "public"."covenant" add constraint "public_covenant_guild_id_fkey" FOREIGN KEY (guild_id) REFERENCES guild(id) not valid;

alter table "public"."covenant" validate constraint "public_covenant_guild_id_fkey";

alter table "public"."customer_services" add constraint "public_customer_services_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) not valid;

alter table "public"."customer_services" validate constraint "public_customer_services_company_id_fkey";

alter table "public"."customer_services" add constraint "public_customer_services_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."customer_services" validate constraint "public_customer_services_customer_id_fkey";

alter table "public"."employees" add constraint "public_employees_category_fkey" FOREIGN KEY (category) REFERENCES category(id) not valid;

alter table "public"."employees" validate constraint "public_employees_category_fkey";

alter table "public"."employees" add constraint "public_employees_covenants_fkey" FOREIGN KEY (covenants) REFERENCES covenant(id) not valid;

alter table "public"."employees" validate constraint "public_employees_covenants_fkey";

alter table "public"."employees" add constraint "public_employees_guild_fkey" FOREIGN KEY (guild) REFERENCES guild(id) not valid;

alter table "public"."employees" validate constraint "public_employees_guild_fkey";

alter table "public"."guild" add constraint "public_guild_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) not valid;

alter table "public"."guild" validate constraint "public_guild_company_id_fkey";

alter table "public"."service_items" add constraint "public_service_items_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) not valid;

alter table "public"."service_items" validate constraint "public_service_items_company_id_fkey";

alter table "public"."service_items" add constraint "public_service_items_costumer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."service_items" validate constraint "public_service_items_costumer_id_fkey";

alter table "public"."service_items" add constraint "public_service_items_costumer_service_id_fkey" FOREIGN KEY (customer_service_id) REFERENCES customer_services(id) not valid;

alter table "public"."service_items" validate constraint "public_service_items_costumer_service_id_fkey";

alter table "public"."service_items" add constraint "public_service_items_item_measure_units_fkey" FOREIGN KEY (item_measure_units) REFERENCES measure_units(id) not valid;

alter table "public"."service_items" validate constraint "public_service_items_item_measure_units_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.deactivate_service_items()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE service_items
    SET is_active = NEW.is_active
    WHERE customer_service_id = NEW.id;
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."category" to "anon";

grant insert on table "public"."category" to "anon";

grant references on table "public"."category" to "anon";

grant select on table "public"."category" to "anon";

grant trigger on table "public"."category" to "anon";

grant truncate on table "public"."category" to "anon";

grant update on table "public"."category" to "anon";

grant delete on table "public"."category" to "authenticated";

grant insert on table "public"."category" to "authenticated";

grant references on table "public"."category" to "authenticated";

grant select on table "public"."category" to "authenticated";

grant trigger on table "public"."category" to "authenticated";

grant truncate on table "public"."category" to "authenticated";

grant update on table "public"."category" to "authenticated";

grant delete on table "public"."category" to "service_role";

grant insert on table "public"."category" to "service_role";

grant references on table "public"."category" to "service_role";

grant select on table "public"."category" to "service_role";

grant trigger on table "public"."category" to "service_role";

grant truncate on table "public"."category" to "service_role";

grant update on table "public"."category" to "service_role";

grant delete on table "public"."category_employee" to "anon";

grant insert on table "public"."category_employee" to "anon";

grant references on table "public"."category_employee" to "anon";

grant select on table "public"."category_employee" to "anon";

grant trigger on table "public"."category_employee" to "anon";

grant truncate on table "public"."category_employee" to "anon";

grant update on table "public"."category_employee" to "anon";

grant delete on table "public"."category_employee" to "authenticated";

grant insert on table "public"."category_employee" to "authenticated";

grant references on table "public"."category_employee" to "authenticated";

grant select on table "public"."category_employee" to "authenticated";

grant trigger on table "public"."category_employee" to "authenticated";

grant truncate on table "public"."category_employee" to "authenticated";

grant update on table "public"."category_employee" to "authenticated";

grant delete on table "public"."category_employee" to "service_role";

grant insert on table "public"."category_employee" to "service_role";

grant references on table "public"."category_employee" to "service_role";

grant select on table "public"."category_employee" to "service_role";

grant trigger on table "public"."category_employee" to "service_role";

grant truncate on table "public"."category_employee" to "service_role";

grant update on table "public"."category_employee" to "service_role";

grant delete on table "public"."covenant" to "anon";

grant insert on table "public"."covenant" to "anon";

grant references on table "public"."covenant" to "anon";

grant select on table "public"."covenant" to "anon";

grant trigger on table "public"."covenant" to "anon";

grant truncate on table "public"."covenant" to "anon";

grant update on table "public"."covenant" to "anon";

grant delete on table "public"."covenant" to "authenticated";

grant insert on table "public"."covenant" to "authenticated";

grant references on table "public"."covenant" to "authenticated";

grant select on table "public"."covenant" to "authenticated";

grant trigger on table "public"."covenant" to "authenticated";

grant truncate on table "public"."covenant" to "authenticated";

grant update on table "public"."covenant" to "authenticated";

grant delete on table "public"."covenant" to "service_role";

grant insert on table "public"."covenant" to "service_role";

grant references on table "public"."covenant" to "service_role";

grant select on table "public"."covenant" to "service_role";

grant trigger on table "public"."covenant" to "service_role";

grant truncate on table "public"."covenant" to "service_role";

grant update on table "public"."covenant" to "service_role";

grant delete on table "public"."customer_services" to "anon";

grant insert on table "public"."customer_services" to "anon";

grant references on table "public"."customer_services" to "anon";

grant select on table "public"."customer_services" to "anon";

grant trigger on table "public"."customer_services" to "anon";

grant truncate on table "public"."customer_services" to "anon";

grant update on table "public"."customer_services" to "anon";

grant delete on table "public"."customer_services" to "authenticated";

grant insert on table "public"."customer_services" to "authenticated";

grant references on table "public"."customer_services" to "authenticated";

grant select on table "public"."customer_services" to "authenticated";

grant trigger on table "public"."customer_services" to "authenticated";

grant truncate on table "public"."customer_services" to "authenticated";

grant update on table "public"."customer_services" to "authenticated";

grant delete on table "public"."customer_services" to "service_role";

grant insert on table "public"."customer_services" to "service_role";

grant references on table "public"."customer_services" to "service_role";

grant select on table "public"."customer_services" to "service_role";

grant trigger on table "public"."customer_services" to "service_role";

grant truncate on table "public"."customer_services" to "service_role";

grant update on table "public"."customer_services" to "service_role";

grant delete on table "public"."guild" to "anon";

grant insert on table "public"."guild" to "anon";

grant references on table "public"."guild" to "anon";

grant select on table "public"."guild" to "anon";

grant trigger on table "public"."guild" to "anon";

grant truncate on table "public"."guild" to "anon";

grant update on table "public"."guild" to "anon";

grant delete on table "public"."guild" to "authenticated";

grant insert on table "public"."guild" to "authenticated";

grant references on table "public"."guild" to "authenticated";

grant select on table "public"."guild" to "authenticated";

grant trigger on table "public"."guild" to "authenticated";

grant truncate on table "public"."guild" to "authenticated";

grant update on table "public"."guild" to "authenticated";

grant delete on table "public"."guild" to "service_role";

grant insert on table "public"."guild" to "service_role";

grant references on table "public"."guild" to "service_role";

grant select on table "public"."guild" to "service_role";

grant trigger on table "public"."guild" to "service_role";

grant truncate on table "public"."guild" to "service_role";

grant update on table "public"."guild" to "service_role";

grant delete on table "public"."measure_units" to "anon";

grant insert on table "public"."measure_units" to "anon";

grant references on table "public"."measure_units" to "anon";

grant select on table "public"."measure_units" to "anon";

grant trigger on table "public"."measure_units" to "anon";

grant truncate on table "public"."measure_units" to "anon";

grant update on table "public"."measure_units" to "anon";

grant delete on table "public"."measure_units" to "authenticated";

grant insert on table "public"."measure_units" to "authenticated";

grant references on table "public"."measure_units" to "authenticated";

grant select on table "public"."measure_units" to "authenticated";

grant trigger on table "public"."measure_units" to "authenticated";

grant truncate on table "public"."measure_units" to "authenticated";

grant update on table "public"."measure_units" to "authenticated";

grant delete on table "public"."measure_units" to "service_role";

grant insert on table "public"."measure_units" to "service_role";

grant references on table "public"."measure_units" to "service_role";

grant select on table "public"."measure_units" to "service_role";

grant trigger on table "public"."measure_units" to "service_role";

grant truncate on table "public"."measure_units" to "service_role";

grant update on table "public"."measure_units" to "service_role";

grant delete on table "public"."service_items" to "anon";

grant insert on table "public"."service_items" to "anon";

grant references on table "public"."service_items" to "anon";

grant select on table "public"."service_items" to "anon";

grant trigger on table "public"."service_items" to "anon";

grant truncate on table "public"."service_items" to "anon";

grant update on table "public"."service_items" to "anon";

grant delete on table "public"."service_items" to "authenticated";

grant insert on table "public"."service_items" to "authenticated";

grant references on table "public"."service_items" to "authenticated";

grant select on table "public"."service_items" to "authenticated";

grant trigger on table "public"."service_items" to "authenticated";

grant truncate on table "public"."service_items" to "authenticated";

grant update on table "public"."service_items" to "authenticated";

grant delete on table "public"."service_items" to "service_role";

grant insert on table "public"."service_items" to "service_role";

grant references on table "public"."service_items" to "service_role";

grant select on table "public"."service_items" to "service_role";

grant trigger on table "public"."service_items" to "service_role";

grant truncate on table "public"."service_items" to "service_role";

grant update on table "public"."service_items" to "service_role";

create policy "Enable insert for authenticated users only"
on "public"."category"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."category"
as permissive
for select
to public
using (true);


create policy "update category"
on "public"."category"
as permissive
for update
to authenticated
using (true);


create policy "Enable insert for authenticated users only"
on "public"."covenant"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."covenant"
as permissive
for select
to public
using (true);


create policy "update covenant"
on "public"."covenant"
as permissive
for update
to authenticated
using (true);


create policy "Enable insert for authenticated users only"
on "public"."customer_services"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."customer_services"
as permissive
for select
to public
using (true);


create policy "update_customer_services"
on "public"."customer_services"
as permissive
for update
to authenticated
using (true);


create policy "Enable insert for authenticated users only"
on "public"."guild"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."guild"
as permissive
for select
to public
using (true);


create policy "update guild"
on "public"."guild"
as permissive
for update
to authenticated
using (true);


create policy "Enable insert for authenticated users only"
on "public"."service_items"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."service_items"
as permissive
for select
to authenticated
using (true);


create policy "update_services_items"
on "public"."service_items"
as permissive
for update
to authenticated
using (true);


CREATE TRIGGER after_service_update AFTER UPDATE OF is_active ON public.customer_services FOR EACH ROW WHEN ((old.is_active IS DISTINCT FROM new.is_active)) EXECUTE FUNCTION deactivate_service_items();

CREATE TRIGGER after_service_update AFTER UPDATE OF is_active ON public.service_items FOR EACH ROW WHEN ((old.is_active IS DISTINCT FROM new.is_active)) EXECUTE FUNCTION deactivate_service_items();


