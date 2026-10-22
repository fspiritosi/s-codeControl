create type "public"."daily_report_status" as enum ('pendiente', 'ejecutado', 'reprogramado', 'cancelado');

alter table "public"."service_items" drop constraint "public_service_items_costumer_id_fkey";

create table "public"."dailyreport" (
    "id" uuid not null default gen_random_uuid(),
    "creation_date" date default CURRENT_DATE,
    "date" date not null,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "company_id" uuid not null,
    "status" boolean default true,
    "is_active" boolean default true
);


alter table "public"."dailyreport" enable row level security;

create table "public"."dailyreportemployeerelations" (
    "id" uuid not null default gen_random_uuid(),
    "daily_report_row_id" uuid,
    "employee_id" uuid,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
);


alter table "public"."dailyreportemployeerelations" enable row level security;

create table "public"."dailyreportequipmentrelations" (
    "id" uuid not null default gen_random_uuid(),
    "daily_report_row_id" uuid,
    "equipment_id" uuid,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
);


alter table "public"."dailyreportequipmentrelations" enable row level security;

create table "public"."dailyreportrows" (
    "id" uuid not null default gen_random_uuid(),
    "daily_report_id" uuid,
    "customer_id" uuid,
    "service_id" uuid,
    "item_id" uuid,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "description" text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "status" daily_report_status not null default 'pendiente'::daily_report_status,
    "working_day" text,
    "document_path" text
);


alter table "public"."dailyreportrows" enable row level security;

alter table "public"."measure_units" enable row level security;

alter table "public"."service_items" drop column "customer_id";

alter table "public"."service_items" enable row level security;

CREATE UNIQUE INDEX dailyreport_pkey ON public.dailyreport USING btree (id);

CREATE UNIQUE INDEX dailyreportemployeerelations_pkey ON public.dailyreportemployeerelations USING btree (id);

CREATE UNIQUE INDEX dailyreportequipmentrelations_pkey ON public.dailyreportequipmentrelations USING btree (id);

CREATE UNIQUE INDEX dailyreportrows_pkey ON public.dailyreportrows USING btree (id);

alter table "public"."dailyreport" add constraint "dailyreport_pkey" PRIMARY KEY using index "dailyreport_pkey";

alter table "public"."dailyreportemployeerelations" add constraint "dailyreportemployeerelations_pkey" PRIMARY KEY using index "dailyreportemployeerelations_pkey";

alter table "public"."dailyreportequipmentrelations" add constraint "dailyreportequipmentrelations_pkey" PRIMARY KEY using index "dailyreportequipmentrelations_pkey";

alter table "public"."dailyreportrows" add constraint "dailyreportrows_pkey" PRIMARY KEY using index "dailyreportrows_pkey";

alter table "public"."dailyreport" add constraint "public_dailyreport_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) not valid;

alter table "public"."dailyreport" validate constraint "public_dailyreport_company_id_fkey";

alter table "public"."dailyreportemployeerelations" add constraint "dailyreportemployeerelations_daily_report_row_id_fkey" FOREIGN KEY (daily_report_row_id) REFERENCES dailyreportrows(id) ON DELETE CASCADE not valid;

alter table "public"."dailyreportemployeerelations" validate constraint "dailyreportemployeerelations_daily_report_row_id_fkey";

alter table "public"."dailyreportemployeerelations" add constraint "dailyreportemployeerelations_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE not valid;

alter table "public"."dailyreportemployeerelations" validate constraint "dailyreportemployeerelations_employee_id_fkey";

alter table "public"."dailyreportequipmentrelations" add constraint "dailyreportequipmentrelations_daily_report_row_id_fkey" FOREIGN KEY (daily_report_row_id) REFERENCES dailyreportrows(id) ON DELETE CASCADE not valid;

alter table "public"."dailyreportequipmentrelations" validate constraint "dailyreportequipmentrelations_daily_report_row_id_fkey";

alter table "public"."dailyreportequipmentrelations" add constraint "dailyreportequipmentrelations_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES vehicles(id) ON DELETE CASCADE not valid;

alter table "public"."dailyreportequipmentrelations" validate constraint "dailyreportequipmentrelations_equipment_id_fkey";

alter table "public"."dailyreportrows" add constraint "dailyreportrows_daily_report_id_fkey" FOREIGN KEY (daily_report_id) REFERENCES dailyreport(id) ON DELETE CASCADE not valid;

alter table "public"."dailyreportrows" validate constraint "dailyreportrows_daily_report_id_fkey";

alter table "public"."dailyreportrows" add constraint "public_dailyreportrows_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."dailyreportrows" validate constraint "public_dailyreportrows_customer_id_fkey";

alter table "public"."dailyreportrows" add constraint "public_dailyreportrows_item_id_fkey" FOREIGN KEY (item_id) REFERENCES service_items(id) not valid;

alter table "public"."dailyreportrows" validate constraint "public_dailyreportrows_item_id_fkey";

alter table "public"."dailyreportrows" add constraint "public_dailyreportrows_service_id_fkey" FOREIGN KEY (service_id) REFERENCES customer_services(id) not valid;

alter table "public"."dailyreportrows" validate constraint "public_dailyreportrows_service_id_fkey";

grant delete on table "public"."dailyreport" to "anon";

grant insert on table "public"."dailyreport" to "anon";

grant references on table "public"."dailyreport" to "anon";

grant select on table "public"."dailyreport" to "anon";

grant trigger on table "public"."dailyreport" to "anon";

grant truncate on table "public"."dailyreport" to "anon";

grant update on table "public"."dailyreport" to "anon";

grant delete on table "public"."dailyreport" to "authenticated";

grant insert on table "public"."dailyreport" to "authenticated";

