
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "public";

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE TYPE "public"."affiliate_status_enum" AS ENUM (
    'Dentro de convenio',
    'Fuera de convenio'
);

ALTER TYPE "public"."affiliate_status_enum" OWNER TO "postgres";

CREATE TYPE "public"."condition_enum" AS ENUM (
    'operativo',
    'no operativo',
    'en reparación',
    'operativo condicionado'
);

ALTER TYPE "public"."condition_enum" OWNER TO "postgres";

CREATE TYPE "public"."daily_report_status" AS ENUM (
    'pendiente',
    'ejecutado',
    'reprogramado',
    'cancelado'
);

ALTER TYPE "public"."daily_report_status" OWNER TO "postgres";

CREATE TYPE "public"."document_applies" AS ENUM (
    'Persona',
    'Equipos',
    'Empresa'
);

ALTER TYPE "public"."document_applies" OWNER TO "postgres";

CREATE TYPE "public"."document_type_enum" AS ENUM (
    'DNI',
    'LE',
    'LC',
    'PASAPORTE'
);

ALTER TYPE "public"."document_type_enum" OWNER TO "postgres";

CREATE TYPE "public"."gender_enum" AS ENUM (
    'Masculino',
    'Femenino',
    'No Declarado'
);

ALTER TYPE "public"."gender_enum" OWNER TO "postgres";

CREATE TYPE "public"."level_of_education_enum" AS ENUM (
    'Primario',
    'Secundario',
    'Terciario',
    'Universitario',
    'PosGrado'
);

ALTER TYPE "public"."level_of_education_enum" OWNER TO "postgres";

CREATE TYPE "public"."marital_status_enum" AS ENUM (
    'Casado',
    'Soltero',
    'Divorciado',
    'Viudo',
    'Separado'
);

ALTER TYPE "public"."marital_status_enum" OWNER TO "postgres";

CREATE TYPE "public"."modulos" AS ENUM (
    'empresa',
    'empleados',
    'equipos',
    'documentación',
    'mantenimiento',
    'dashboard',
    'ayuda',
    'operaciones',
    'formularios'
);

ALTER TYPE "public"."modulos" OWNER TO "postgres";

CREATE TYPE "public"."nationality_enum" AS ENUM (
    'Argentina',
    'Extranjero'
);

ALTER TYPE "public"."nationality_enum" OWNER TO "postgres";

CREATE TYPE "public"."notification_categories" AS ENUM (
    'vencimiento',
    'noticia',
    'advertencia',
    'aprobado',
    'rechazado'
);

ALTER TYPE "public"."notification_categories" OWNER TO "postgres";

CREATE TYPE "public"."reason_for_termination_enum" AS ENUM (
    'Despido sin causa',
    'Renuncia',
    'Despido con causa',
    'Acuerdo de partes',
    'Fin de contrato',
    'Fallecimiento'
);

ALTER TYPE "public"."reason_for_termination_enum" OWNER TO "postgres";

CREATE TYPE "public"."repair_state" AS ENUM (
    'Pendiente',
    'Esperando repuestos',
    'En reparación',
    'Finalizado',
    'Rechazado',
    'Cancelado',
    'Programado'
);

ALTER TYPE "public"."repair_state" OWNER TO "postgres";

CREATE TYPE "public"."roles_enum" AS ENUM (
    'Externo',
    'Auditor'
);

ALTER TYPE "public"."roles_enum" OWNER TO "postgres";

CREATE TYPE "public"."state" AS ENUM (
    'presentado',
    'rechazado',
    'aprobado',
    'vencido',
    'pendiente'
);

ALTER TYPE "public"."state" OWNER TO "postgres";

COMMENT ON TYPE "public"."state" IS 'estado del documeto';

CREATE TYPE "public"."status_type" AS ENUM (
    'Avalado',
    'No avalado',
    'Incompleto',
    'Completo',
    'Completo con doc vencida'
);

ALTER TYPE "public"."status_type" OWNER TO "postgres";

CREATE TYPE "public"."type_of_contract_enum" AS ENUM (
    'Período de prueba',
    'A tiempo indeterminado',
    'Plazo fijo'
);

ALTER TYPE "public"."type_of_contract_enum" OWNER TO "postgres";

CREATE TYPE "public"."type_of_maintenance_ENUM" AS ENUM (
    'Correctivo',
    'Preventivo'
);

ALTER TYPE "public"."type_of_maintenance_ENUM" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."actualizar_estado_documentos"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;

ALTER FUNCTION "public"."actualizar_estado_documentos"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."add_new_document"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
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
END;$$;

ALTER FUNCTION "public"."add_new_document"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."add_to_companies_employees"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
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
END;$$;

ALTER FUNCTION "public"."add_to_companies_employees"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."create_user_for_external_login"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
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
END;$$;

ALTER FUNCTION "public"."create_user_for_external_login"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."deactivate_service_items"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE service_items
    SET is_active = NEW.is_active
    WHERE customer_service_id = NEW.id;
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."deactivate_service_items"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."delete_expired_subscriptions"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM hired_modules WHERE due_to < CURRENT_DATE;
END;
$$;

ALTER FUNCTION "public"."delete_expired_subscriptions"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."enviar_documentos_a_46_dias"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;

ALTER FUNCTION "public"."enviar_documentos_a_46_dias"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."enviar_documentos_vencidos"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;

ALTER FUNCTION "public"."enviar_documentos_vencidos"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."equipment_allocated_to"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  contractor_id UUID;
BEGIN
  IF NEW.allocated_to IS NOT NULL AND array_length(NEW.allocated_to, 1) > 0 THEN
    -- Insertar en contractor_employee para cada ID en allocated_to
    FOREACH contractor_id IN ARRAY NEW.allocated_to
    LOOP
      INSERT INTO contractor_equipment(contractor_id, equipment_id)
      VALUES (contractor_id, NEW.id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."equipment_allocated_to"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_employees_diagram_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
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
END;$$;

ALTER FUNCTION "public"."handle_employees_diagram_changes"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."log_document_employee_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO documents_employees_logs (documents_employees_id, modified_by, updated_at)
        VALUES (NEW.id, NEW.user_id, now());
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO documents_employees_logs (documents_employees_id, modified_by, updated_at)
        VALUES (NEW.id, NEW.user_id, now());
    END IF;
    RETURN NULL;
END;$$;

ALTER FUNCTION "public"."log_document_employee_changes"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."log_document_equipment_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO documents_equipment_logs (documents_equipment_id, modified_by, updated_at)
        VALUES (NEW.id, NEW.user_id, now());
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO documents_equipment_logs (documents_equipment_id, modified_by, updated_at)
        VALUES (NEW.id, NEW.user_id, now());
    END IF;
    RETURN NULL;
END;$$;

ALTER FUNCTION "public"."log_document_equipment_changes"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."log_repair_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
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
END;$$;

ALTER FUNCTION "public"."log_repair_changes"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."migrate_document"("target_id" "uuid", "execute_migration" boolean DEFAULT false) RETURNS TABLE("old_path" "text", "new_path" "text", "success" boolean, "error_message" "text", "action_taken" "text", "storage_migration_id" "uuid")
    LANGUAGE "plpgsql"
    AS $_$
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
$_$;

ALTER FUNCTION "public"."migrate_document"("target_id" "uuid", "execute_migration" boolean) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."migrate_documents_preview"() RETURNS TABLE("old_path" "text", "new_path" "text", "success" boolean, "error_message" "text")
    LANGUAGE "plpgsql"
    AS $_$
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
$_$;

ALTER FUNCTION "public"."migrate_documents_preview"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."notify_document_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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

$$;

ALTER FUNCTION "public"."notify_document_update"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."obtener_documentos_por_vencer"() RETURNS TABLE("tipo_documento" "text", "correo_electronico" "text", "fecha_vencimiento" "date", "documento_empleado" "text", "dominio_vehiculo" "text")
    LANGUAGE "plpgsql"
    AS $$BEGIN
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
END;$$;

ALTER FUNCTION "public"."obtener_documentos_por_vencer"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."pruebaemail"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$DECLARE
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
END;$$;

ALTER FUNCTION "public"."pruebaemail"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_company_by_defect"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.by_defect = true THEN
        UPDATE company
        SET by_defect = false
        WHERE owner_id = NEW.owner_id AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_company_by_defect"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_status_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Para documents_employees
  IF TG_TABLE_NAME = 'documents_employees' THEN
    IF NEW.state = 'vencido' THEN
      UPDATE employees
      SET status = 'Completo con doc vencida'
      WHERE id = NEW.applies;
    ELSIF (SELECT COUNT(*) FROM documents_employees WHERE applies = NEW.applies AND state != 'presentado') = 0 THEN
      UPDATE employees
      SET status = 'Completo'
      WHERE id = NEW.applies;
    ELSE
      UPDATE employees
      SET status = 'Incompleto'
      WHERE id = NEW.applies;
    END IF;
  END IF;

  -- Para documents_equipment
  IF TG_TABLE_NAME = 'documents_equipment' THEN
    IF NEW.state = 'vencido' THEN
      UPDATE vehicles
      SET status = 'Completo con doc vencida'
      WHERE id = NEW.applies;
    ELSIF (SELECT COUNT(*) FROM documents_equipment WHERE applies = NEW.applies AND state != 'presentado') = 0 THEN
      UPDATE vehicles
      SET status = 'Completo'
      WHERE id = NEW.applies;
    ELSE
      UPDATE vehicles
      SET status = 'Incompleto'
      WHERE id = NEW.applies;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_status_trigger"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."verificar_documentos_vencidos_prueba"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$DECLARE
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
END;$$;

ALTER FUNCTION "public"."verificar_documentos_vencidos_prueba"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."assing_customer" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "equipment_id" "uuid" NOT NULL
);

