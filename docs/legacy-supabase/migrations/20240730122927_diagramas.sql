

create table "public"."diagram_type" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text,
    "company_id" uuid not null default gen_random_uuid()
);


alter table "public"."diagram_type" enable row level security;

create table "public"."employees_diagram" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "employee_id" uuid not null default gen_random_uuid(),
    "diagram_type" uuid not null default gen_random_uuid(),
    "from_date" date not null,
    "to_date" date not null
);


alter table "public"."employees_diagram" enable row level security;


CREATE UNIQUE INDEX diagram_type_name_key ON public.diagram_type USING btree (name);

CREATE UNIQUE INDEX diagram_type_pkey ON public.diagram_type USING btree (id);

CREATE UNIQUE INDEX employees_diagram_pkey ON public.employees_diagram USING btree (id);

alter table "public"."diagram_type" add constraint "diagram_type_pkey" PRIMARY KEY using index "diagram_type_pkey";

alter table "public"."employees_diagram" add constraint "employees_diagram_pkey" PRIMARY KEY using index "employees_diagram_pkey";

alter table "public"."diagram_type" add constraint "diagram_type_name_key" UNIQUE using index "diagram_type_name_key";

alter table "public"."diagram_type" add constraint "public_diagram_type_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) not valid;

alter table "public"."diagram_type" validate constraint "public_diagram_type_company_id_fkey";

alter table "public"."employees_diagram" add constraint "public_employees_diagram_diagram_type_fkey" FOREIGN KEY (diagram_type) REFERENCES diagram_type(id) not valid;

alter table "public"."employees_diagram" validate constraint "public_employees_diagram_diagram_type_fkey";

alter table "public"."employees_diagram" add constraint "public_employees_diagram_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) not valid;

alter table "public"."employees_diagram" validate constraint "public_employees_diagram_employee_id_fkey";

grant delete on table "public"."diagram_type" to "anon";

grant insert on table "public"."diagram_type" to "anon";

grant references on table "public"."diagram_type" to "anon";

grant select on table "public"."diagram_type" to "anon";

grant trigger on table "public"."diagram_type" to "anon";

grant truncate on table "public"."diagram_type" to "anon";

grant update on table "public"."diagram_type" to "anon";

grant delete on table "public"."diagram_type" to "authenticated";

grant insert on table "public"."diagram_type" to "authenticated";

grant references on table "public"."diagram_type" to "authenticated";

grant select on table "public"."diagram_type" to "authenticated";

grant trigger on table "public"."diagram_type" to "authenticated";

grant truncate on table "public"."diagram_type" to "authenticated";

grant update on table "public"."diagram_type" to "authenticated";

grant delete on table "public"."diagram_type" to "service_role";

grant insert on table "public"."diagram_type" to "service_role";

grant references on table "public"."diagram_type" to "service_role";

grant select on table "public"."diagram_type" to "service_role";

grant trigger on table "public"."diagram_type" to "service_role";

grant truncate on table "public"."diagram_type" to "service_role";

grant update on table "public"."diagram_type" to "service_role";

grant delete on table "public"."employees_diagram" to "anon";

grant insert on table "public"."employees_diagram" to "anon";

grant references on table "public"."employees_diagram" to "anon";

grant select on table "public"."employees_diagram" to "anon";

grant trigger on table "public"."employees_diagram" to "anon";

grant truncate on table "public"."employees_diagram" to "anon";

grant update on table "public"."employees_diagram" to "anon";

grant delete on table "public"."employees_diagram" to "authenticated";

grant insert on table "public"."employees_diagram" to "authenticated";

grant references on table "public"."employees_diagram" to "authenticated";

grant select on table "public"."employees_diagram" to "authenticated";

grant trigger on table "public"."employees_diagram" to "authenticated";

grant truncate on table "public"."employees_diagram" to "authenticated";

grant update on table "public"."employees_diagram" to "authenticated";

grant delete on table "public"."employees_diagram" to "service_role";

grant insert on table "public"."employees_diagram" to "service_role";

grant references on table "public"."employees_diagram" to "service_role";

grant select on table "public"."employees_diagram" to "service_role";

grant trigger on table "public"."employees_diagram" to "service_role";

grant truncate on table "public"."employees_diagram" to "service_role";

grant update on table "public"."employees_diagram" to "service_role";

create policy "Enable insert for authenticated users only"
on "public"."employees_diagram"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."employees_diagram"
as permissive
for select
to authenticated
using (true);



