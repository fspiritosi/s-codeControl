drop trigger if exists "add_contractor_equipment" on "public"."vehicles";

drop policy "Enable read access for all users" on "public"."measure_units";

drop policy "Enable read access for all users" on "public"."vehicles";

drop policy "update_vehicles" on "public"."vehicles";

drop policy "permitir todo" on "public"."form_answers";

drop policy "Permitir todo" on "public"."vehicles";

alter table "public"."diagram_type" drop constraint "diagram_type_name_key";

alter table "public"."documents_equipment" drop constraint "documents_equipment_document_path_key";

drop index if exists "public"."diagram_type_name_key";

drop index if exists "public"."documents_equipment_document_path_key";

alter type "public"."modulos" rename to "modulos__old_version_to_be_dropped";

create type "public"."modulos" as enum ('empresa', 'empleados', 'equipos', 'documentación', 'mantenimiento', 'dashboard', 'ayuda', 'operaciones', 'formularios');

alter type "public"."reason_for_termination_enum" rename to "reason_for_termination_enum__old_version_to_be_dropped";

create type "public"."reason_for_termination_enum" as enum ('Despido sin causa', 'Renuncia', 'Despido con causa', 'Acuerdo de partes', 'Fin de contrato', 'Fallecimiento');

create table "public"."storage_migrations" (
    "id" uuid not null default gen_random_uuid(),
    "document_id" uuid not null,
    "old_path" text not null,
    "new_path" text not null,
    "status" text default 'pending'::text,
    "created_at" timestamp with time zone default now(),
    "executed_at" timestamp with time zone,
    "error_message" text
);


alter table "public"."employees" alter column reason_for_termination type "public"."reason_for_termination_enum" using reason_for_termination::text::"public"."reason_for_termination_enum";

-- drop type "public"."modulos__old_version_to_be_dropped";

drop type "public"."reason_for_termination_enum__old_version_to_be_dropped";

alter table "public"."documents_employees" alter column "validity" set data type timestamp with time zone using "validity"::timestamp with time zone;

alter table "public"."documents_equipment" alter column "validity" set data type timestamp with time zone using "validity"::timestamp with time zone;

alter table "public"."share_company_users" add column "modules" modulos[];

CREATE UNIQUE INDEX storage_migrations_pkey ON public.storage_migrations USING btree (id);

alter table "public"."storage_migrations" add constraint "storage_migrations_pkey" PRIMARY KEY using index "storage_migrations_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.find_employee_by_full_name_v2(p_full_name text, p_company_id uuid)
 RETURNS SETOF employees
 LANGUAGE plpgsql
AS $function$
begin
  return query
  select e.*
  from employees e
  where e.company_id = p_company_id
  and (
    lower(concat(e.firstname, ' ', e.lastname)) like lower('%' || p_full_name || '%')
    or lower(concat(e.lastname, ' ', e.firstname)) like lower('%' || p_full_name || '%')
  )
  limit 1;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.migrate_document(target_id uuid, execute_migration boolean DEFAULT false)
 RETURNS TABLE(old_path text, new_path text, success boolean, error_message text, action_taken text, storage_migration_id uuid)
 LANGUAGE plpgsql
AS $function$
DECLARE
    doc_record RECORD;
    formatted_company_name TEXT;
    formatted_applies_name TEXT;
    formatted_document_type TEXT;
    formatted_applies_path TEXT;
    file_extension TEXT;
    version_info TEXT;
    new_storage_path TEXT;
    existing_doc RECORD;
    should_replace BOOLEAN;
    migration_id UUID;
    equipment_identifier TEXT;