ALTER TABLE "public"."assing_customer" OWNER TO "postgres";

ALTER TABLE "public"."assing_customer" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."assing_customer_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."brand_vehicles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "is_active" boolean DEFAULT true,
    "company_id" "uuid"
);

ALTER TABLE "public"."brand_vehicles" OWNER TO "postgres";

ALTER TABLE "public"."brand_vehicles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."brand_vehicles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."category" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "covenant_id" "uuid",
    "name" "text",
    "is_active" boolean DEFAULT true
);

ALTER TABLE "public"."category" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."category_employee" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category_id" "uuid",
    "emplyee_id" "uuid",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

ALTER TABLE "public"."category_employee" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."cities" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "province_id" bigint NOT NULL,
    "name" "text" NOT NULL
);

ALTER TABLE "public"."cities" OWNER TO "postgres";

COMMENT ON TABLE "public"."cities" IS 'Tabla de Ciudades';

ALTER TABLE "public"."cities" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."citys_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."companies_employees" (
    "employee_id" "uuid" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid"
);

ALTER TABLE "public"."companies_employees" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."company" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_name" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "website" character varying(255),
    "contact_email" character varying(255) NOT NULL,
    "contact_phone" character varying(20) NOT NULL,
    "address" character varying(255) NOT NULL,
    "city" bigint NOT NULL,
    "country" character varying(100) NOT NULL,
    "industry" "text" NOT NULL,
    "company_logo" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "company_cuit" "text" NOT NULL,
    "province_id" bigint,
    "owner_id" "uuid",
    "by_defect" boolean DEFAULT false
);

ALTER TABLE "public"."company" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "contact_name" "text",
    "constact_email" "text",
    "contact_phone" bigint,
    "contact_charge" "text",
    "company_id" "uuid",
    "customer_id" "uuid",
    "is_active" boolean DEFAULT true,
    "reason_for_termination" "text",
    "termination_date" "date"
);

ALTER TABLE "public"."contacts" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."contractor_employee" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "employee_id" "uuid",
    "contractor_id" "uuid"
);

ALTER TABLE "public"."contractor_employee" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."contractor_equipment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "equipment_id" "uuid",
    "contractor_id" "uuid"
);

ALTER TABLE "public"."contractor_equipment" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."contractors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL
);

ALTER TABLE "public"."contractors" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."countries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL
);

ALTER TABLE "public"."countries" OWNER TO "postgres";

COMMENT ON TABLE "public"."countries" IS 'Tabla de Paises del mundo';

CREATE TABLE IF NOT EXISTS "public"."covenant" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "company_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true,
    "guild_id" "uuid" NOT NULL
);

ALTER TABLE "public"."covenant" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."custom_form" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "form" "jsonb" NOT NULL,
    "name" "text" NOT NULL
);

ALTER TABLE "public"."custom_form" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."customer_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "customer_id" "uuid",
    "service_name" "text",
    "service_validity" "date",
    "company_id" "uuid",
    "is_active" boolean DEFAULT true,
    "service_start" "date"
);

ALTER TABLE "public"."customer_services" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."customers" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "cuit" bigint NOT NULL,
    "client_email" "text",
    "client_phone" bigint,
    "address" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "is_active" boolean DEFAULT true,
    "company_id" "uuid" NOT NULL,
    "reason_for_termination" "text",
    "termination_date" "date"
);

ALTER TABLE "public"."customers" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."dailyreport" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creation_date" "date" DEFAULT CURRENT_DATE,
    "date" "date" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "company_id" "uuid" NOT NULL,
    "status" boolean DEFAULT true,
    "is_active" boolean DEFAULT true
);

ALTER TABLE "public"."dailyreport" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."dailyreportemployeerelations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "daily_report_row_id" "uuid",
    "employee_id" "uuid",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "public"."dailyreportemployeerelations" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."dailyreportequipmentrelations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "daily_report_row_id" "uuid",
    "equipment_id" "uuid",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "public"."dailyreportequipmentrelations" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."dailyreportrows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "daily_report_id" "uuid",
    "customer_id" "uuid",
    "service_id" "uuid",
    "item_id" "uuid",
    "start_time" time without time zone,
    "end_time" time without time zone,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."daily_report_status" DEFAULT 'pendiente'::"public"."daily_report_status" NOT NULL,
    "working_day" "text",
    "document_path" "text"
);

ALTER TABLE "public"."dailyreportrows" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."diagram_type" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "company_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "color" "text" NOT NULL,
    "short_description" "text" NOT NULL,
    "work_active" boolean DEFAULT false
);

ALTER TABLE "public"."diagram_type" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."diagrams_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "prev_date" timestamp with time zone NOT NULL,
    "description" "text" NOT NULL,
    "state" "text" NOT NULL,
    "prev_state" "text" NOT NULL,
    "modified_by" "uuid" DEFAULT "auth"."uid"(),
    "employee_id" "uuid" NOT NULL,
    "diagram_id" "uuid" NOT NULL
);

ALTER TABLE "public"."diagrams_logs" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."document_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "applies" "public"."document_applies" NOT NULL,
    "multiresource" boolean NOT NULL,
    "mandatory" boolean NOT NULL,
    "explired" boolean NOT NULL,
    "special" boolean NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "description" "text",
    "company_id" "uuid",
    "is_it_montlhy" boolean,
    "private" boolean,
    "down_document" boolean
);

ALTER TABLE "public"."document_types" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."documents_company" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_document_types" "uuid",
    "validity" "text",
    "state" "public"."state" DEFAULT 'pendiente'::"public"."state" NOT NULL,
    "is_active" boolean DEFAULT true,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "applies" "uuid" NOT NULL,
    "deny_reason" "text",
    "document_path" "text",
    "period" "text"
);

ALTER TABLE "public"."documents_company" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."documents_employees" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_document_types" "uuid",
    "validity" timestamp with time zone,
    "state" "public"."state" DEFAULT 'pendiente'::"public"."state" NOT NULL,
    "is_active" boolean DEFAULT true,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "applies" "uuid",
    "deny_reason" "text",
    "document_path" "text",
    "period" "text"
);

