alter type "public"."condition_enum" rename to "condition_enum__old_version_to_be_dropped";

create type "public"."condition_enum" as enum ('operativo', 'no operativo', 'en reparación', 'operativo condicionado');

create table "public"."repairlogs" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "title" text,
    "description" text,
    "repair_id" uuid
);


alter table "public"."repairlogs" enable row level security;

alter table "public"."vehicles" alter column condition type "public"."condition_enum" using condition::text::"public"."condition_enum";

drop type "public"."condition_enum__old_version_to_be_dropped";

alter table "public"."repair_solicitudes" add column "mechanic_images" text[];

alter table "public"."repair_solicitudes" add column "user_images" text[];

alter table "public"."repair_solicitudes" alter column "equipment_id" set not null;

alter table "public"."repair_solicitudes" alter column "reparation_type" set not null;

alter table "public"."repair_solicitudes" alter column "state" set not null;

alter table "public"."repair_solicitudes" alter column "user_id" set not null;

CREATE UNIQUE INDEX reparirlogs_pkey ON public.repairlogs USING btree (id);

alter table "public"."repairlogs" add constraint "reparirlogs_pkey" PRIMARY KEY using index "reparirlogs_pkey";

alter table "public"."repairlogs" add constraint "reparirlogs_repair_id_fkey" FOREIGN KEY (repair_id) REFERENCES repair_solicitudes(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."repairlogs" validate constraint "reparirlogs_repair_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.log_repair_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
    v_count INT;
BEGIN
    -- Verificar si ya existe un registro duplicado
    SELECT COUNT(*)
    INTO v_count
    FROM repairlogs
    WHERE repair_id = NEW.id
      AND description = COALESCE(NEW.mechanic_description, 
                CASE NEW.state
                    WHEN 'Pendiente' THEN 'La solicitud está pendiente.'
                    WHEN 'Esperando repuestos' THEN 'La solicitud está esperando repuestos.'
                    WHEN 'En reparación' THEN 'La solicitud está en reparación.'
                    WHEN 'Finalizado' THEN 'La solicitud ha sido finalizada.'
                    WHEN 'Cancelado' THEN 'La solicitud ha sido cancelada.'
                    WHEN 'Rechazado' THEN 'La solicitud ha sido rechazada.'
                    ELSE 'Estado desconocido.'
                END)
      AND title = NEW.state::text
      AND ABS(EXTRACT(EPOCH FROM (NEW.created_at - created_at))) < 3;

    -- Si no se encontró un duplicado, insertar el nuevo registro
    IF v_count = 0 THEN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO repairlogs (repair_id, description, title)
            VALUES (NEW.id, 'La solicitud de mantenimiento ha sido registrada y se encuentra en estado de espera.', NEW.state::text);
        ELSIF TG_OP = 'UPDATE' THEN
            INSERT INTO repairlogs (repair_id, description, title)
            VALUES (
                NEW.id, 
                COALESCE(NEW.mechanic_description, 
                    CASE NEW.state
                        WHEN 'Pendiente' THEN 'La solicitud está pendiente.'
                        WHEN 'Esperando repuestos' THEN 'La solicitud está esperando repuestos.'
                        WHEN 'En reparación' THEN 'La solicitud está en reparación.'
                        WHEN 'Finalizado' THEN 'La solicitud ha sido finalizada.'
                        WHEN 'Cancelado' THEN 'La solicitud ha sido cancelada.'
                        WHEN 'Rechazado' THEN 'La solicitud ha sido rechazada.'
                        ELSE 'Estado desconocido.'
                    END
                ), 
                NEW.state::text
               
            );
        END IF;
    END IF;

    RETURN NEW;
END;$function$
;

grant delete on table "public"."repairlogs" to "anon";

grant insert on table "public"."repairlogs" to "anon";

grant references on table "public"."repairlogs" to "anon";

grant select on table "public"."repairlogs" to "anon";

grant trigger on table "public"."repairlogs" to "anon";

grant truncate on table "public"."repairlogs" to "anon";

grant update on table "public"."repairlogs" to "anon";

grant delete on table "public"."repairlogs" to "authenticated";

grant insert on table "public"."repairlogs" to "authenticated";

grant references on table "public"."repairlogs" to "authenticated";

grant select on table "public"."repairlogs" to "authenticated";

grant trigger on table "public"."repairlogs" to "authenticated";

grant truncate on table "public"."repairlogs" to "authenticated";

grant update on table "public"."repairlogs" to "authenticated";

grant delete on table "public"."repairlogs" to "service_role";

grant insert on table "public"."repairlogs" to "service_role";

grant references on table "public"."repairlogs" to "service_role";

grant select on table "public"."repairlogs" to "service_role";

grant trigger on table "public"."repairlogs" to "service_role";

grant truncate on table "public"."repairlogs" to "service_role";

grant update on table "public"."repairlogs" to "service_role";

create policy "Permitir todo"
on "public"."repairlogs"
as permissive
for all
to authenticated
using (true);


create policy "Permitir todo"
on "public"."vehicles"
as permissive
for all
to authenticated
using (true);


CREATE TRIGGER trigger_log_repair_changes AFTER INSERT OR UPDATE ON public.repair_solicitudes FOR EACH ROW EXECUTE FUNCTION log_repair_changes();


