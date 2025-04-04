create type "public"."repair_state" as enum ('Pendiente', 'Esperando repuestos', 'En reparación', 'Finalizado', 'Rechazado', 'Cancelado');

create type "public"."type_of_maintenance_ENUM" as enum ('Correctivo', 'Preventivo');

create table "public"."repair_solicitudes" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "reparation_type" uuid,
    "equipment_id" uuid,
    "state" repair_state,
    "user_description" text,
    "mechanic_description" text,
    "end_date" date,
    "user_id" uuid,
    "mechanic_id" uuid
);


alter table "public"."repair_solicitudes" enable row level security;

create table "public"."types_of_repairs" (
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "description" text not null,
    "criticity" text,
    "is_active" boolean not null default true,
    "company_id" uuid,
    "type_of_maintenance" "type_of_maintenance_ENUM",
    "id" uuid not null default gen_random_uuid()
);


alter table "public"."types_of_repairs" enable row level security;

CREATE UNIQUE INDEX repair_solicitudes_pkey ON public.repair_solicitudes USING btree (id);

CREATE UNIQUE INDEX "types_of_repairs_id-2_key" ON public.types_of_repairs USING btree (id);

CREATE UNIQUE INDEX types_of_repairs_pkey ON public.types_of_repairs USING btree (id);

alter table "public"."repair_solicitudes" add constraint "repair_solicitudes_pkey" PRIMARY KEY using index "repair_solicitudes_pkey";

alter table "public"."types_of_repairs" add constraint "types_of_repairs_pkey" PRIMARY KEY using index "types_of_repairs_pkey";

alter table "public"."repair_solicitudes" add constraint "repair_solicitudes_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES vehicles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."repair_solicitudes" validate constraint "repair_solicitudes_equipment_id_fkey";

alter table "public"."repair_solicitudes" add constraint "repair_solicitudes_mechanic_id_fkey" FOREIGN KEY (mechanic_id) REFERENCES profile(id) ON UPDATE RESTRICT ON DELETE RESTRICT not valid;

alter table "public"."repair_solicitudes" validate constraint "repair_solicitudes_mechanic_id_fkey";

alter table "public"."repair_solicitudes" add constraint "repair_solicitudes_reparation_type_fkey" FOREIGN KEY (reparation_type) REFERENCES types_of_repairs(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."repair_solicitudes" validate constraint "repair_solicitudes_reparation_type_fkey";

alter table "public"."repair_solicitudes" add constraint "repair_solicitudes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profile(id) not valid;

alter table "public"."repair_solicitudes" validate constraint "repair_solicitudes_user_id_fkey";

alter table "public"."types_of_repairs" add constraint "types_of_repairs_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."types_of_repairs" validate constraint "types_of_repairs_company_id_fkey";

alter table "public"."types_of_repairs" add constraint "types_of_repairs_id-2_key" UNIQUE using index "types_of_repairs_id-2_key";

grant delete on table "public"."repair_solicitudes" to "anon";

grant insert on table "public"."repair_solicitudes" to "anon";

grant references on table "public"."repair_solicitudes" to "anon";

grant select on table "public"."repair_solicitudes" to "anon";

grant trigger on table "public"."repair_solicitudes" to "anon";

grant truncate on table "public"."repair_solicitudes" to "anon";

grant update on table "public"."repair_solicitudes" to "anon";

grant delete on table "public"."repair_solicitudes" to "authenticated";

grant insert on table "public"."repair_solicitudes" to "authenticated";

grant references on table "public"."repair_solicitudes" to "authenticated";

grant select on table "public"."repair_solicitudes" to "authenticated";

grant trigger on table "public"."repair_solicitudes" to "authenticated";

grant truncate on table "public"."repair_solicitudes" to "authenticated";

grant update on table "public"."repair_solicitudes" to "authenticated";

grant delete on table "public"."repair_solicitudes" to "service_role";

grant insert on table "public"."repair_solicitudes" to "service_role";

grant references on table "public"."repair_solicitudes" to "service_role";

grant select on table "public"."repair_solicitudes" to "service_role";

grant trigger on table "public"."repair_solicitudes" to "service_role";

grant truncate on table "public"."repair_solicitudes" to "service_role";

grant update on table "public"."repair_solicitudes" to "service_role";

grant delete on table "public"."types_of_repairs" to "anon";

grant insert on table "public"."types_of_repairs" to "anon";

grant references on table "public"."types_of_repairs" to "anon";

grant select on table "public"."types_of_repairs" to "anon";

grant trigger on table "public"."types_of_repairs" to "anon";

grant truncate on table "public"."types_of_repairs" to "anon";

grant update on table "public"."types_of_repairs" to "anon";

grant delete on table "public"."types_of_repairs" to "authenticated";

grant insert on table "public"."types_of_repairs" to "authenticated";

grant references on table "public"."types_of_repairs" to "authenticated";

grant select on table "public"."types_of_repairs" to "authenticated";

grant trigger on table "public"."types_of_repairs" to "authenticated";

grant truncate on table "public"."types_of_repairs" to "authenticated";

grant update on table "public"."types_of_repairs" to "authenticated";

grant delete on table "public"."types_of_repairs" to "service_role";

grant insert on table "public"."types_of_repairs" to "service_role";

grant references on table "public"."types_of_repairs" to "service_role";

grant select on table "public"."types_of_repairs" to "service_role";

grant trigger on table "public"."types_of_repairs" to "service_role";

grant truncate on table "public"."types_of_repairs" to "service_role";

grant update on table "public"."types_of_repairs" to "service_role";

create policy "Permitir autenticados"
on "public"."repair_solicitudes"
as permissive
for all
to authenticated
using (true);


create policy "Acceso a los autenticados"
on "public"."types_of_repairs"
as permissive
for all
to authenticated
using (true);