BEGIN
    -- Create a temporary table to store the migration results
    CREATE TEMP TABLE IF NOT EXISTS migration_results (
        old_path TEXT,
        new_path TEXT,
        success BOOLEAN,
        error_message TEXT,
        action_taken TEXT,
        storage_migration_id UUID
    );
    
    -- Get the document and related information
    SELECT 
        d.*,
        dt.name as document_type_name,
        dt.applies as applies_type,
        c.company_name,
        c.company_cuit as company_cuit,
        v.domain as equipment_domain,
        v.serie as equipment_serie
    INTO doc_record
    FROM documents_equipment d
    JOIN document_types dt ON d.id_document_types = dt.id
    JOIN vehicles v ON d.applies::uuid = v.id
    JOIN company c ON v.company_id = c.id
    WHERE d.id = target_id;

    IF doc_record IS NULL THEN
        INSERT INTO migration_results 
        VALUES (NULL, NULL, FALSE, 'Document not found', 'SKIPPED', NULL);
        RETURN QUERY SELECT * FROM migration_results;
        DROP TABLE migration_results;
        RETURN;
    END IF;

    BEGIN
              -- Format company name (remove special chars and spaces)
        formatted_company_name := translate(LOWER(doc_record.company_name), ' áéíóúñ', '-aeioun');
        formatted_company_name := regexp_replace(formatted_company_name, '[^a-z0-9\-]', '', 'g');
        formatted_company_name := formatted_company_name || '-(' || doc_record.company_cuit || ')';
        
        -- Use domain if available, otherwise use serie, with parentheses
        equipment_identifier := COALESCE(doc_record.equipment_domain, doc_record.equipment_serie, 'sin-identificador');
        equipment_identifier := UPPER(equipment_identifier);
        equipment_identifier := equipment_identifier || '-(' || equipment_identifier || ')';
        
        -- Format document type name (replace accents, slashes and spaces with hyphens)
        formatted_document_type := translate(LOWER(doc_record.document_type_name), 'áéíóúñ', 'aeioun');
        -- Replace both spaces and slashes with hyphens
        formatted_document_type := regexp_replace(formatted_document_type, '[\s/]+', '-', 'g');
        
        -- Get file extension
        file_extension := substring(doc_record.document_path from '\.([^.]+)$');
        
        -- Determine version info based on document properties
        IF doc_record.validity IS NOT NULL THEN
            version_info := to_char(doc_record.validity::timestamp, 'DD-MM-YYYY');
        ELSIF doc_record.period IS NOT NULL THEN
            version_info := doc_record.period;
        ELSE
            version_info := 'v0';
        END IF;
        
        -- Construct new path (without adding -sp)
        new_storage_path := format('%s/equipos/%s/%s-(%s).%s',
            formatted_company_name,
            equipment_identifier,
            formatted_document_type,
            version_info,
            file_extension
        );

        -- Check for existing documents with similar path (ignoring extension)
        SELECT *
        INTO existing_doc
        FROM documents_equipment
        WHERE document_path SIMILAR TO regexp_replace(new_storage_path, '\.[^.]+$', '') || '.%'
        AND id != doc_record.id;

        should_replace := FALSE;
        
        IF existing_doc IS NOT NULL THEN
            -- Compare versions/dates to decide which to keep
            IF doc_record.validity IS NOT NULL AND existing_doc.validity IS NOT NULL THEN
                -- Keep the one with the later validity date
                should_replace := (doc_record.validity::timestamp > existing_doc.validity::timestamp);
            ELSIF doc_record.period IS NOT NULL AND existing_doc.period IS NOT NULL THEN
                -- Keep the one with the later period
                should_replace := (doc_record.period > existing_doc.period);
            ELSE
                -- If no clear versioning, keep the newer document (based on created_at)
                should_replace := (doc_record.created_at > existing_doc.created_at);
            END IF;
        END IF;

        IF execute_migration THEN
            IF existing_doc IS NULL OR should_replace THEN
                -- Registrar la migración de almacenamiento necesaria
                INSERT INTO storage_migrations (document_id, old_path, new_path)
                VALUES (doc_record.id, doc_record.document_path, new_storage_path)
                RETURNING id INTO migration_id;

                -- Update the document path in database
                UPDATE documents_equipment
                SET document_path = new_storage_path
                WHERE id = doc_record.id;

                IF existing_doc IS NOT NULL AND should_replace THEN
                    -- Mark the old document as inactive
                    UPDATE documents_equipment
                    SET is_active = FALSE
                    WHERE id = existing_doc.id;

                    -- Register the old document for deletion
                    INSERT INTO storage_migrations (document_id, old_path, new_path)
                    VALUES (existing_doc.id, existing_doc.document_path, 'TO_DELETE');
                END IF;

                INSERT INTO migration_results 
                VALUES (
                    doc_record.document_path, 
                    new_storage_path, 
                    TRUE, 
                    'Migration registered. Physical file needs to be moved.',
                    CASE 
                        WHEN existing_doc IS NOT NULL THEN 'REPLACED_EXISTING'
                        ELSE 'MIGRATED'
                    END,
                    migration_id
                );
            ELSE
                -- Keep existing document, mark current as inactive
                UPDATE documents_equipment
                SET is_active = FALSE
                WHERE id = doc_record.id;

                -- Register the current document for deletion
                INSERT INTO storage_migrations (document_id, old_path, new_path)
                VALUES (doc_record.id, doc_record.document_path, 'TO_DELETE')
                RETURNING id INTO migration_id;

                INSERT INTO migration_results 
                VALUES (
                    doc_record.document_path, 
                    existing_doc.document_path, 
                    TRUE, 
                    'Kept existing document',
                    'KEPT_EXISTING',
                    migration_id
                );
            END IF;
        ELSE
            -- Preview mode
            INSERT INTO migration_results 
            VALUES (
                doc_record.document_path, 
                new_storage_path, 
                TRUE, 
                CASE 
                    WHEN existing_doc IS NOT NULL THEN 
                        CASE 
                            WHEN should_replace THEN 'Will replace existing document'
                            ELSE 'Will keep existing document'
                        END
                    ELSE 'Will migrate'
                END,
                CASE 
                    WHEN existing_doc IS NOT NULL THEN
                        CASE 
                            WHEN should_replace THEN 'WILL_REPLACE'
                            ELSE 'WILL_KEEP_EXISTING'
                        END
                    ELSE 'WILL_MIGRATE'
                END,
                NULL
            );
        END IF;

    EXCEPTION WHEN OTHERS THEN
        -- Record error
        INSERT INTO migration_results 
        VALUES (doc_record.document_path, NULL, FALSE, SQLERRM, 'ERROR', NULL);
    END;
    
    -- Return results
    RETURN QUERY SELECT * FROM migration_results;
    
    -- Clean up
    DROP TABLE IF EXISTS migration_results;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.migrate_documents_preview()
 RETURNS TABLE(old_path text, new_path text, success boolean, error_message text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    doc_record RECORD;
    formatted_company_name TEXT;
    formatted_applies_name TEXT;
    formatted_document_type TEXT;
    formatted_applies_path TEXT;
    file_extension TEXT;
    version_info TEXT;
    new_storage_path TEXT;
BEGIN
    -- Create a temporary table to store the migration results
    CREATE TEMP TABLE IF NOT EXISTS migration_results (
        old_path TEXT,
        new_path TEXT,
        success BOOLEAN,
        error_message TEXT
    );
    
    -- Loop through all documents with old path format
    FOR doc_record IN 
        SELECT 
            d.*,
            dt.name as document_type_name,
            dt.applies as applies_type,
            c.company_name,
            c.company_cuit as company_cuit,
            CONCAT(e.firstname, ' ', e.lastname) as applies_name,
            e.cuil as applies_document
        FROM documents_employees d
        JOIN document_types dt ON d.id_document_types = dt.id
        JOIN employees e ON d.applies::uuid = e.id
        JOIN companies_employees ce ON e.id = ce.employee_id
        JOIN company c ON ce.company_id = c.id
        WHERE d.document_path LIKE 'documentos-empleados/document-%'
    LOOP
        BEGIN
            -- Format company name (remove special chars and spaces)
            formatted_company_name := translate(LOWER(doc_record.company_name), ' áéíóúñ', '-aeioun');
            formatted_company_name := regexp_replace(formatted_company_name, '[^a-z0-9\-]', '', 'g');
            formatted_company_name := formatted_company_name || '-(' || doc_record.company_cuit || ')';
            
            -- Format applies path based on document type
            formatted_applies_path := translate(LOWER(doc_record.applies_type::text), ' áéíóúñ', '-aeioun');
            formatted_applies_path := regexp_replace(formatted_applies_path, '[^a-z0-9\-]', '', 'g');
            
            -- Format applies name and document
            formatted_applies_name := translate(LOWER(doc_record.applies_name), ' áéíóúñ', '-aeioun');
            formatted_applies_name := regexp_replace(formatted_applies_name, '[^a-z0-9\-]', '', 'g');
            formatted_applies_name := formatted_applies_name || '-(' || doc_record.applies_document || ')';
            
            -- Format document type name
            formatted_document_type := translate(LOWER(doc_record.document_type_name), ' áéíóúñ', '-aeioun');
            formatted_document_type := regexp_replace(formatted_document_type, '[^a-z0-9\-]', '', 'g');
            
            -- Get file extension
            file_extension := substring(doc_record.document_path from '\.([^.]+)$');
            
            -- Determine version info based on document properties
            IF doc_record.validity IS NOT NULL THEN
                version_info := doc_record.validity;
            ELSIF doc_record.period IS NOT NULL THEN
                version_info := doc_record.period;
            ELSE
                version_info := 'v1';
            END IF;
            
            -- Construct new path
            new_storage_path := format('%s/%s/%s/%s-(%s).%s',
                formatted_company_name,
                formatted_applies_path,
                formatted_applies_name,
                formatted_document_type,
                version_info,
                file_extension
            );

            -- Store the preview
            INSERT INTO migration_results (old_path, new_path, success, error_message)
            VALUES (
                doc_record.document_path, 
                new_storage_path, 
                TRUE, 
                'PREVIEW MODE'
            );
                
        EXCEPTION WHEN OTHERS THEN
            -- Record error
            INSERT INTO migration_results (old_path, new_path, success, error_message)
            VALUES (doc_record.document_path, NULL, FALSE, SQLERRM);
        END;
    END LOOP;
    
    -- Return results
    RETURN QUERY SELECT * FROM migration_results;
    
    -- Clean up
    DROP TABLE IF EXISTS migration_results;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.actualizar_estado_documentos()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Actualizar documentos de empleados
    UPDATE documents_employees
    SET state = 'vencido'
    WHERE validity::timestamptz < CURRENT_TIMESTAMP;

    -- Actualizar documentos de equipos
    UPDATE documents_equipment
    SET state = 'vencido'
    WHERE validity::timestamptz < CURRENT_TIMESTAMP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_new_document()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
  company_owner_id UUID;
  vehicle_id UUID;
  employee_id UUID;
BEGIN
  IF NEW.mandatory THEN
    IF NEW.applies = 'Equipos' THEN
      IF NEW.company_id IS NULL THEN
        FOR company_owner_id IN SELECT owner_id FROM company LOOP
          FOR vehicle_id IN SELECT id FROM vehicles WHERE company_id = company_owner_id LOOP
            INSERT INTO documents_equipment (id_document_types, applies, validity, state, is_active, user_id, deny_reason, document_path)
            VALUES (NEW.id, vehicle_id, NULL, 'pendiente', TRUE, company_owner_id, NULL, NULL);
          END LOOP;
        END LOOP;
        -- Actualizar el estado de todos los vehículos
        UPDATE vehicles SET status = 'Incompleto' WHERE company_id IN (SELECT owner_id FROM company);
      ELSE
        SELECT owner_id INTO company_owner_id FROM company WHERE id = NEW.company_id;
        FOR vehicle_id IN SELECT id FROM vehicles WHERE company_id = NEW.company_id LOOP
          INSERT INTO documents_equipment (id_document_types, applies, validity, state, is_active, user_id, deny_reason, document_path)
          VALUES (NEW.id, vehicle_id, NULL, 'pendiente', TRUE, company_owner_id, NULL, NULL);
        END LOOP;
        -- Actualizar el estado de todos los vehículos
        UPDATE vehicles SET status = 'Incompleto' WHERE company_id = NEW.company_id;
      END IF;
    ELSIF NEW.applies = 'Persona' THEN
      IF NEW.company_id IS NULL THEN
        FOR company_owner_id IN SELECT owner_id FROM company LOOP
          FOR employee_id IN SELECT id FROM employees WHERE company_id = company_owner_id LOOP
            INSERT INTO documents_employees (id_document_types, applies, validity, state, is_active, user_id, deny_reason, document_path)
            VALUES (NEW.id, employee_id, NULL, 'pendiente', TRUE, company_owner_id, NULL, NULL);
          END LOOP;
        END LOOP;
        -- Actualizar el estado de todos los empleados
        UPDATE employees SET status = 'Incompleto' WHERE company_id IN (SELECT owner_id FROM company);
      ELSE
        SELECT owner_id INTO company_owner_id FROM company WHERE id = NEW.company_id;
        FOR employee_id IN SELECT id FROM employees WHERE company_id = NEW.company_id LOOP
          INSERT INTO documents_employees (id_document_types, applies, validity, state, is_active, user_id, deny_reason, document_path)
          VALUES (NEW.id, employee_id, NULL, 'pendiente', TRUE, company_owner_id, NULL, NULL);
        END LOOP;
        -- Actualizar el estado de todos los empleados
        UPDATE employees SET status = 'Incompleto' WHERE company_id = NEW.company_id;
      END IF;
    ELSIF NEW.applies = 'Empresa' THEN
      SELECT owner_id INTO company_owner_id FROM company WHERE id = NEW.company_id;
      INSERT INTO documents_company (id_document_types, applies, validity, state, is_active, user_id, deny_reason, document_path)
      VALUES (NEW.id, NEW.company_id, NULL, 'pendiente', TRUE, NULL, NULL, NULL);
    END IF;
  END IF;
  RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.add_to_companies_employees()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
  contractor_id UUID;
BEGIN
  -- Insertar en companies_employees
  INSERT INTO companies_employees (company_id, employee_id)
  VALUES (NEW.company_id, NEW.id);

  -- Verificar si NEW.allocated_to no está vacío
  IF NEW.allocated_to IS NOT NULL AND array_length(NEW.allocated_to, 1) > 0 THEN
    -- Insertar en contractor_employee para cada ID en allocated_to
    FOREACH contractor_id IN ARRAY NEW.allocated_to
    LOOP
      INSERT INTO contractor_employee (contractor_id, employee_id)
      VALUES (contractor_id, NEW.id);
    END LOOP;
  END IF;

  RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.create_user_for_external_login()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  IF NEW.raw_user_meta_data <> '{}'::jsonb THEN
    INSERT INTO public.profile (id, fullname, email, credential_id, avatar,role)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'email',
      NEW.id,
      NEW.raw_user_meta_data->>'avatar_url',
      'CodeControlClient'
    );
  END IF;
  RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.delete_expired_subscriptions()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM hired_modules WHERE due_to < CURRENT_DATE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enviar_documentos_a_46_dias()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    destinatario TEXT;
    asunto TEXT;
    contenido TEXT;
    documentos_usuario TEXT[];
    documento RECORD;
    destinatarios_adicionales TEXT[];
    todos_destinatarios TEXT[];
    nombre_compania TEXT;