ALTER TABLE "public"."documents_employees" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."documents_employees_logs" (
    "id" integer NOT NULL,
    "documents_employees_id" "uuid" NOT NULL,
    "modified_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."documents_employees_logs" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."documents_employees_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."documents_employees_logs_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."documents_employees_logs_id_seq" OWNED BY "public"."documents_employees_logs"."id";

CREATE TABLE IF NOT EXISTS "public"."documents_equipment" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_document_types" "uuid",
    "applies" "uuid",
    "validity" timestamp with time zone,
    "state" "public"."state" DEFAULT 'pendiente'::"public"."state",
    "is_active" boolean DEFAULT true,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "deny_reason" "text",
    "document_path" "text",
    "period" "text"
);

ALTER TABLE "public"."documents_equipment" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."documents_equipment_logs" (
    "id" integer DEFAULT "nextval"('"public"."documents_employees_logs_id_seq"'::"regclass") NOT NULL,
    "documents_equipment_id" "uuid" NOT NULL,
    "modified_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."documents_equipment_logs" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."employees" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "picture" "text" NOT NULL,
    "nationality" "public"."nationality_enum" NOT NULL,
    "lastname" "text" NOT NULL,
    "firstname" "text" NOT NULL,
    "cuil" "text" NOT NULL,
    "document_type" "public"."document_type_enum" NOT NULL,
    "document_number" "text" NOT NULL,
    "birthplace" "uuid" NOT NULL,
    "gender" "public"."gender_enum",
    "marital_status" "public"."marital_status_enum",
    "level_of_education" "public"."level_of_education_enum",
    "street" "text" NOT NULL,
    "street_number" "text" NOT NULL,
    "province" bigint NOT NULL,
    "postal_code" "text",
    "phone" "text" NOT NULL,
    "email" "text",
    "file" "text" NOT NULL,
    "normal_hours" "text",
    "date_of_admission" "date" NOT NULL,
    "affiliate_status" "public"."affiliate_status_enum",
    "company_position" "text",
    "city" bigint NOT NULL,
    "hierarchical_position" "uuid",
    "workflow_diagram" "uuid",
    "type_of_contract" "public"."type_of_contract_enum" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "allocated_to" "uuid"[],
    "company_id" "uuid",
    "is_active" boolean DEFAULT true,
    "reason_for_termination" "public"."reason_for_termination_enum",
    "termination_date" "date",
    "status" "public"."status_type" DEFAULT 'Incompleto'::"public"."status_type",
    "category_id" "uuid",
    "covenants_id" "uuid",
    "guild_id" "uuid"
);

ALTER TABLE "public"."employees" OWNER TO "postgres";

COMMENT ON COLUMN "public"."employees"."street_number" IS 'Altura de la calle (ejemplo Rivadavia 1356) esta tabla guarda el "1356"';

COMMENT ON COLUMN "public"."employees"."file" IS 'Legajo del empleado';

COMMENT ON COLUMN "public"."employees"."date_of_admission" IS 'Fecha de alta del empleado (Año, mes, dia)';

COMMENT ON COLUMN "public"."employees"."affiliate_status" IS 'Estado de afiliacion';

COMMENT ON COLUMN "public"."employees"."company_position" IS 'Puesto en la empresa';

COMMENT ON COLUMN "public"."employees"."hierarchical_position" IS 'Puesto jerárquico del empleado ';

COMMENT ON COLUMN "public"."employees"."workflow_diagram" IS 'Diagrama de trabajo del empleado';

COMMENT ON COLUMN "public"."employees"."type_of_contract" IS 'Tipo de contrato del empleado';

COMMENT ON COLUMN "public"."employees"."allocated_to" IS 'Afectado a';

CREATE TABLE IF NOT EXISTS "public"."employees_diagram" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "employee_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "diagram_type" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day" numeric NOT NULL,
    "month" numeric NOT NULL,
    "year" numeric NOT NULL
);

ALTER TABLE "public"."employees_diagram" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."form_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "answer" "json" NOT NULL
);

ALTER TABLE "public"."form_answers" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."guild" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "company_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL
);

ALTER TABLE "public"."guild" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."handle_errors" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "menssage" "text" NOT NULL,
    "path" "text" NOT NULL
);

ALTER TABLE "public"."handle_errors" OWNER TO "postgres";

ALTER TABLE "public"."handle_errors" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."handle_errors_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."hierarchy" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true
);

ALTER TABLE "public"."hierarchy" OWNER TO "postgres";

COMMENT ON TABLE "public"."hierarchy" IS 'Puestos Jerarquicos';

CREATE TABLE IF NOT EXISTS "public"."hired_modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid",
    "module_id" "uuid",
    "due_to" "date" DEFAULT (CURRENT_DATE + '1 mon'::interval)
);

ALTER TABLE "public"."hired_modules" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."industry_type" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "is_active" boolean DEFAULT true
);

ALTER TABLE "public"."industry_type" OWNER TO "postgres";

ALTER TABLE "public"."industry_type" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."industry_type_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."measure_units" (
    "id" integer NOT NULL,
    "unit" character varying(50) NOT NULL,
    "simbol" character varying(10) NOT NULL,
    "tipo" character varying(20) NOT NULL
);

ALTER TABLE "public"."measure_units" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."measure_units_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."measure_units_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."measure_units_id_seq" OWNED BY "public"."measure_units"."id";

CREATE TABLE IF NOT EXISTS "public"."model_vehicles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "brand" bigint,
    "is_active" boolean DEFAULT true
);

ALTER TABLE "public"."model_vehicles" OWNER TO "postgres";

ALTER TABLE "public"."model_vehicles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."model_vehicles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric NOT NULL,
    "description" "text" NOT NULL
);

ALTER TABLE "public"."modules" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text",
    "description" "text",
    "category" "public"."notification_categories",
    "company_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "document_id" "uuid",
    "reference" "text"
);

ALTER TABLE "public"."notifications" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."profile" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "credential_id" "uuid",
    "email" "text",
    "avatar" "text",
    "fullname" "text",
    "role" "text" DEFAULT 'User'::"text",
    "modulos" "public"."modulos"[]
);

ALTER TABLE "public"."profile" OWNER TO "postgres";

COMMENT ON TABLE "public"."profile" IS 'This table contains extra data from users';

COMMENT ON COLUMN "public"."profile"."role" IS 'roles';

CREATE TABLE IF NOT EXISTS "public"."provinces" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL
);

ALTER TABLE "public"."provinces" OWNER TO "postgres";

COMMENT ON TABLE "public"."provinces" IS 'Tabla de Provincias Argentinas';

ALTER TABLE "public"."provinces" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."provinces_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."repair_solicitudes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reparation_type" "uuid" NOT NULL,
    "equipment_id" "uuid" NOT NULL,
    "state" "public"."repair_state" NOT NULL,
    "user_description" "text",
    "mechanic_description" "text",
    "end_date" "date",
    "user_id" "uuid",
    "mechanic_id" "uuid",
    "mechanic_images" "text"[],
    "user_images" "text"[],
    "employee_id" "uuid",
    "kilometer" "text",
    "scheduled" timestamp with time zone
);

ALTER TABLE "public"."repair_solicitudes" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."repairlogs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "description" "text",
    "repair_id" "uuid",
    "kilometer" "text",
    "modified_by_employee" "uuid",
    "modified_by_user" "uuid"
);

ALTER TABLE "public"."repairlogs" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "intern" boolean DEFAULT false
);

ALTER TABLE "public"."roles" OWNER TO "postgres";

COMMENT ON TABLE "public"."roles" IS 'roles de usuarios';

COMMENT ON COLUMN "public"."roles"."intern" IS 'Indentificador de usuarios interno o externo';

ALTER TABLE "public"."roles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."service_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "customer_service_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "item_name" "text" NOT NULL,
    "item_description" "text" NOT NULL,
    "item_price" numeric NOT NULL,
    "item_measure_units" integer NOT NULL,
    "is_active" boolean DEFAULT true
);

