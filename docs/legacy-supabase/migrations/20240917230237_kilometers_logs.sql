alter table "public"."repair_solicitudes" drop column "kilometraje";

alter table "public"."repair_solicitudes" add column "kilometer" text;

alter table "public"."repairlogs" add column "kilometer" text;

alter table "public"."repairlogs" add column "modified_by_employee" uuid;

alter table "public"."repairlogs" add column "modified_by_user" uuid;

alter table "public"."repairlogs" add constraint "repairlogs_modified_by_employee_fkey" FOREIGN KEY (modified_by_employee) REFERENCES employees(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."repairlogs" validate constraint "repairlogs_modified_by_employee_fkey";

alter table "public"."repairlogs" add constraint "repairlogs_modified_by_user_fkey" FOREIGN KEY (modified_by_user) REFERENCES profile(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."repairlogs" validate constraint "repairlogs_modified_by_user_fkey";

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
            INSERT INTO repairlogs (modified_by_employee,modified_by_user,kilometer,repair_id, description, title)
            VALUES (NEW.employee_id,(select auth.uid()),NEW.kilometer,NEW.id, 'La solicitud de mantenimiento ha sido registrada y se encuentra en estado de espera.', NEW.state::text);
        ELSIF TG_OP = 'UPDATE' THEN
            INSERT INTO repairlogs (kilometer,modified_by_user,repair_id, description, title)
            VALUES (NEW.kilometer,
                (select auth.uid()),
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