BEGIN
    -- Obtener todos los destinatarios únicos
    FOR destinatario IN SELECT DISTINCT profile.email FROM profile
    LOOP
        -- Obtener documentos por vencer
        SELECT array_agg(
            'Documento: ' || dt.name || 
            ', Vence: ' || to_char(de.validity::timestamptz, 'DD/MM/YYYY HH24:MI:SS') || 
            ', Empleado: ' || e.name || ' ' || e.last_name
        )
        INTO documentos_usuario
        FROM documents_employees de
        JOIN document_types dt ON de.id_document_types = dt.id
        JOIN employees e ON de.applies = e.id
        JOIN profile ON e.profile_id = profile.id
        WHERE 
            de.validity::timestamptz >= CURRENT_TIMESTAMP
            AND de.validity::timestamptz < (CURRENT_TIMESTAMP + INTERVAL '45 days')
            AND profile.email = destinatario;

        -- Solo continuar si hay documentos por vencer
        IF documentos_usuario IS NOT NULL THEN
            SELECT c.company_name
            INTO nombre_compania
            FROM company c
            JOIN share_company_users scu ON c.id = scu.company_id
            JOIN profile p ON scu.profile_id = p.id
            WHERE p.email = destinatario;

            contenido := '
            <!DOCTYPE html PUBLIC >
            <html lang="es">
            <head>
                <meta content="text/html; charset=UTF-8"/>
                <link rel="preconnect" href="https://fonts.googleapis.com"/>
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
                <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet"/>
            </head>
            <body>
                <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px">
                    <tbody>
                        <tr style="width:100%">
                            <td>
                                <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:600px;background-color:#ffffff;border-radius:8px;border:1px solid #e9e9e9;margin-bottom:40px">
                                    <tbody>
                                        <tr>
                                            <td style="padding-top:40px;padding-bottom:40px;padding-left:40px;padding-right:40px">
                                                <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td>
                                                                <h2 style="margin-top:0px;margin-bottom:0px;font-family:''Roboto'',sans-serif;font-weight:500;font-size:20px;line-height:24px;color:#1f1f1f">
                                                                    Documentos próximos a vencer
                                                                </h2>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:600px;background-color:#ffffff;border-radius:8px;border:1px solid #e9e9e9;margin-bottom:40px">
                                    <tbody>
                                        <tr>
                                            <td style="padding-top:40px;padding-bottom:40px;padding-left:40px;padding-right:40px">
                                                <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td>
                                                                <p style="margin-top:0px;margin-bottom:0px;font-family:''Roboto'',sans-serif;font-size:16px;line-height:24px;color:#3c4149">
                                                                    Hola, te escribimos desde ' || nombre_compania || '.
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:600px;background-color:#ffffff;border-radius:8px;border:1px solid #e9e9e9;margin-bottom:40px">
                                    <tbody>
                                        <tr>
                                            <td style="padding-top:40px;padding-bottom:40px;padding-left:40px;padding-right:40px">
                                                <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td>
                                                                <p style="margin-top:0px;margin-bottom:20px;font-family:''Roboto'',sans-serif;font-size:16px;line-height:24px;color:#3c4149">
                                                                    Los siguientes documentos están próximos a vencer:
                                                                </p>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <ul style="margin-top:0px;margin-bottom:20px;font-family:''Roboto'',sans-serif;font-size:16px;line-height:24px;color:#3c4149">';

            -- Agregar cada documento a la lista
            FOR i IN 1..array_upper(documentos_usuario, 1) LOOP
                contenido := contenido || '<li>' || documentos_usuario[i] || '</li>';
            END LOOP;

            contenido := contenido || '</ul>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </body>
            </html>';

            -- Construir el asunto del correo electrónico
            asunto := 'Documentos por vencer';

            -- Obtener los destinatarios adicionales
            SELECT array_agg(p.email)
            INTO destinatarios_adicionales
            FROM share_company_users scu
            JOIN company c ON scu.company_id = c.id
            JOIN profile p ON scu.profile_id = p.id
            WHERE c.owner_id = (SELECT id FROM profile WHERE email = destinatario);

            -- Crear el array todos_destinatarios
            todos_destinatarios := ARRAY[destinatario] || destinatarios_adicionales;

            -- Enviar el correo electrónico al destinatario actual
            PERFORM net.http_post(
                url := 'https://zktcbhhlcksopklpnubj.supabase.co/functions/v1/resend',
                body := jsonb_build_object(
                    'from', 'Codecontrol <team@codecontrol.com.ar>',
                    'to', todos_destinatarios,
                    'subject', asunto,
                    'html', contenido
                )
            );
        END IF;
    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enviar_documentos_vencidos()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    destinatario TEXT;
    asunto TEXT;
    contenido TEXT;
    documentos_usuario TEXT[];
    documento RECORD;
    nombre_compania TEXT;
    destinatarios_adicionales TEXT[];
    todos_destinatarios TEXT[];
