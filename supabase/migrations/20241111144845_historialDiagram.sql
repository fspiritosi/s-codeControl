-- drop policy "Enable read access for all users" on "public"."measure_units";

-- alter table "public"."documents_equipment" drop constraint "documents_equipment_document_path_key";

-- drop index if exists "public"."documents_equipment_document_path_key";

alter type "public"."repair_state" rename to "repair_state__old_version_to_be_dropped";

create type "public"."repair_state" as enum ('Pendiente', 'Esperando repuestos', 'En reparación', 'Finalizado', 'Rechazado', 'Cancelado', 'Programado');

create table "public"."diagrams_logs" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "prev_date" timestamp with time zone not null,
    "description" text not null,
    "state" text not null,
    "prev_state" text not null,
    "modified_by" uuid default auth.uid(),
    "employee_id" uuid not null,
    "diagram_id" uuid not null
);


alter table "public"."diagrams_logs" enable row level security;

alter table "public"."repair_solicitudes" alter column state type "public"."repair_state" using state::text::"public"."repair_state";

drop type "public"."repair_state__old_version_to_be_dropped";

alter table "public"."custom_form" disable row level security;

alter table "public"."repair_solicitudes" add column "scheduled" timestamp with time zone;

-- alter table "public"."service_items" add column "customer_id" uuid not null;

-- alter table "public"."share_company_users" add column "modules" modulos[];

CREATE UNIQUE INDEX diagrams_logs_pkey ON public.diagrams_logs USING btree (id);

alter table "public"."diagrams_logs" add constraint "diagrams_logs_pkey" PRIMARY KEY using index "diagrams_logs_pkey";

