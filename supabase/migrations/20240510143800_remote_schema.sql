create extension if not exists "pg_cron" with schema "public" version '1.4-1';

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.actualizar_estado_documentos()
 RETURNS void
 LANGUAGE plpgsql
AS $function$BEGIN
set
  datestyle = 'ISO, DMY';

update documents_employees
set
  state = 'vencido'
where
  validity::date < current_date;

update documents_equipment
set
  state = 'vencido'
where
   validity::date < current_date;
END;
-- DECLARE
--     v_company_id UUID;
--     resource TEXT; -- Variable para almacenar el company_id
-- BEGIN
-- SET datestyle = 'ISO, DMY';

--     -- Verificar si hay documentos vencidos en documents_employees
--     UPDATE documents_employees
--     SET state = 'vencido'
--     WHERE validity < CURRENT_DATE
--     AND state <> 'vencido'; -- Solo si el estado no es ya 'vencido'

--     -- Verificar si hay documentos vencidos en documents_equipment
--     UPDATE documents_equipment
--     SET state = 'vencido'
--     WHERE validity < CURRENT_DATE
--     AND state <> 'vencido'; -- Solo si el estado no es ya 'vencido'

--     resource := 'employee';

--     -- Insertar entrada en la tabla notifications si se cambió el estado
--     IF SQL%ROWCOUNT > 0 THEN
--         IF v_company_id IS NULL THEN
--             -- Si no se encontró en documents_employees, buscar en documents_equipment
--             SELECT company_id INTO v_company_id
--             FROM documents_equipment
--             WHERE documents_equipment.id = NEW.id;
--             resource :='equipment';
--         END IF;

--             INSERT INTO notifications (title, description, category, company_id, document_id,reference)
--             VALUES ('Venció un documento', '', 'vencimiento', v_company_id, NEW.id,resource);
--     END IF;
-- END;$function$
;

CREATE OR REPLACE FUNCTION public.enviar_correos_documentos_a_vencer()
 RETURNS void
 LANGUAGE plpgsql
AS $function$DECLARE
    destinatario TEXT;
    asunto TEXT;
    contenido TEXT;
    documentos_usuario TEXT[];
    documento RECORD;
BEGIN
    -- Obtener todos los destinatarios únicos
    FOR destinatario IN SELECT DISTINCT profile.email FROM profile
    LOOP
        -- Inicializar el contenido del correo electrónico para el destinatario actual
        contenido := '';

        -- Obtener todos los documentos para el destinatario actual
        SELECT 
            array_agg(
                E'<br>Tipo de documento: ' || tipo_documento ||
                'Fecha de vencimiento: ' || fecha_vencimiento ||
                CASE WHEN documento_empleado IS NOT NULL THEN ' Documento del empleado: ' || documento_empleado ELSE '' END ||
                CASE WHEN dominio_vehiculo IS NOT NULL THEN ' Dominio del vehículo: ' || dominio_vehiculo ELSE '' END
            )
        INTO documentos_usuario
        FROM (
            SELECT 
                dt.name AS tipo_documento, 
                TO_DATE(de.validity, 'DD-MM-YYYY') AS fecha_vencimiento,
                e.document_number AS documento_empleado,
                v.domain AS dominio_vehiculo
            FROM 
                documents_employees de
            JOIN 
                profile ON de.user_id = profile.id
            JOIN 
                document_types dt ON de.id_document_types = dt.id
            LEFT JOIN
                employees e ON de.applies = e.id
            LEFT JOIN
                vehicles v ON de.applies = v.id
            WHERE 
                TO_DATE(de.validity, 'DD-MM-YYYY') >= CURRENT_DATE
                AND TO_DATE(de.validity, 'DD-MM-YYYY') < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '45 days'
                AND profile.email = destinatario
            UNION ALL
            SELECT 
                dt.name AS tipo_documento, 
                TO_DATE(de.validity, 'DD-MM-YYYY') AS fecha_vencimiento,
                NULL AS documento_empleado,
                v.domain AS dominio_vehiculo
            FROM 
                documents_equipment de
            JOIN 
                profile ON de.user_id = profile.id
            JOIN 
                document_types dt ON de.id_document_types = dt.id
            LEFT JOIN
                vehicles v ON de.applies = v.id
            WHERE 
                TO_DATE(de.validity, 'DD-MM-YYYY') >= CURRENT_DATE
                AND TO_DATE(de.validity, 'DD-MM-YYYY') < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
                AND profile.email = destinatario
        ) AS documentos;

        -- Construir el contenido del correo electrónico
        contenido := array_to_string(documentos_usuario, '\n');

        -- Construir el asunto del correo electrónico
        asunto := 'Documentos por vencer';

        -- Enviar el correo electrónico al destinatario actual
        PERFORM net.http_post(
            url := 'https://zktcbhhlcksopklpnubj.supabase.co/functions/v1/resend',
            body := jsonb_build_object(
                'from', 'Codecontrol <team@codecontrol.com.ar>',
                'to', jsonb_build_array(destinatario),
                'subject', asunto,
                'html', contenido
            )
        );
    END LOOP;