BEGIN
    -- Obtener todos los destinatarios únicos
    FOR destinatario IN SELECT DISTINCT profile.email FROM profile
    LOOP
        -- Obtener documentos vencidos
        SELECT array_agg(
            'Documento: ' || dt.name || 
            ', Venció: ' || to_char(de.validity::timestamptz, 'DD/MM/YYYY HH24:MI:SS') || 
            ', Empleado: ' || e.name || ' ' || e.last_name
        )
        INTO documentos_usuario
        FROM documents_employees de
        JOIN document_types dt ON de.id_document_types = dt.id
        JOIN employees e ON de.applies = e.id
        JOIN profile ON e.profile_id = profile.id
        WHERE 
            de.validity::timestamptz < CURRENT_TIMESTAMP
            AND profile.email = destinatario;

        -- Solo continuar si hay documentos vencidos
        IF documentos_usuario IS NOT NULL THEN
            SELECT c.company_name
            INTO nombre_compania
            FROM company c
            JOIN share_company_users scu ON c.id = scu.company_id
            JOIN profile p ON scu.profile_id = p.id
            WHERE p.email = destinatario;

            contenido := '
            <!DOCTYPE html PUBLIC >
            <html lang="es">
            <head>
                <meta content="text/html; charset=UTF-8"/>
                <link rel="preconnect" href="https://fonts.googleapis.com"/>
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
                <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet"/>
            </head>
            <body>
                <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px">
                    <tbody>
                        <tr style="width:100%">
                            <td>
                                <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:600px;background-color:#ffffff;border-radius:8px;border:1px solid #e9e9e9;margin-bottom:40px">
                                    <tbody>
                                        <tr>
                                            <td style="padding-top:40px;padding-bottom:40px;padding-left:40px;padding-right:40px">
                                                <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td>
                                                                <h2 style="margin-top:0px;margin-bottom:0px;font-family:''Roboto'',sans-serif;font-weight:500;font-size:20px;line-height:24px;color:#1f1f1f">
                                                                    Documentos vencidos
                                                                </h2>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:600px;background-color:#ffffff;border-radius:8px;border:1px solid #e9e9e9;margin-bottom:40px">
                                    <tbody>
                                        <tr>
                                            <td style="padding-top:40px;padding-bottom:40px;padding-left:40px;padding-right:40px">
                                                <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td>
                                                                <p style="margin-top:0px;margin-bottom:0px;font-family:''Roboto'',sans-serif;font-size:16px;line-height:24px;color:#3c4149">
                                                                    Hola, te escribimos desde ' || nombre_compania || '.
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:600px;background-color:#ffffff;border-radius:8px;border:1px solid #e9e9e9;margin-bottom:40px">
                                    <tbody>
                                        <tr>
                                            <td style="padding-top:40px;padding-bottom:40px;padding-left:40px;padding-right:40px">
                                                <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td>
                                                                <p style="margin-top:0px;margin-bottom:20px;font-family:''Roboto'',sans-serif;font-size:16px;line-height:24px;color:#3c4149">
                                                                    Los siguientes documentos están vencidos:
                                                                </p>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <ul style="margin-top:0px;margin-bottom:20px;font-family:''Roboto'',sans-serif;font-size:16px;line-height:24px;color:#3c4149">';

            -- Agregar cada documento a la lista
            FOR i IN 1..array_upper(documentos_usuario, 1) LOOP
                contenido := contenido || '<li>' || documentos_usuario[i] || '</li>';
            END LOOP;

            contenido := contenido || '</ul>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </body>
            </html>';

            -- Construir el asunto del correo electrónico
            asunto := 'Documentos vencidos';

            -- Obtener los destinatarios adicionales
            SELECT array_agg(p.email)
            INTO destinatarios_adicionales
            FROM share_company_users scu
            JOIN company c ON scu.company_id = c.id
            JOIN profile p ON scu.profile_id = p.id
            WHERE c.owner_id = (SELECT id FROM profile WHERE email = destinatario);

            -- Crear el array todos_destinatarios
            todos_destinatarios := ARRAY[destinatario] || destinatarios_adicionales;

            -- Enviar el correo electrónico al destinatario actual
            PERFORM net.http_post(
                url := 'https://zktcbhhlcksopklpnubj.supabase.co/functions/v1/resend',
                body := jsonb_build_object(
                    'from', 'Codecontrol <team@codecontrol.com.ar>',
                    'to', todos_destinatarios,
                    'subject', asunto,
                    'html', contenido
                )
            );
        END IF;
    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_document_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_company_id UUID; -- Variable para almacenar el company_id
    resource text;