ALTER TABLE "public"."service_items" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."share_company_users" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid" DEFAULT "gen_random_uuid"(),
    "company_id" "uuid" DEFAULT "gen_random_uuid"(),
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text",
    "customer_id" "uuid",
    "modules" "public"."modulos"[]
);

ALTER TABLE "public"."share_company_users" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."storage_migrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "old_path" "text" NOT NULL,
    "new_path" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "executed_at" timestamp with time zone,
    "error_message" "text"
);

ALTER TABLE "public"."storage_migrations" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."type" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "company_id" "uuid"
);

ALTER TABLE "public"."type" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."types_of_repairs" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "criticity" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid",
    "type_of_maintenance" "public"."type_of_maintenance_ENUM",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "multi_equipment" boolean DEFAULT false NOT NULL,
    "qr_close" boolean DEFAULT false NOT NULL,
    CONSTRAINT "types_of_repairs_check" CHECK (true)
);

ALTER TABLE "public"."types_of_repairs" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."types_of_vehicles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "is_active" boolean DEFAULT true
);

ALTER TABLE "public"."types_of_vehicles" OWNER TO "postgres";

ALTER TABLE "public"."types_of_vehicles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."types_of_vehicles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "picture" "text" NOT NULL,
    "type_of_vehicle" bigint NOT NULL,
    "domain" "text",
    "chassis" "text",
    "engine" "text" NOT NULL,
    "serie" "text",
    "intern_number" "text" NOT NULL,
    "year" "text" NOT NULL,
    "brand" bigint NOT NULL,
    "model" bigint NOT NULL,
    "is_active" boolean DEFAULT true,
    "termination_date" "date",
    "reason_for_termination" "text",
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "company_id" "uuid",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "uuid" NOT NULL,
    "status" "public"."status_type" DEFAULT 'Incompleto'::"public"."status_type",
    "allocated_to" "uuid"[],
    "condition" "public"."condition_enum" DEFAULT 'operativo'::"public"."condition_enum",
    "kilometer" "text" DEFAULT '0'::"text"
);

ALTER TABLE "public"."vehicles" OWNER TO "postgres";

COMMENT ON COLUMN "public"."vehicles"."company_id" IS 'id de company';

CREATE TABLE IF NOT EXISTS "public"."work-diagram" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true
);

ALTER TABLE "public"."work-diagram" OWNER TO "postgres";

ALTER TABLE ONLY "public"."documents_employees_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."documents_employees_logs_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."measure_units" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."measure_units_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."assing_customer"
    ADD CONSTRAINT "assing_customer_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."brand_vehicles"
    ADD CONSTRAINT "brand_vehicles_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."brand_vehicles"
    ADD CONSTRAINT "brand_vehicles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."category_employee"
    ADD CONSTRAINT "category_employee_created_at_key" UNIQUE ("created_at");

ALTER TABLE ONLY "public"."category_employee"
    ADD CONSTRAINT "category_employee_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "citys_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "companies_employees_cuil_key" UNIQUE ("cuil");

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "companies_employees_document_number_key" UNIQUE ("document_number");

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "companies_employees_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."companies_employees"
    ADD CONSTRAINT "companies_employees_pkey1" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_compay_cuit_key" UNIQUE ("company_cuit");

ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contractors"
    ADD CONSTRAINT "contractor-companies_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contractor_employee"
    ADD CONSTRAINT "contractor_employee_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contractor_equipment"
    ADD CONSTRAINT "contractor_equipment_employee_id_contractor_id_key" UNIQUE ("equipment_id", "contractor_id");

ALTER TABLE ONLY "public"."contractor_equipment"
    ADD CONSTRAINT "contractor_equipment_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."covenant"
    ADD CONSTRAINT "covenant_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."custom_form"
    ADD CONSTRAINT "custom_form_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."customer_services"
    ADD CONSTRAINT "customer_services_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dailyreport"
    ADD CONSTRAINT "dailyreport_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dailyreportemployeerelations"
    ADD CONSTRAINT "dailyreportemployeerelations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dailyreportequipmentrelations"
    ADD CONSTRAINT "dailyreportequipmentrelations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dailyreportrows"
    ADD CONSTRAINT "dailyreportrows_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."diagram_type"
    ADD CONSTRAINT "diagram_type_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."diagrams_logs"
    ADD CONSTRAINT "diagrams_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."document_types"
    ADD CONSTRAINT "document_types_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."documents_company"
    ADD CONSTRAINT "documents_company_document_path_key" UNIQUE ("document_path");

ALTER TABLE ONLY "public"."documents_company"
    ADD CONSTRAINT "documents_company_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."documents_employees_logs"
    ADD CONSTRAINT "documents_employees_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."documents_equipment_logs"
    ADD CONSTRAINT "documents_equipment_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."documents_equipment"
    ADD CONSTRAINT "documents_equipment_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."documents_employees"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."employees_diagram"
    ADD CONSTRAINT "employees_diagram_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."form_answers"
    ADD CONSTRAINT "form_answers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."guild"
    ADD CONSTRAINT "guild_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."handle_errors"
    ADD CONSTRAINT "handle_errors_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."hierarchy"
    ADD CONSTRAINT "hierarchy_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."hired_modules"
    ADD CONSTRAINT "hired_modules_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."industry_type"
    ADD CONSTRAINT "industry_type_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."industry_type"
    ADD CONSTRAINT "industry_type_type_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."measure_units"
    ADD CONSTRAINT "measure_units_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."model_vehicles"
    ADD CONSTRAINT "model_vehicles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_credentialId_key" UNIQUE ("credential_id");

ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."provinces"
    ADD CONSTRAINT "provinces_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."provinces"
    ADD CONSTRAINT "provinces_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."repair_solicitudes"
    ADD CONSTRAINT "repair_solicitudes_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."repairlogs"
    ADD CONSTRAINT "reparirlogs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."service_items"
    ADD CONSTRAINT "service_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."share_company_users"
    ADD CONSTRAINT "share_company_users_id2_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."share_company_users"
    ADD CONSTRAINT "share_company_users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."storage_migrations"
    ADD CONSTRAINT "storage_migrations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."type"
    ADD CONSTRAINT "type_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."types_of_repairs"
    ADD CONSTRAINT "types_of_repairs_id-2_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."types_of_repairs"
    ADD CONSTRAINT "types_of_repairs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."types_of_vehicles"
    ADD CONSTRAINT "types_of_vehicles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contractor_employee"
    ADD CONSTRAINT "unique_contractor_employee" UNIQUE ("employee_id", "contractor_id");

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_domain_key" UNIQUE ("domain");

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_id2_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."work-diagram"
    ADD CONSTRAINT "work-diagram_pkey" PRIMARY KEY ("id");

CREATE INDEX "cities_province_id_idx" ON "public"."cities" USING "btree" ("province_id");

CREATE INDEX "companies_employees_company_id_idx" ON "public"."companies_employees" USING "btree" ("company_id");

CREATE INDEX "companies_employees_employee_id_idx" ON "public"."companies_employees" USING "btree" ("employee_id");

CREATE OR REPLACE TRIGGER "add_contractor_equipment_after_insert" AFTER INSERT ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."equipment_allocated_to"();

CREATE OR REPLACE TRIGGER "add_new_document_trigger" AFTER INSERT ON "public"."document_types" FOR EACH ROW EXECUTE FUNCTION "public"."add_new_document"();

CREATE OR REPLACE TRIGGER "after_employee_insert" AFTER INSERT ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."add_to_companies_employees"();

CREATE OR REPLACE TRIGGER "after_service_update" AFTER UPDATE OF "is_active" ON "public"."customer_services" FOR EACH ROW WHEN (("old"."is_active" IS DISTINCT FROM "new"."is_active")) EXECUTE FUNCTION "public"."deactivate_service_items"();