END;$function$
;

CREATE OR REPLACE FUNCTION public.log_document_employee_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO documents_employees_logs (documents_employees_id, modified_by, updated_at)
        VALUES (NEW.id, NEW.user_id, now());
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO documents_employees_logs (documents_employees_id, modified_by, updated_at)
        VALUES (NEW.id, NEW.user_id, now());
    END IF;
    RETURN NULL;
END;$function$
;

CREATE OR REPLACE FUNCTION public.log_document_equipment_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO documents_equipment_logs (documents_equipment_id, modified_by, updated_at)
        VALUES (NEW.id, NEW.user_id, now());
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO documents_equipment_logs (documents_equipment_id, modified_by, updated_at)
        VALUES (NEW.id, NEW.user_id, now());
    END IF;
    RETURN NULL;
END;$function$
;

CREATE OR REPLACE FUNCTION public.obtener_documentos_por_vencer()
 RETURNS TABLE(tipo_documento text, correo_electronico text, fecha_vencimiento date, documento_empleado text, dominio_vehiculo text)
 LANGUAGE plpgsql
AS $function$BEGIN
    RETURN QUERY (
        SELECT 
            dt.name AS tipo_documento, 
            profile.email AS correo_electronico, 
            TO_DATE(de.validity, 'DD-MM-YYYY') AS fecha_vencimiento,
            e.document_number AS documento_empleado,
            NULL AS dominio_vehiculo
        FROM 
            documents_employees de
        JOIN 
            profile ON de.user_id = profile.id
        JOIN 
            document_types dt ON de.id_document_types = dt.id
        JOIN
            employees e ON de.applies = e.id
        WHERE 
            TO_DATE(de.validity, 'DD-MM-YYYY') >= CURRENT_DATE
            AND TO_DATE(de.validity, 'DD-MM-YYYY') < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '45 days'
        UNION ALL
        SELECT 
            dt.name AS tipo_documento, 
            profile.email AS correo_electronico, 
            TO_DATE(de.validity, 'DD-MM-YYYY') AS fecha_vencimiento,
            NULL AS documento_empleado,
            v.domain AS dominio_vehiculo
        FROM 
            documents_equipment de
        JOIN 
            profile ON de.user_id = profile.id
        JOIN 
            document_types dt ON de.id_document_types = dt.id
        LEFT JOIN
            vehicles v ON de.applies = v.id
        WHERE 
            TO_DATE(de.validity, 'DD-MM-YYYY') >= CURRENT_DATE
            AND TO_DATE(de.validity, 'DD-MM-YYYY') < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    );
END;$function$
;

CREATE OR REPLACE FUNCTION public.update_company_by_defect()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.by_defect = true THEN
        UPDATE company
        SET by_defect = false
        WHERE owner_id = NEW.owner_id AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$function$
;