BEGIN
    -- Obtener el company_id basado en el ID proporcionado
    select 
  company_id INTO v_company_id
from
  documents_employees
  inner join employees on documents_employees.applies = employees.id
where
  documents_employees.id = NEW.id;
   resource :='employee';

    IF v_company_id IS NULL THEN
            -- Si no se encontró en documents_employees, buscar en documents_equipment
            SELECT company_id INTO v_company_id
            FROM documents_equipment  inner join vehicles on documents_equipment.applies = documents_equipment.id
            WHERE documents_equipment.id = NEW.id;
            resource :='equipment';
        END IF;

    IF NEW.state = 'rechazado' THEN
        INSERT INTO notifications (title, description, category, company_id, document_id,reference)
        VALUES ('Un documento ha sido rechazado', NEW.deny_reason, 'rechazado', v_company_id, NEW.id,resource);
    ELSIF NEW.state = 'aprobado' THEN
        INSERT INTO notifications (title, description, category, company_id, document_id,reference)
        VALUES ('Un documento ha sido aprobado', '', 'aprobado', v_company_id, NEW.id,resource);
    ELSIF NEW.state = 'vencido' THEN
        INSERT INTO notifications (title, description, category, company_id, document_id,reference)
        VALUES ('Venció un documento', '', 'vencimiento', v_company_id, NEW.id,resource);
    END IF;

    RETURN NEW;