CREATE OR REPLACE TRIGGER "after_service_update" AFTER UPDATE OF "is_active" ON "public"."service_items" FOR EACH ROW WHEN (("old"."is_active" IS DISTINCT FROM "new"."is_active")) EXECUTE FUNCTION "public"."deactivate_service_items"();

CREATE OR REPLACE TRIGGER "document_employee_changes_trigger" AFTER INSERT OR UPDATE ON "public"."documents_employees" FOR EACH ROW EXECUTE FUNCTION "public"."log_document_employee_changes"();

CREATE OR REPLACE TRIGGER "document_equipment_changes_trigger" AFTER INSERT OR UPDATE ON "public"."documents_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."log_document_equipment_changes"();

CREATE OR REPLACE TRIGGER "document_update_trigger" AFTER UPDATE OF "state" ON "public"."documents_employees" FOR EACH ROW EXECUTE FUNCTION "public"."notify_document_update"();

CREATE OR REPLACE TRIGGER "equipment_update_trigger" AFTER UPDATE OF "state" ON "public"."documents_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."notify_document_update"();

CREATE OR REPLACE TRIGGER "trg_employees_diagram_changes" AFTER INSERT OR UPDATE ON "public"."employees_diagram" FOR EACH ROW EXECUTE FUNCTION "public"."handle_employees_diagram_changes"();

CREATE OR REPLACE TRIGGER "trg_update_documents_employees" AFTER UPDATE ON "public"."documents_employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_status_trigger"();

CREATE OR REPLACE TRIGGER "trg_update_documents_equipment" AFTER UPDATE ON "public"."documents_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."update_status_trigger"();

CREATE OR REPLACE TRIGGER "trigger_log_repair_changes" AFTER INSERT OR UPDATE ON "public"."repair_solicitudes" FOR EACH ROW EXECUTE FUNCTION "public"."log_repair_changes"();

CREATE OR REPLACE TRIGGER "update_company_by_defect_trigger" AFTER INSERT OR UPDATE OF "by_defect" ON "public"."company" FOR EACH ROW EXECUTE FUNCTION "public"."update_company_by_defect"();

ALTER TABLE ONLY "public"."brand_vehicles"
    ADD CONSTRAINT "brand_vehicles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_covenant_id_fkey" FOREIGN KEY ("covenant_id") REFERENCES "public"."covenant"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."companies_employees"
    ADD CONSTRAINT "companies_employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."companies_employees"
    ADD CONSTRAINT "companies_employees_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_city_fkey" FOREIGN KEY ("city") REFERENCES "public"."cities"("id");

ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profile"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id");

ALTER TABLE ONLY "public"."contractor_employee"
    ADD CONSTRAINT "contractor_employee_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."customers"("id");

ALTER TABLE ONLY "public"."contractor_employee"
    ADD CONSTRAINT "contractor_employee_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."contractor_equipment"
    ADD CONSTRAINT "contractor_equipment_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."customers"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."contractor_equipment"
    ADD CONSTRAINT "contractor_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."vehicles"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."covenant"
    ADD CONSTRAINT "covenant_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."covenant"
    ADD CONSTRAINT "covenant_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."custom_form"
    ADD CONSTRAINT "custom_form_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dailyreportemployeerelations"
    ADD CONSTRAINT "dailyreportemployeerelations_daily_report_row_id_fkey" FOREIGN KEY ("daily_report_row_id") REFERENCES "public"."dailyreportrows"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dailyreportemployeerelations"
    ADD CONSTRAINT "dailyreportemployeerelations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dailyreportequipmentrelations"
    ADD CONSTRAINT "dailyreportequipmentrelations_daily_report_row_id_fkey" FOREIGN KEY ("daily_report_row_id") REFERENCES "public"."dailyreportrows"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dailyreportequipmentrelations"
    ADD CONSTRAINT "dailyreportequipmentrelations_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dailyreportrows"
    ADD CONSTRAINT "dailyreportrows_daily_report_id_fkey" FOREIGN KEY ("daily_report_id") REFERENCES "public"."dailyreport"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."diagrams_logs"
    ADD CONSTRAINT "diagrams_logs_diagram_id_fkey" FOREIGN KEY ("diagram_id") REFERENCES "public"."diagram_type"("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."diagrams_logs"
    ADD CONSTRAINT "diagrams_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."diagrams_logs"
    ADD CONSTRAINT "diagrams_logs_modified_by_fkey" FOREIGN KEY ("modified_by") REFERENCES "public"."profile"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."document_types"
    ADD CONSTRAINT "document_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."documents_company"
    ADD CONSTRAINT "documents_company_applies_fkey" FOREIGN KEY ("applies") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."documents_company"
    ADD CONSTRAINT "documents_company_id_document_types_fkey" FOREIGN KEY ("id_document_types") REFERENCES "public"."document_types"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."documents_company"
    ADD CONSTRAINT "documents_company_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."documents_employees"
    ADD CONSTRAINT "documents_employees_applies_fkey" FOREIGN KEY ("applies") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."documents_employees"
    ADD CONSTRAINT "documents_employees_id_document_types_fkey" FOREIGN KEY ("id_document_types") REFERENCES "public"."document_types"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."documents_employees"
    ADD CONSTRAINT "documents_employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."documents_equipment"
    ADD CONSTRAINT "documents_equipment_applies_fkey" FOREIGN KEY ("applies") REFERENCES "public"."vehicles"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."documents_equipment"
    ADD CONSTRAINT "documents_equipment_id_document_types_fkey" FOREIGN KEY ("id_document_types") REFERENCES "public"."document_types"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."documents_equipment"
    ADD CONSTRAINT "documents_equipment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_birthplace_fkey" FOREIGN KEY ("birthplace") REFERENCES "public"."countries"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id");

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_city_fkey" FOREIGN KEY ("city") REFERENCES "public"."cities"("id");

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_covenants_id_fkey" FOREIGN KEY ("covenants_id") REFERENCES "public"."covenant"("id");

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guild"("id");

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_hierarchical_position_fkey" FOREIGN KEY ("hierarchical_position") REFERENCES "public"."hierarchy"("id");

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_province_fkey" FOREIGN KEY ("province") REFERENCES "public"."provinces"("id");

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_workflow_diagram_fkey" FOREIGN KEY ("workflow_diagram") REFERENCES "public"."work-diagram"("id");

ALTER TABLE ONLY "public"."form_answers"
    ADD CONSTRAINT "form_answers_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."custom_form"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."hired_modules"
    ADD CONSTRAINT "hired_modules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."hired_modules"
    ADD CONSTRAINT "hired_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_role_fkey" FOREIGN KEY ("role") REFERENCES "public"."roles"("name");

ALTER TABLE ONLY "public"."assing_customer"
    ADD CONSTRAINT "public_assing_customer_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");

ALTER TABLE ONLY "public"."assing_customer"
    ADD CONSTRAINT "public_assing_customer_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."vehicles"("id");

ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "public_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id");

ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "public_contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");

ALTER TABLE ONLY "public"."category_employee"
    ADD CONSTRAINT "public_covenant_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id");

ALTER TABLE ONLY "public"."category_employee"
    ADD CONSTRAINT "public_covenant_employee_emplyee_id_fkey" FOREIGN KEY ("emplyee_id") REFERENCES "public"."employees"("id");

ALTER TABLE ONLY "public"."customer_services"
    ADD CONSTRAINT "public_customer_services_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id");

ALTER TABLE ONLY "public"."customer_services"
    ADD CONSTRAINT "public_customer_services_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");

ALTER TABLE ONLY "public"."dailyreport"
    ADD CONSTRAINT "public_dailyreport_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id");

ALTER TABLE ONLY "public"."dailyreportrows"
    ADD CONSTRAINT "public_dailyreportrows_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");

ALTER TABLE ONLY "public"."dailyreportrows"
    ADD CONSTRAINT "public_dailyreportrows_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."service_items"("id");

ALTER TABLE ONLY "public"."dailyreportrows"
    ADD CONSTRAINT "public_dailyreportrows_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."customer_services"("id");