grant references on table "public"."dailyreport" to "authenticated";

grant select on table "public"."dailyreport" to "authenticated";

grant trigger on table "public"."dailyreport" to "authenticated";

grant truncate on table "public"."dailyreport" to "authenticated";

grant update on table "public"."dailyreport" to "authenticated";

grant delete on table "public"."dailyreport" to "service_role";

grant insert on table "public"."dailyreport" to "service_role";

grant references on table "public"."dailyreport" to "service_role";

grant select on table "public"."dailyreport" to "service_role";

grant trigger on table "public"."dailyreport" to "service_role";

grant truncate on table "public"."dailyreport" to "service_role";

grant update on table "public"."dailyreport" to "service_role";

grant delete on table "public"."dailyreportemployeerelations" to "anon";

grant insert on table "public"."dailyreportemployeerelations" to "anon";

grant references on table "public"."dailyreportemployeerelations" to "anon";

grant select on table "public"."dailyreportemployeerelations" to "anon";

grant trigger on table "public"."dailyreportemployeerelations" to "anon";

grant truncate on table "public"."dailyreportemployeerelations" to "anon";

grant update on table "public"."dailyreportemployeerelations" to "anon";

grant delete on table "public"."dailyreportemployeerelations" to "authenticated";

grant insert on table "public"."dailyreportemployeerelations" to "authenticated";

grant references on table "public"."dailyreportemployeerelations" to "authenticated";

grant select on table "public"."dailyreportemployeerelations" to "authenticated";

grant trigger on table "public"."dailyreportemployeerelations" to "authenticated";

grant truncate on table "public"."dailyreportemployeerelations" to "authenticated";

grant update on table "public"."dailyreportemployeerelations" to "authenticated";

grant delete on table "public"."dailyreportemployeerelations" to "service_role";

grant insert on table "public"."dailyreportemployeerelations" to "service_role";

grant references on table "public"."dailyreportemployeerelations" to "service_role";

grant select on table "public"."dailyreportemployeerelations" to "service_role";

grant trigger on table "public"."dailyreportemployeerelations" to "service_role";

grant truncate on table "public"."dailyreportemployeerelations" to "service_role";

grant update on table "public"."dailyreportemployeerelations" to "service_role";

grant delete on table "public"."dailyreportequipmentrelations" to "anon";

grant insert on table "public"."dailyreportequipmentrelations" to "anon";

grant references on table "public"."dailyreportequipmentrelations" to "anon";

grant select on table "public"."dailyreportequipmentrelations" to "anon";

grant trigger on table "public"."dailyreportequipmentrelations" to "anon";

grant truncate on table "public"."dailyreportequipmentrelations" to "anon";

grant update on table "public"."dailyreportequipmentrelations" to "anon";

grant delete on table "public"."dailyreportequipmentrelations" to "authenticated";

grant insert on table "public"."dailyreportequipmentrelations" to "authenticated";

grant references on table "public"."dailyreportequipmentrelations" to "authenticated";

grant select on table "public"."dailyreportequipmentrelations" to "authenticated";

grant trigger on table "public"."dailyreportequipmentrelations" to "authenticated";

grant truncate on table "public"."dailyreportequipmentrelations" to "authenticated";

grant update on table "public"."dailyreportequipmentrelations" to "authenticated";

grant delete on table "public"."dailyreportequipmentrelations" to "service_role";

grant insert on table "public"."dailyreportequipmentrelations" to "service_role";

grant references on table "public"."dailyreportequipmentrelations" to "service_role";

grant select on table "public"."dailyreportequipmentrelations" to "service_role";

grant trigger on table "public"."dailyreportequipmentrelations" to "service_role";

grant truncate on table "public"."dailyreportequipmentrelations" to "service_role";

grant update on table "public"."dailyreportequipmentrelations" to "service_role";

grant delete on table "public"."dailyreportrows" to "anon";

grant insert on table "public"."dailyreportrows" to "anon";

grant references on table "public"."dailyreportrows" to "anon";

grant select on table "public"."dailyreportrows" to "anon";

grant trigger on table "public"."dailyreportrows" to "anon";

grant truncate on table "public"."dailyreportrows" to "anon";

grant update on table "public"."dailyreportrows" to "anon";

grant delete on table "public"."dailyreportrows" to "authenticated";

grant insert on table "public"."dailyreportrows" to "authenticated";

grant references on table "public"."dailyreportrows" to "authenticated";

grant select on table "public"."dailyreportrows" to "authenticated";

grant trigger on table "public"."dailyreportrows" to "authenticated";

grant truncate on table "public"."dailyreportrows" to "authenticated";

grant update on table "public"."dailyreportrows" to "authenticated";

grant delete on table "public"."dailyreportrows" to "service_role";

grant insert on table "public"."dailyreportrows" to "service_role";

grant references on table "public"."dailyreportrows" to "service_role";

grant select on table "public"."dailyreportrows" to "service_role";

grant trigger on table "public"."dailyreportrows" to "service_role";

grant truncate on table "public"."dailyreportrows" to "service_role";

grant update on table "public"."dailyreportrows" to "service_role";

create policy "insertar_y_editar_autenticados"
on "public"."dailyreport"
as permissive
for all
to authenticated
using (true);


create policy "insertar_y_editar_relation_employee"
on "public"."dailyreportemployeerelations"
as permissive
for all
to authenticated
using (true);


create policy "insertar_y_editar_relation_equipment"
on "public"."dailyreportequipmentrelations"
as permissive
for all
to authenticated
using (true);


create policy "insertar_y_editar_fila"
on "public"."dailyreportrows"
as permissive
for all
to authenticated
using (true);


create policy "Enable read access for all users"
on "public"."measure_units"
as permissive
for select
to authenticated
using (true);