END;

$function$
;

CREATE OR REPLACE FUNCTION public.pruebaemail()
 RETURNS void
 LANGUAGE plpgsql
AS $function$DECLARE
    destinatario TEXT;
    asunto TEXT;
    contenido TEXT;
    documentos_usuario TEXT[];
    documento RECORD;
    destinatarios_adicionales TEXT[];
    todos_destinatarios TEXT[];
      nombre_compania TEXT;
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
                '<br>Fecha de vencimiento: ' || fecha_vencimiento ||
                CASE WHEN documento_empleado IS NOT NULL THEN '<br>Documento del empleado: ' || documento_empleado ELSE '' END ||
                CASE WHEN dominio_vehiculo IS NOT NULL THEN '<br>Dominio del vehículo: ' || dominio_vehiculo ELSE '' END
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
                AND TO_DATE(de.validity, 'DD-MM-YYYY') < DATE_TRUNC('day', CURRENT_DATE) + INTERVAL '45 days'
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
                AND TO_DATE(de.validity, 'DD-MM-YYYY') < DATE_TRUNC('day', CURRENT_DATE) + INTERVAL '45 days'
                AND profile.email = destinatario
        ) AS documentos;


          SELECT c.company_name
        INTO nombre_compania
        FROM company c
        JOIN share_company_users scu ON c.id = scu.company_id
        JOIN profile p ON scu.profile_id = p.id
        WHERE p.email = destinatario;

        -- Construir el contenido del correo electrónico con el HTML proporcionado
        contenido := '
          <!DOCTYPE html PUBLIC>