ALTER TABLE ONLY "public"."diagram_type"
    ADD CONSTRAINT "public_diagram_type_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id");

ALTER TABLE ONLY "public"."documents_employees_logs"
    ADD CONSTRAINT "public_documents_employees_logs_documents_employees_id_fkey" FOREIGN KEY ("documents_employees_id") REFERENCES "public"."documents_employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."documents_equipment_logs"
    ADD CONSTRAINT "public_documents_equipment_logs_documents_equipment_id_fkey" FOREIGN KEY ("documents_equipment_id") REFERENCES "public"."documents_equipment"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."employees_diagram"
    ADD CONSTRAINT "public_employees_diagram_diagram_type_fkey" FOREIGN KEY ("diagram_type") REFERENCES "public"."diagram_type"("id");

ALTER TABLE ONLY "public"."employees_diagram"
    ADD CONSTRAINT "public_employees_diagram_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");

ALTER TABLE ONLY "public"."guild"
    ADD CONSTRAINT "public_guild_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id");

ALTER TABLE ONLY "public"."model_vehicles"
    ADD CONSTRAINT "public_model_vehicles_brand_fkey" FOREIGN KEY ("brand") REFERENCES "public"."brand_vehicles"("id");

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "public_notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."service_items"
    ADD CONSTRAINT "public_service_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id");

ALTER TABLE ONLY "public"."service_items"
    ADD CONSTRAINT "public_service_items_costumer_service_id_fkey" FOREIGN KEY ("customer_service_id") REFERENCES "public"."customer_services"("id");

ALTER TABLE ONLY "public"."service_items"
    ADD CONSTRAINT "public_service_items_item_measure_units_fkey" FOREIGN KEY ("item_measure_units") REFERENCES "public"."measure_units"("id");

ALTER TABLE ONLY "public"."share_company_users"
    ADD CONSTRAINT "public_share_company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."share_company_users"
    ADD CONSTRAINT "public_share_company_users_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "public_vehicles_model_fkey" FOREIGN KEY ("model") REFERENCES "public"."model_vehicles"("id");

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "public_vehicles_type_fkey" FOREIGN KEY ("type") REFERENCES "public"."type"("id");

ALTER TABLE ONLY "public"."repair_solicitudes"
    ADD CONSTRAINT "repair_solicitudes_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."repair_solicitudes"
    ADD CONSTRAINT "repair_solicitudes_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."vehicles"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."repair_solicitudes"
    ADD CONSTRAINT "repair_solicitudes_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "public"."profile"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."repair_solicitudes"
    ADD CONSTRAINT "repair_solicitudes_reparation_type_fkey" FOREIGN KEY ("reparation_type") REFERENCES "public"."types_of_repairs"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."repair_solicitudes"
    ADD CONSTRAINT "repair_solicitudes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id");

ALTER TABLE ONLY "public"."repairlogs"
    ADD CONSTRAINT "repairlogs_modified_by_employee_fkey" FOREIGN KEY ("modified_by_employee") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."repairlogs"
    ADD CONSTRAINT "repairlogs_modified_by_user_fkey" FOREIGN KEY ("modified_by_user") REFERENCES "public"."profile"("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."repairlogs"
    ADD CONSTRAINT "reparirlogs_repair_id_fkey" FOREIGN KEY ("repair_id") REFERENCES "public"."repair_solicitudes"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."share_company_users"
    ADD CONSTRAINT "share_company_users_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."share_company_users"
    ADD CONSTRAINT "share_company_users_role_fkey" FOREIGN KEY ("role") REFERENCES "public"."roles"("name") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."type"
    ADD CONSTRAINT "type_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."types_of_repairs"
    ADD CONSTRAINT "types_of_repairs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_brand_fkey" FOREIGN KEY ("brand") REFERENCES "public"."brand_vehicles"("id");

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_type_of_vehicle_fkey" FOREIGN KEY ("type_of_vehicle") REFERENCES "public"."types_of_vehicles"("id");

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON UPDATE CASCADE ON DELETE CASCADE;

CREATE POLICY "Acceso a los autenticados" ON "public"."types_of_repairs" TO "authenticated" USING (true);

CREATE POLICY "Actualizar tipo de de documento" ON "public"."document_types" FOR UPDATE TO "authenticated" USING (true);

CREATE POLICY "Enable acces for users serviceRole" ON "public"."profile" TO "pgsodium_keyiduser", "pgsodium_keyholder", "pgsodium_keymaker", "authenticated", "anon", "service_role", "supabase_replication_admin", "supabase_read_only_user" USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete" ON "public"."notifications" FOR DELETE USING (true);

CREATE POLICY "Enable insert access for all users" ON "public"."notifications" FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."brand_vehicles" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."category" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."company" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."contacts" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."contractor_employee" TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."contractors" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."covenant" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."customer_services" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."documents_company" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."documents_employees" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."documents_equipment" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."employees" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."employees_diagram" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."guild" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."service_items" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."types_of_vehicles" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users onlyS" ON "public"."document_types" FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."brand_vehicles" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."category" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."cities" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."companies_employees" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."company" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."contacts" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."contractor_employee" TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."contractors" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."countries" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."covenant" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."customer_services" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."customers" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."document_types" USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."documents_employees" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."documents_equipment" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."employees" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."employees_diagram" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."guild" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."hierarchy" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."industry_type" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."model_vehicles" TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."notifications" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."profile" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."provinces" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."roles" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."service_items" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."share_company_users" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."types_of_vehicles" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."work-diagram" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all userss" ON "public"."model_vehicles" TO "authenticated";

CREATE POLICY "Enable update for users based on email" ON "public"."documents_company" FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "New Policy Name" ON "public"."employees" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "company"."owner_id"
   FROM "public"."company"
  WHERE ("employees"."company_id" = "employees"."company_id"))));

CREATE POLICY "Permitir Eliminar" ON "public"."documents_equipment" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "Permitir acceso a los autenticados" ON "public"."documents_company" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Permitir autenticados" ON "public"."repair_solicitudes" TO "authenticated" USING (true);

CREATE POLICY "Permitir eliminar" ON "public"."documents_company" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "Permitir eliminar " ON "public"."documents_employees" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "Permitir insert a untenticados" ON "public"."custom_form" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Permitir todo" ON "public"."repairlogs" TO "authenticated" USING (true);

CREATE POLICY "Permitir todo" ON "public"."vehicles" TO "authenticated", "anon" USING (true);

CREATE POLICY "Permitir todo autenticado" ON "public"."type" TO "authenticated" USING (true);

CREATE POLICY "Permitir todos los permisos" ON "public"."handle_errors" TO "authenticated" USING (true);

CREATE POLICY "Policy with security definer functions" ON "public"."diagram_type" TO "authenticated" USING (true);

CREATE POLICY "Policy with security definer functions" ON "public"."employees_diagram" TO "authenticated" USING (true);

CREATE POLICY "Todos los permisos para los dueños de le empresa" ON "public"."employees" TO "authenticated" USING (true);

ALTER TABLE "public"."assing_customer" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."brand_vehicles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."category" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."category_employee" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."cities" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."companies_employees" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."company" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contractor_employee" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contractor_equipment" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contractors" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."countries" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."covenant" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."customer_services" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."dailyreport" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."dailyreportemployeerelations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."dailyreportequipmentrelations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."dailyreportrows" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."diagram_type" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."diagrams_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."document_types" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."documents_company" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."documents_employees" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."documents_equipment" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."employees_diagram" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."form_answers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."guild" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."handle_errors" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."hierarchy" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."hired_modules" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."industry_type" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insertar_y_editar_autenticados" ON "public"."dailyreport" TO "authenticated" USING (true);

CREATE POLICY "insertar_y_editar_fila" ON "public"."dailyreportrows" TO "authenticated" USING (true);

CREATE POLICY "insertar_y_editar_relation_employee" ON "public"."dailyreportemployeerelations" TO "authenticated" USING (true);

