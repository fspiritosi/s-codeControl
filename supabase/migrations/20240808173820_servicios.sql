create type "public"."condition_enum" as enum ('operativo', 'no operativo', 'en reparación');

create sequence "public"."measure_units_id_seq";







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










alter table "public"."vehicles" add column "condition" condition_enum;

alter sequence "public"."measure_units_id_seq" owned by "public"."measure_units"."id";



CREATE UNIQUE INDEX customer_services_pkey ON public.customer_services USING btree (id);



CREATE UNIQUE INDEX measure_units_pkey ON public.measure_units USING btree (id);

CREATE UNIQUE INDEX service_items_pkey ON public.service_items USING btree (id);



alter table "public"."customer_services" add constraint "customer_services_pkey" PRIMARY KEY using index "customer_services_pkey";



alter table "public"."measure_units" add constraint "measure_units_pkey" PRIMARY KEY using index "measure_units_pkey";

alter table "public"."service_items" add constraint "service_items_pkey" PRIMARY KEY using index "service_items_pkey";







alter table "public"."customer_services" add constraint "public_customer_services_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) not valid;

alter table "public"."customer_services" validate constraint "public_customer_services_company_id_fkey";

alter table "public"."customer_services" add constraint "public_customer_services_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."customer_services" validate constraint "public_customer_services_customer_id_fkey";





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