<html lang="es">
   <head>
      <meta content="text/html; charset=UTF-8" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
         href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
         rel="stylesheet"
      />
      <style>
         /* Estilos para modo claro */
         body {
            background-color: #ffffff;
            color: #0f172a;
            font-family: "Poppins", sans-serif;
         }

         .bg-primary {
            background-color: #1e293b;
         }

         .bg-muted {
            background-color: #f8fafc;
         }

         .text-primary {
            color: #1e293b;
         }

         .text-muted {
            color: #6b7280;
         }

         .text-white {
            color: #f8fafc;
         }

         /* Estilos para modo oscuro */
      </style>
   </head>
   <body>
      <table
         align="center"
         width="100%"
         border="0"
         cellpadding="0"
         cellspacing="0"
         role="presentation"
         style="max-width: 680px; margin: 0 auto"
         class="bg-muted"
      >
         <tbody>
            <tr style="width: 100%">
               <td>
                  <table
                     align="center"
                     width="100%"
                     border="0"
                     cellpadding="0"
                     cellspacing="0"
                     role="presentation"
                     style="
                        border-radius: 0.5rem 0.5rem 0 0;
                        display: flex;
                        flex-direction: column;
                     "
                     class="bg-primary"
                  >
                     <tbody>
                        <tr>
                           <td>
                              <table
                                 align="center"
                                 width="100%"
                                 border="0"
                                 cellpadding="0"
                                 cellspacing="0"
                                 role="presentation"
                              >
                                 <tbody style="width: 100%">
                                    <tr style="width: 100%">
                                       <td style="padding: 20px 30px 15px">
                                          <h1
                                             style="
                                                font-size: 27px;
                                                font-weight: bold;
                                                line-height: 27px;
                                             "
                                             class="text-white"
                                          >
                                             Codecontrol.com.ar
                                          </h1>
                                          <p
                                             style="
                                                font-size: 17px;
                                                line-height: 24px;
                                                margin: 16px 0;
                                             "
                                             class="text-white"
                                          >
                                             Documentos a Vencer en los próximos
                                             45 días
                                          </p>
                                       </td>
                                       <td style="padding: 30px 10px">
                                          <img
                                             src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/24417298440.png"
                                             style="
                                                display: block;
                                                outline: none;
                                                border: none;
                                                text-decoration: none;
                                                max-width: 100%;
                                             "
                                             width="140"
                                          />
                                       </td>
                                    </tr>
                                 </tbody>
                              </table>
                           </td>
                        </tr>
                     </tbody>
                  </table>
                  <table
                     align="center"
                     width="100%"
                     border="0"
                     cellpadding="0"
                     cellspacing="0"
                     role="presentation"
                     style="padding: 30px 30px 40px 30px"
                  >
                     <tbody>
                        <tr>
                           <td>
                              <h2
                                 style="
                                    margin: 0 0 15px;
                                    font-weight: bold;
                                    font-size: 21px;
                                    line-height: 21px;
                                 "
                                 class="text-primary"
                              >
                                 Listado de Documentos de la compañia
                                 {nombre_compania}
                              </h2>
                              <hr
                                 style="
                                    width: 100%;
                                    border: none;
                                    border-top: 1px solid #e2e8f0;
                                    margin: 30px 0;
                                 "
                              />
                              <ul>
                                 {documentos_usuario}
                              </ul>
                              <hr
                                 style="
                                    width: 100%;
                                    border: none;
                                    border-top: 1px solid #e2e8f0;
                                    margin: 30px 0;
                                 "
                              />
                              <h2
                                 style="
                                    margin: 0 0 15px;
                                    font-weight: bold;
                                    font-size: 21px;
                                    line-height: 21px;
                                 "
                                 class="text-primary"
                              >
                                 Para ver los documentos diríjase a la app
                              </h2>
                              <table
                                 align="center"
                                 width="100%"
                                 border="0"
                                 cellpadding="0"
                                 cellspacing="0"
                                 role="presentation"
                                 style="margin-top: 24px; display: block"
                              >
                                 <tbody>
                                    <tr>
                                       <td>
                                          <a
                                             href="https://codecontrol.com.ar"
                                             style="
                                                text-decoration: none;
                                                font-size: 17px;
                                                line-height: 17px;
                                                padding: 13px 17px;
                                                border-radius: 0.5rem;
                                                max-width: 120px;
                                                color: #f8fafc;
                                                background-color: #1e293b;
                                             "
                                             target="_blank"
                                             >ir a codecontrol.com.ar</a
                                          >
                                       </td>
                                    </tr>
                                 </tbody>
                              </table>
                           </td>
                        </tr>
                     </tbody>
                  </table>
               </td>
            </tr>
         </tbody>
      </table>
   </body>