CREATE POLICY "insertar_y_editar_relation_equipment" ON "public"."dailyreportequipmentrelations" TO "authenticated" USING (true);

ALTER TABLE "public"."measure_units" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."model_vehicles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permisos" ON "public"."share_company_users" TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "permitir todo" ON "public"."diagrams_logs" TO "authenticated" USING (true);

CREATE POLICY "permitir todo" ON "public"."form_answers" TO "authenticated", "anon" USING (true);

CREATE POLICY "permitir todo" ON "public"."measure_units" TO "authenticated" USING (true);

ALTER TABLE "public"."profile" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."provinces" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."repair_solicitudes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."repairlogs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."service_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."share_company_users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos los permisos" ON "public"."contractor_equipment" TO "authenticated" USING (true);

CREATE POLICY "todos los permisos" ON "public"."custom_form" TO "authenticated" USING (true);

ALTER TABLE "public"."type" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."types_of_repairs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."types_of_vehicles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "update" ON "public"."documents_employees" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "update" ON "public"."documents_equipment" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "update category" ON "public"."category" FOR UPDATE TO "authenticated" USING (true);

CREATE POLICY "update company" ON "public"."company" FOR UPDATE TO "authenticated" USING (true);

CREATE POLICY "update contacts" ON "public"."contacts" FOR UPDATE TO "authenticated" USING (true);

CREATE POLICY "update covenant" ON "public"."covenant" FOR UPDATE TO "authenticated" USING (true);

CREATE POLICY "update customers" ON "public"."customers" FOR UPDATE TO "authenticated" USING (true);

CREATE POLICY "update guild" ON "public"."guild" FOR UPDATE TO "authenticated" USING (true);

CREATE POLICY "update_customer_services" ON "public"."customer_services" FOR UPDATE TO "authenticated" USING (true);

CREATE POLICY "update_services_items" ON "public"."service_items" FOR UPDATE TO "authenticated" USING (true);

ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."work-diagram" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."brand_vehicles";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."category";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."company";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."contacts";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."covenant";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."customer_services";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."customers";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."documents_employees";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."documents_equipment";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."employees";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."guild";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."model_vehicles";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."service_items";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."share_company_users";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."vehicles";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."actualizar_estado_documentos"() TO "anon";
GRANT ALL ON FUNCTION "public"."actualizar_estado_documentos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."actualizar_estado_documentos"() TO "service_role";

GRANT ALL ON FUNCTION "public"."add_new_document"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_new_document"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_new_document"() TO "service_role";

GRANT ALL ON FUNCTION "public"."add_to_companies_employees"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_to_companies_employees"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_to_companies_employees"() TO "service_role";

GRANT ALL ON FUNCTION "public"."create_user_for_external_login"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_for_external_login"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_for_external_login"() TO "service_role";

GRANT ALL ON FUNCTION "public"."deactivate_service_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."deactivate_service_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."deactivate_service_items"() TO "service_role";

GRANT ALL ON FUNCTION "public"."delete_expired_subscriptions"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_expired_subscriptions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_expired_subscriptions"() TO "service_role";

GRANT ALL ON FUNCTION "public"."enviar_documentos_a_46_dias"() TO "anon";
GRANT ALL ON FUNCTION "public"."enviar_documentos_a_46_dias"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enviar_documentos_a_46_dias"() TO "service_role";

GRANT ALL ON FUNCTION "public"."enviar_documentos_vencidos"() TO "anon";
GRANT ALL ON FUNCTION "public"."enviar_documentos_vencidos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enviar_documentos_vencidos"() TO "service_role";

GRANT ALL ON FUNCTION "public"."equipment_allocated_to"() TO "anon";
GRANT ALL ON FUNCTION "public"."equipment_allocated_to"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."equipment_allocated_to"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_employees_diagram_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_employees_diagram_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_employees_diagram_changes"() TO "service_role";

GRANT ALL ON FUNCTION "public"."log_document_employee_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_document_employee_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_document_employee_changes"() TO "service_role";

GRANT ALL ON FUNCTION "public"."log_document_equipment_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_document_equipment_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_document_equipment_changes"() TO "service_role";

GRANT ALL ON FUNCTION "public"."log_repair_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_repair_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_repair_changes"() TO "service_role";