alter table "public"."diagrams_logs" add constraint "diagrams_logs_diagram_id_fkey" FOREIGN KEY (diagram_id) REFERENCES diagram_type(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."diagrams_logs" validate constraint "diagrams_logs_diagram_id_fkey";

alter table "public"."diagrams_logs" add constraint "diagrams_logs_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."diagrams_logs" validate constraint "diagrams_logs_employee_id_fkey";

alter table "public"."diagrams_logs" add constraint "diagrams_logs_modified_by_fkey" FOREIGN KEY (modified_by) REFERENCES profile(id) ON DELETE SET NULL not valid;

alter table "public"."diagrams_logs" validate constraint "diagrams_logs_modified_by_fkey";

-- alter table "public"."service_items" add constraint "public_service_items_costumer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

-- alter table "public"."service_items" validate constraint "public_service_items_costumer_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_employees_diagram_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
    v_short_description TEXT;
    v_prev_date TIMESTAMPTZ;
    v_diagram_name TEXT;
    v_old_diagram_name TEXT;
BEGIN
    -- Obtener la descripción corta y el nombre del diagrama actual
    SELECT short_description, name INTO v_short_description, v_diagram_name
    FROM diagram_type
    WHERE id = NEW.diagram_type;

    -- Formatear la fecha
    v_prev_date := TO_TIMESTAMP(NEW.day || '-' || NEW.month || '-' || NEW.year || ' 00:00:00', 'DD-MM-YYYY HH24:MI:SS');

    -- Insertar en diagrams_logs
    IF TG_OP = 'INSERT' THEN
        INSERT INTO diagrams_logs (prev_date, description, state, prev_state, employee_id, diagram_id)
        VALUES (v_prev_date, v_short_description, v_diagram_name, 'Nuevo', NEW.employee_id, NEW.diagram_type);
    ELSIF TG_OP = 'UPDATE' THEN
        -- Obtener el nombre del diagrama anterior
        SELECT name INTO v_old_diagram_name
        FROM diagram_type
        WHERE id = OLD.diagram_type;

        -- Obtener la fecha anterior
        v_prev_date := TO_TIMESTAMP(OLD.day || '-' || OLD.month || '-' || OLD.year || ' 00:00:00', 'DD-MM-YYYY HH24:MI:SS');
        
        INSERT INTO diagrams_logs (prev_date, description, state, prev_state, employee_id, diagram_id)
        VALUES (v_prev_date, v_short_description, v_diagram_name, v_old_diagram_name, NEW.employee_id, NEW.diagram_type);
    END IF;

    RETURN NEW;
END;$function$
;

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
      AND description = COALESCE(NULLIF(NEW.mechanic_description, ''), 
                CASE NEW.state
                    WHEN 'Pendiente' THEN 'La solicitud está pendiente.'
                    WHEN 'Esperando repuestos' THEN 'La solicitud está esperando repuestos.'
                    WHEN 'En reparación' THEN 'La solicitud está en reparación.'
                    WHEN 'Finalizado' THEN 'La solicitud ha sido finalizada.'
                    WHEN 'Cancelado' THEN 'La solicitud ha sido cancelada.'
                    WHEN 'Rechazado' THEN 'La solicitud ha sido rechazada.'
                    WHEN 'Programado' THEN 
                        'La solicitud ha sido programada para el ' || TO_CHAR(NEW.scheduled, 'DD') || ' de ' ||
                        CASE TO_CHAR(NEW.scheduled, 'MM')
                            WHEN '01' THEN 'enero'
                            WHEN '02' THEN 'febrero'
                            WHEN '03' THEN 'marzo'
                            WHEN '04' THEN 'abril'
                            WHEN '05' THEN 'mayo'
                            WHEN '06' THEN 'junio'
                            WHEN '07' THEN 'julio'
                            WHEN '08' THEN 'agosto'
                            WHEN '09' THEN 'septiembre'
                            WHEN '10' THEN 'octubre'
                            WHEN '11' THEN 'noviembre'
                            WHEN '12' THEN 'diciembre'
                        END
                    ELSE 'Estado desconocido.'
                END)
      AND title = NEW.state::text
      AND ABS(EXTRACT(EPOCH FROM (NEW.created_at - created_at))) < 3;

    -- Si no se encontró un duplicado, insertar el nuevo registro
    IF v_count = 0 THEN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO repairlogs (modified_by_employee, modified_by_user, kilometer, repair_id, description, title)
            VALUES (NEW.employee_id, (SELECT auth.uid()), NEW.kilometer, NEW.id, 'La solicitud de mantenimiento ha sido registrada y se encuentra en estado de espera.', NEW.state::text);
        ELSIF TG_OP = 'UPDATE' THEN
            INSERT INTO repairlogs (kilometer, modified_by_user, repair_id, description, title)
            VALUES (NEW.kilometer,
                (SELECT auth.uid()),
                NEW.id, 
                COALESCE(NULLIF(NEW.mechanic_description, ''), 
                    CASE NEW.state
                        WHEN 'Pendiente' THEN 'La solicitud está pendiente.'
                        WHEN 'Esperando repuestos' THEN 'La solicitud está esperando repuestos.'
                        WHEN 'En reparación' THEN 'La solicitud está en reparación.'
                        WHEN 'Finalizado' THEN 'La solicitud ha sido finalizada.'
                        WHEN 'Cancelado' THEN 'La solicitud ha sido cancelada.'
                        WHEN 'Rechazado' THEN 'La solicitud ha sido rechazada.'
                        WHEN 'Programado' THEN 
                            'La solicitud ha sido programada para el ' || TO_CHAR(NEW.scheduled, 'DD') || ' de ' ||
                            CASE TO_CHAR(NEW.scheduled, 'MM')
                                WHEN '01' THEN 'enero'
                                WHEN '02' THEN 'febrero'
                                WHEN '03' THEN 'marzo'
                                WHEN '04' THEN 'abril'
                                WHEN '05' THEN 'mayo'
                                WHEN '06' THEN 'junio'
                                WHEN '07' THEN 'julio'
                                WHEN '08' THEN 'agosto'
                                WHEN '09' THEN 'septiembre'
                                WHEN '10' THEN 'octubre'
                                WHEN '11' THEN 'noviembre'
                                WHEN '12' THEN 'diciembre'
                            END
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

grant delete on table "public"."diagrams_logs" to "anon";

grant insert on table "public"."diagrams_logs" to "anon";

grant references on table "public"."diagrams_logs" to "anon";

grant select on table "public"."diagrams_logs" to "anon";

grant trigger on table "public"."diagrams_logs" to "anon";

grant truncate on table "public"."diagrams_logs" to "anon";

grant update on table "public"."diagrams_logs" to "anon";

grant delete on table "public"."diagrams_logs" to "authenticated";

grant insert on table "public"."diagrams_logs" to "authenticated";

grant references on table "public"."diagrams_logs" to "authenticated";

grant select on table "public"."diagrams_logs" to "authenticated";

grant trigger on table "public"."diagrams_logs" to "authenticated";

grant truncate on table "public"."diagrams_logs" to "authenticated";

grant update on table "public"."diagrams_logs" to "authenticated";

grant delete on table "public"."diagrams_logs" to "service_role";

grant insert on table "public"."diagrams_logs" to "service_role";

grant references on table "public"."diagrams_logs" to "service_role";

grant select on table "public"."diagrams_logs" to "service_role";

grant trigger on table "public"."diagrams_logs" to "service_role";

grant truncate on table "public"."diagrams_logs" to "service_role";

grant update on table "public"."diagrams_logs" to "service_role";

create policy "permitir todo"
on "public"."diagrams_logs"
as permissive
for all
to authenticated
using (true);


create policy "permitir todo"
on "public"."measure_units"
as permissive
for all
to authenticated
using (true);


CREATE TRIGGER trg_employees_diagram_changes AFTER INSERT OR UPDATE ON public.employees_diagram FOR EACH ROW EXECUTE FUNCTION handle_employees_diagram_changes();