</html>
';

        -- Construir el asunto del correo electrónico
        asunto := 'Documentos por vencer';

         -- Obtener los destinatarios adicionales
        SELECT array_agg(p.email)
        INTO destinatarios_adicionales
        FROM share_company_users scu
        JOIN company c ON scu.company_id = c.id
        JOIN profile p ON scu.profile_id = p.id
        WHERE c.owner_id = (SELECT id FROM profile WHERE email = destinatario);

         -- Crear el array todos_destinatarios
        todos_destinatarios := ARRAY[destinatario] || destinatarios_adicionales;

        -- Enviar el correo electrónico al destinatario actual
        PERFORM net.http_post(
            url := 'https://zktcbhhlcksopklpnubj.supabase.co/functions/v1/resend',
            body := jsonb_build_object(
                'from', 'Codecontrol <team@codecontrol.com.ar>',
              'to', todos_destinatarios,
                'subject', asunto,
                'html', contenido
            )
        );
        
    END LOOP;
END;$function$
;

CREATE OR REPLACE FUNCTION public.verificar_documentos_vencidos_prueba()
 RETURNS void
 LANGUAGE plpgsql
AS $function$DECLARE
    v_company_id uuid;
    resource text;
BEGIN
    -- Establecer el estilo de fecha
    SET datestyle = 'ISO, DMY';

    -- Verificar documentos vencidos en documents_employees
    UPDATE documents_employees
    SET state = 'vencido'
    WHERE validity::date < current_date;

    -- Verificar documentos vencidos en documents_equipment
    UPDATE documents_equipment
    SET state = 'vencido'
    WHERE validity::date < current_date;

    -- Buscar company_id en documents_employees
    SELECT company_id INTO v_company_id
    FROM documents_employees
    WHERE documents_employees.id = NEW.id;

    -- Si no se encontró en documents_employees, buscar en documents_equipment
    IF v_company_id IS NULL THEN
        SELECT company_id INTO v_company_id
        FROM documents_equipment
        WHERE documents_equipment.id = NEW.id;
        resource := 'equipment';
    ELSE
        resource := 'employee';
    END IF;

    -- Insertar entrada en la tabla notifications si se cambió el estado
    IF FOUND THEN
        INSERT INTO notifications (
            title,
            description,
            category,
            company_id,
            document_id,
            reference
        )
        VALUES (
            'Venció un documento',
            '',
            'vencimiento',
            v_company_id,
            NEW.id,
            resource
        );
    END IF;
END;$function$
;

grant delete on table "public"."storage_migrations" to "anon";

grant insert on table "public"."storage_migrations" to "anon";

grant references on table "public"."storage_migrations" to "anon";

grant select on table "public"."storage_migrations" to "anon";

grant trigger on table "public"."storage_migrations" to "anon";

grant truncate on table "public"."storage_migrations" to "anon";

grant update on table "public"."storage_migrations" to "anon";

grant delete on table "public"."storage_migrations" to "authenticated";

grant insert on table "public"."storage_migrations" to "authenticated";

grant references on table "public"."storage_migrations" to "authenticated";

grant select on table "public"."storage_migrations" to "authenticated";

grant trigger on table "public"."storage_migrations" to "authenticated";

grant truncate on table "public"."storage_migrations" to "authenticated";

grant update on table "public"."storage_migrations" to "authenticated";

grant delete on table "public"."storage_migrations" to "service_role";

grant insert on table "public"."storage_migrations" to "service_role";

grant references on table "public"."storage_migrations" to "service_role";

grant select on table "public"."storage_migrations" to "service_role";

grant trigger on table "public"."storage_migrations" to "service_role";

grant truncate on table "public"."storage_migrations" to "service_role";

grant update on table "public"."storage_migrations" to "service_role";

create policy "permitir todo"
on "public"."form_answers"
as permissive
for all
to authenticated, anon
using (true);


create policy "Permitir todo"
on "public"."vehicles"
as permissive
for all
to authenticated, anon
using (true);


CREATE TRIGGER add_contractor_equipment_after_insert AFTER INSERT ON public.vehicles FOR EACH ROW EXECUTE FUNCTION equipment_allocated_to();