GRANT ALL ON FUNCTION "public"."migrate_document"("target_id" "uuid", "execute_migration" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_document"("target_id" "uuid", "execute_migration" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_document"("target_id" "uuid", "execute_migration" boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."migrate_documents_preview"() TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_documents_preview"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_documents_preview"() TO "service_role";

GRANT ALL ON FUNCTION "public"."notify_document_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_document_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_document_update"() TO "service_role";

GRANT ALL ON FUNCTION "public"."obtener_documentos_por_vencer"() TO "anon";
GRANT ALL ON FUNCTION "public"."obtener_documentos_por_vencer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."obtener_documentos_por_vencer"() TO "service_role";

GRANT ALL ON FUNCTION "public"."pruebaemail"() TO "anon";
GRANT ALL ON FUNCTION "public"."pruebaemail"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."pruebaemail"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_company_by_defect"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_company_by_defect"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_company_by_defect"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_status_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_status_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_status_trigger"() TO "service_role";

GRANT ALL ON FUNCTION "public"."verificar_documentos_vencidos_prueba"() TO "anon";
GRANT ALL ON FUNCTION "public"."verificar_documentos_vencidos_prueba"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."verificar_documentos_vencidos_prueba"() TO "service_role";

GRANT ALL ON TABLE "public"."assing_customer" TO "anon";
GRANT ALL ON TABLE "public"."assing_customer" TO "authenticated";
GRANT ALL ON TABLE "public"."assing_customer" TO "service_role";

GRANT ALL ON SEQUENCE "public"."assing_customer_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."assing_customer_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."assing_customer_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."brand_vehicles" TO "anon";
GRANT ALL ON TABLE "public"."brand_vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."brand_vehicles" TO "service_role";

GRANT ALL ON SEQUENCE "public"."brand_vehicles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."brand_vehicles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."brand_vehicles_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."category" TO "anon";
GRANT ALL ON TABLE "public"."category" TO "authenticated";
GRANT ALL ON TABLE "public"."category" TO "service_role";

GRANT ALL ON TABLE "public"."category_employee" TO "anon";
GRANT ALL ON TABLE "public"."category_employee" TO "authenticated";
GRANT ALL ON TABLE "public"."category_employee" TO "service_role";

GRANT ALL ON TABLE "public"."cities" TO "anon";
GRANT ALL ON TABLE "public"."cities" TO "authenticated";
GRANT ALL ON TABLE "public"."cities" TO "service_role";

GRANT ALL ON SEQUENCE "public"."citys_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."citys_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."citys_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."companies_employees" TO "anon";
GRANT ALL ON TABLE "public"."companies_employees" TO "authenticated";
GRANT ALL ON TABLE "public"."companies_employees" TO "service_role";

GRANT ALL ON TABLE "public"."company" TO "anon";
GRANT ALL ON TABLE "public"."company" TO "authenticated";
GRANT ALL ON TABLE "public"."company" TO "service_role";

GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";

GRANT ALL ON TABLE "public"."contractor_employee" TO "anon";
GRANT ALL ON TABLE "public"."contractor_employee" TO "authenticated";
GRANT ALL ON TABLE "public"."contractor_employee" TO "service_role";

GRANT ALL ON TABLE "public"."contractor_equipment" TO "anon";
GRANT ALL ON TABLE "public"."contractor_equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."contractor_equipment" TO "service_role";

GRANT ALL ON TABLE "public"."contractors" TO "anon";
GRANT ALL ON TABLE "public"."contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."contractors" TO "service_role";

GRANT ALL ON TABLE "public"."countries" TO "anon";
GRANT ALL ON TABLE "public"."countries" TO "authenticated";
GRANT ALL ON TABLE "public"."countries" TO "service_role";

GRANT ALL ON TABLE "public"."covenant" TO "anon";
GRANT ALL ON TABLE "public"."covenant" TO "authenticated";
GRANT ALL ON TABLE "public"."covenant" TO "service_role";

GRANT ALL ON TABLE "public"."custom_form" TO "anon";
GRANT ALL ON TABLE "public"."custom_form" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_form" TO "service_role";

GRANT ALL ON TABLE "public"."customer_services" TO "anon";
GRANT ALL ON TABLE "public"."customer_services" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_services" TO "service_role";

GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";

GRANT ALL ON TABLE "public"."dailyreport" TO "anon";
GRANT ALL ON TABLE "public"."dailyreport" TO "authenticated";
GRANT ALL ON TABLE "public"."dailyreport" TO "service_role";

GRANT ALL ON TABLE "public"."dailyreportemployeerelations" TO "anon";
GRANT ALL ON TABLE "public"."dailyreportemployeerelations" TO "authenticated";
GRANT ALL ON TABLE "public"."dailyreportemployeerelations" TO "service_role";

GRANT ALL ON TABLE "public"."dailyreportequipmentrelations" TO "anon";
GRANT ALL ON TABLE "public"."dailyreportequipmentrelations" TO "authenticated";
GRANT ALL ON TABLE "public"."dailyreportequipmentrelations" TO "service_role";

GRANT ALL ON TABLE "public"."dailyreportrows" TO "anon";
GRANT ALL ON TABLE "public"."dailyreportrows" TO "authenticated";
GRANT ALL ON TABLE "public"."dailyreportrows" TO "service_role";

GRANT ALL ON TABLE "public"."diagram_type" TO "anon";
GRANT ALL ON TABLE "public"."diagram_type" TO "authenticated";
GRANT ALL ON TABLE "public"."diagram_type" TO "service_role";

GRANT ALL ON TABLE "public"."diagrams_logs" TO "anon";
GRANT ALL ON TABLE "public"."diagrams_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."diagrams_logs" TO "service_role";

GRANT ALL ON TABLE "public"."document_types" TO "anon";
GRANT ALL ON TABLE "public"."document_types" TO "authenticated";
GRANT ALL ON TABLE "public"."document_types" TO "service_role";

GRANT ALL ON TABLE "public"."documents_company" TO "anon";
GRANT ALL ON TABLE "public"."documents_company" TO "authenticated";
GRANT ALL ON TABLE "public"."documents_company" TO "service_role";

GRANT ALL ON TABLE "public"."documents_employees" TO "anon";
GRANT ALL ON TABLE "public"."documents_employees" TO "authenticated";
GRANT ALL ON TABLE "public"."documents_employees" TO "service_role";

GRANT ALL ON TABLE "public"."documents_employees_logs" TO "anon";
GRANT ALL ON TABLE "public"."documents_employees_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."documents_employees_logs" TO "service_role";

GRANT ALL ON SEQUENCE "public"."documents_employees_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."documents_employees_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."documents_employees_logs_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."documents_equipment" TO "anon";
GRANT ALL ON TABLE "public"."documents_equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."documents_equipment" TO "service_role";

GRANT ALL ON TABLE "public"."documents_equipment_logs" TO "anon";
GRANT ALL ON TABLE "public"."documents_equipment_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."documents_equipment_logs" TO "service_role";

GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";

GRANT ALL ON TABLE "public"."employees_diagram" TO "anon";
GRANT ALL ON TABLE "public"."employees_diagram" TO "authenticated";
GRANT ALL ON TABLE "public"."employees_diagram" TO "service_role";

GRANT ALL ON TABLE "public"."form_answers" TO "anon";
GRANT ALL ON TABLE "public"."form_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."form_answers" TO "service_role";

GRANT ALL ON TABLE "public"."guild" TO "anon";
GRANT ALL ON TABLE "public"."guild" TO "authenticated";
GRANT ALL ON TABLE "public"."guild" TO "service_role";

GRANT ALL ON TABLE "public"."handle_errors" TO "anon";
GRANT ALL ON TABLE "public"."handle_errors" TO "authenticated";
GRANT ALL ON TABLE "public"."handle_errors" TO "service_role";

GRANT ALL ON SEQUENCE "public"."handle_errors_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."handle_errors_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."handle_errors_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."hierarchy" TO "anon";
GRANT ALL ON TABLE "public"."hierarchy" TO "authenticated";
GRANT ALL ON TABLE "public"."hierarchy" TO "service_role";

GRANT ALL ON TABLE "public"."hired_modules" TO "anon";
GRANT ALL ON TABLE "public"."hired_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."hired_modules" TO "service_role";

GRANT ALL ON TABLE "public"."industry_type" TO "anon";
GRANT ALL ON TABLE "public"."industry_type" TO "authenticated";
GRANT ALL ON TABLE "public"."industry_type" TO "service_role";

GRANT ALL ON SEQUENCE "public"."industry_type_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."industry_type_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."industry_type_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."measure_units" TO "anon";
GRANT ALL ON TABLE "public"."measure_units" TO "authenticated";
GRANT ALL ON TABLE "public"."measure_units" TO "service_role";

GRANT ALL ON SEQUENCE "public"."measure_units_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."measure_units_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."measure_units_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."model_vehicles" TO "anon";
GRANT ALL ON TABLE "public"."model_vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."model_vehicles" TO "service_role";

GRANT ALL ON SEQUENCE "public"."model_vehicles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."model_vehicles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."model_vehicles_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";

GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";

GRANT ALL ON TABLE "public"."profile" TO "anon";
GRANT ALL ON TABLE "public"."profile" TO "authenticated";
GRANT ALL ON TABLE "public"."profile" TO "service_role";

GRANT ALL ON TABLE "public"."provinces" TO "anon";
GRANT ALL ON TABLE "public"."provinces" TO "authenticated";
GRANT ALL ON TABLE "public"."provinces" TO "service_role";

GRANT ALL ON SEQUENCE "public"."provinces_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."provinces_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."provinces_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."repair_solicitudes" TO "anon";
GRANT ALL ON TABLE "public"."repair_solicitudes" TO "authenticated";
GRANT ALL ON TABLE "public"."repair_solicitudes" TO "service_role";

GRANT ALL ON TABLE "public"."repairlogs" TO "anon";
GRANT ALL ON TABLE "public"."repairlogs" TO "authenticated";
GRANT ALL ON TABLE "public"."repairlogs" TO "service_role";

GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";

GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."service_items" TO "anon";
GRANT ALL ON TABLE "public"."service_items" TO "authenticated";
GRANT ALL ON TABLE "public"."service_items" TO "service_role";

GRANT ALL ON TABLE "public"."share_company_users" TO "anon";
GRANT ALL ON TABLE "public"."share_company_users" TO "authenticated";
GRANT ALL ON TABLE "public"."share_company_users" TO "service_role";

GRANT ALL ON TABLE "public"."storage_migrations" TO "anon";
GRANT ALL ON TABLE "public"."storage_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."storage_migrations" TO "service_role";

GRANT ALL ON TABLE "public"."type" TO "anon";
GRANT ALL ON TABLE "public"."type" TO "authenticated";
GRANT ALL ON TABLE "public"."type" TO "service_role";

GRANT ALL ON TABLE "public"."types_of_repairs" TO "anon";
GRANT ALL ON TABLE "public"."types_of_repairs" TO "authenticated";
GRANT ALL ON TABLE "public"."types_of_repairs" TO "service_role";

GRANT ALL ON TABLE "public"."types_of_vehicles" TO "anon";
GRANT ALL ON TABLE "public"."types_of_vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."types_of_vehicles" TO "service_role";

GRANT ALL ON SEQUENCE "public"."types_of_vehicles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."types_of_vehicles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."types_of_vehicles_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";

GRANT ALL ON TABLE "public"."work-diagram" TO "anon";
GRANT ALL ON TABLE "public"."work-diagram" TO "authenticated";
GRANT ALL ON TABLE "public"."work-diagram" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
