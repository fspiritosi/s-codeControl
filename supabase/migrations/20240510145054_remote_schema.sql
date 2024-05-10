
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

CREATE TYPE "public"."document_applies" AS ENUM (
    'Persona',
    'Equipos'
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
    'Fin de contrato'
);

ALTER TYPE "public"."reason_for_termination_enum" OWNER TO "postgres";

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
    'No avalado'
);

ALTER TYPE "public"."status_type" OWNER TO "postgres";

CREATE TYPE "public"."type_of_contract_enum" AS ENUM (
    'Período de prueba',
    'A tiempo indeterminado',
    'Plazo fijo'
);

ALTER TYPE "public"."type_of_contract_enum" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."actualizar_estado_documentos"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
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

ALTER FUNCTION "public"."actualizar_estado_documentos"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."add_to_companies_employees"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  contractor_id UUID;
BEGIN
  -- Insertar en companies_employees
  INSERT INTO companies_employees (company_id, employee_id)
  VALUES (NEW.company_id, NEW.id);

  -- Insertar en contractor_employee para cada ID en allocated_to
  FOREACH contractor_id IN ARRAY NEW.allocated_to
  LOOP
    INSERT INTO contractor_employee (contractor_id, employee_id)
    VALUES (contractor_id, NEW.id);
  END LOOP;

  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."add_to_companies_employees"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."create_user_for_external_login"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  IF NEW.raw_user_meta_data <> '{}'::jsonb THEN
    INSERT INTO public.profile (id, fullname, email, credential_id, avatar)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'email',
      NEW.id,
      NEW.raw_user_meta_data->>'avatar_url'
    );
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."create_user_for_external_login"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."enviar_correos_documentos_a_vencer"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$DECLARE
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
END;$$;

ALTER FUNCTION "public"."enviar_correos_documentos_a_vencer"() OWNER TO "postgres";

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

CREATE TABLE IF NOT EXISTS "public"."brand_vehicles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text"
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

CREATE TABLE IF NOT EXISTS "public"."contractor_employee" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "employee_id" "uuid",
    "contractor_id" "uuid"
);

ALTER TABLE "public"."contractor_employee" OWNER TO "postgres";

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
    "company_id" "uuid"
);

ALTER TABLE "public"."document_types" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."documents_employees" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_document_types" "uuid",
    "validity" "text",
    "state" "public"."state" DEFAULT 'pendiente'::"public"."state" NOT NULL,
    "is_active" boolean DEFAULT true,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "applies" "uuid",
    "deny_reason" "text",
    "document_path" "text"
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
    "validity" "text",
    "state" "public"."state" DEFAULT 'pendiente'::"public"."state",
    "is_active" boolean DEFAULT true,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "deny_reason" "text",
    "document_path" "text"
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
    "status" "public"."status_type" DEFAULT 'No avalado'::"public"."status_type"
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

CREATE TABLE IF NOT EXISTS "public"."hierarchy" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL
);

ALTER TABLE "public"."hierarchy" OWNER TO "postgres";

COMMENT ON TABLE "public"."hierarchy" IS 'Puestos Jerarquicos';

CREATE TABLE IF NOT EXISTS "public"."industry_type" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text"
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

CREATE TABLE IF NOT EXISTS "public"."model_vehicles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "brand" bigint
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
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "credential_id" "uuid",
    "email" "text",
    "avatar" "text",
    "fullname" "text",
    "role" "text" DEFAULT 'User'::"text"
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

CREATE TABLE IF NOT EXISTS "public"."share_company_users" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid" DEFAULT "gen_random_uuid"(),
    "company_id" "uuid" DEFAULT "gen_random_uuid"(),
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text"
);

ALTER TABLE "public"."share_company_users" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."type" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text"
);

ALTER TABLE "public"."type" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."types_of_vehicles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text"
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
    "status" "public"."status_type" DEFAULT 'No avalado'::"public"."status_type",
    "allocated_to" "uuid"[]
);

ALTER TABLE "public"."vehicles" OWNER TO "postgres";

COMMENT ON COLUMN "public"."vehicles"."company_id" IS 'id de company';

CREATE TABLE IF NOT EXISTS "public"."work-diagram" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL
);

ALTER TABLE "public"."work-diagram" OWNER TO "postgres";

ALTER TABLE ONLY "public"."documents_employees_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."documents_employees_logs_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."brand_vehicles"
    ADD CONSTRAINT "brand_vehicles_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."brand_vehicles"
    ADD CONSTRAINT "brand_vehicles_pkey" PRIMARY KEY ("id");

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

ALTER TABLE ONLY "public"."contractors"
    ADD CONSTRAINT "contractor-companies_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contractor_employee"
    ADD CONSTRAINT "contractor_employee_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."document_types"
    ADD CONSTRAINT "document_types_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."document_types"
    ADD CONSTRAINT "document_types_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."documents_employees"
    ADD CONSTRAINT "documents_employees_docoment_path_key" UNIQUE ("document_path");

ALTER TABLE ONLY "public"."documents_employees_logs"
    ADD CONSTRAINT "documents_employees_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."documents_equipment"
    ADD CONSTRAINT "documents_equipment_document_path_key" UNIQUE ("document_path");

ALTER TABLE ONLY "public"."documents_equipment_logs"
    ADD CONSTRAINT "documents_equipment_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."documents_equipment"
    ADD CONSTRAINT "documents_equipment_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."documents_employees"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."hierarchy"
    ADD CONSTRAINT "hierarchy_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."industry_type"
    ADD CONSTRAINT "industry_type_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."industry_type"
    ADD CONSTRAINT "industry_type_type_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."model_vehicles"
    ADD CONSTRAINT "model_vehicles_pkey" PRIMARY KEY ("id");

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

ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."share_company_users"
    ADD CONSTRAINT "share_company_users_id2_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."share_company_users"
    ADD CONSTRAINT "share_company_users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."type"
    ADD CONSTRAINT "type_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."types_of_vehicles"
    ADD CONSTRAINT "types_of_vehicles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_id2_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."work-diagram"
    ADD CONSTRAINT "work-diagram_pkey" PRIMARY KEY ("id");

CREATE INDEX "cities_province_id_idx" ON "public"."cities" USING "btree" ("province_id");

CREATE INDEX "companies_employees_company_id_idx" ON "public"."companies_employees" USING "btree" ("company_id");

CREATE INDEX "companies_employees_employee_id_idx" ON "public"."companies_employees" USING "btree" ("employee_id");

CREATE OR REPLACE TRIGGER "after_employee_insert" AFTER INSERT ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."add_to_companies_employees"();

CREATE OR REPLACE TRIGGER "document_employee_changes_trigger" AFTER INSERT OR UPDATE ON "public"."documents_employees" FOR EACH ROW EXECUTE FUNCTION "public"."log_document_employee_changes"();

CREATE OR REPLACE TRIGGER "document_equipment_changes_trigger" AFTER INSERT OR UPDATE ON "public"."documents_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."log_document_equipment_changes"();

CREATE OR REPLACE TRIGGER "document_update_trigger" AFTER UPDATE OF "state" ON "public"."documents_employees" FOR EACH ROW EXECUTE FUNCTION "public"."notify_document_update"();

CREATE OR REPLACE TRIGGER "equipment_update_trigger" AFTER UPDATE OF "state" ON "public"."documents_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."notify_document_update"();

CREATE OR REPLACE TRIGGER "update_company_by_defect_trigger" AFTER INSERT OR UPDATE OF "by_defect" ON "public"."company" FOR EACH ROW EXECUTE FUNCTION "public"."update_company_by_defect"();

ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."companies_employees"
    ADD CONSTRAINT "companies_employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."companies_employees"
    ADD CONSTRAINT "companies_employees_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_city_fkey" FOREIGN KEY ("city") REFERENCES "public"."cities"("id");

ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profile"("id");

ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id");

ALTER TABLE ONLY "public"."contractor_employee"
    ADD CONSTRAINT "contractor_employee_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."contractor_employee"
    ADD CONSTRAINT "contractor_employee_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."document_types"
    ADD CONSTRAINT "document_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

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
    ADD CONSTRAINT "employees_city_fkey" FOREIGN KEY ("city") REFERENCES "public"."cities"("id");

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_hierarchical_position_fkey" FOREIGN KEY ("hierarchical_position") REFERENCES "public"."hierarchy"("id");

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_province_fkey" FOREIGN KEY ("province") REFERENCES "public"."provinces"("id");

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_workflow_diagram_fkey" FOREIGN KEY ("workflow_diagram") REFERENCES "public"."work-diagram"("id");

ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_role_fkey" FOREIGN KEY ("role") REFERENCES "public"."roles"("name");

ALTER TABLE ONLY "public"."documents_employees_logs"
    ADD CONSTRAINT "public_documents_employees_logs_documents_employees_id_fkey" FOREIGN KEY ("documents_employees_id") REFERENCES "public"."documents_employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."documents_equipment_logs"
    ADD CONSTRAINT "public_documents_equipment_logs_documents_equipment_id_fkey" FOREIGN KEY ("documents_equipment_id") REFERENCES "public"."documents_equipment"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."model_vehicles"
    ADD CONSTRAINT "public_model_vehicles_brand_fkey" FOREIGN KEY ("brand") REFERENCES "public"."brand_vehicles"("id");

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "public_notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."share_company_users"
    ADD CONSTRAINT "public_share_company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."share_company_users"
    ADD CONSTRAINT "public_share_company_users_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "public_vehicles_model_fkey" FOREIGN KEY ("model") REFERENCES "public"."model_vehicles"("id");

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "public_vehicles_type_fkey" FOREIGN KEY ("type") REFERENCES "public"."type"("id");

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "public_vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id");

ALTER TABLE ONLY "public"."share_company_users"
    ADD CONSTRAINT "share_company_users_role_fkey" FOREIGN KEY ("role") REFERENCES "public"."roles"("name") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_brand_fkey" FOREIGN KEY ("brand") REFERENCES "public"."brand_vehicles"("id");

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_type_of_vehicle_fkey" FOREIGN KEY ("type_of_vehicle") REFERENCES "public"."types_of_vehicles"("id");

CREATE POLICY "Enable acces for users serviceRole" ON "public"."profile" TO "pgsodium_keyiduser", "pgsodium_keyholder", "pgsodium_keymaker", "authenticated", "anon", "service_role", "supabase_replication_admin", "supabase_read_only_user" USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete" ON "public"."notifications" FOR DELETE USING (true);

CREATE POLICY "Enable insert access for all users" ON "public"."notifications" FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."brand_vehicles" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."contractor_employee" TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."contractors" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."documents_employees" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."documents_equipment" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."employees" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."types_of_vehicles" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users onlyS" ON "public"."document_types" FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."brand_vehicles" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."cities" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."companies_employees" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."company" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."contractor_employee" TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."contractors" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."countries" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."document_types" USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."documents_employees" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."documents_equipment" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."employees" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."hierarchy" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."industry_type" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."model_vehicles" TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."notifications" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."profile" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."provinces" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."roles" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."share_company_users" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."type" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."types_of_vehicles" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."vehicles" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."work-diagram" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all userss" ON "public"."model_vehicles" TO "authenticated";

CREATE POLICY "New Policy Name" ON "public"."employees" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "company"."owner_id"
   FROM "public"."company"
  WHERE ("employees"."company_id" = "employees"."company_id"))));

CREATE POLICY "Todos los permisos para los dueños de le empresa" ON "public"."employees" TO "authenticated" USING (true);

CREATE POLICY "Users can create a company." ON "public"."company" FOR INSERT TO "anon" WITH CHECK (("auth"."uid"() = "owner_id"));

ALTER TABLE "public"."brand_vehicles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."cities" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."companies_employees" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."company" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contractor_employee" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contractors" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."countries" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."document_types" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."documents_employees" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."documents_equipment" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."hierarchy" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."industry_type" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_company" ON "public"."company" USING (("auth"."uid"() = "owner_id"));

ALTER TABLE "public"."model_vehicles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permisos" ON "public"."share_company_users" TO "authenticated" USING (true) WITH CHECK (true);

ALTER TABLE "public"."profile" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."provinces" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."share_company_users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."type" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."types_of_vehicles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "update" ON "public"."documents_employees" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "update" ON "public"."documents_equipment" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "update_vehicles" ON "public"."vehicles" USING (("auth"."uid"() = "user_id"));

ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."work-diagram" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."brand_vehicles";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."company";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."documents_employees";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."documents_equipment";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."employees";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."model_vehicles";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."share_company_users";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."vehicles";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."actualizar_estado_documentos"() TO "anon";
GRANT ALL ON FUNCTION "public"."actualizar_estado_documentos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."actualizar_estado_documentos"() TO "service_role";

GRANT ALL ON FUNCTION "public"."add_to_companies_employees"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_to_companies_employees"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_to_companies_employees"() TO "service_role";

GRANT ALL ON FUNCTION "public"."create_user_for_external_login"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_for_external_login"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_for_external_login"() TO "service_role";

GRANT ALL ON FUNCTION "public"."enviar_correos_documentos_a_vencer"() TO "anon";
GRANT ALL ON FUNCTION "public"."enviar_correos_documentos_a_vencer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enviar_correos_documentos_a_vencer"() TO "service_role";

GRANT ALL ON FUNCTION "public"."log_document_employee_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_document_employee_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_document_employee_changes"() TO "service_role";

GRANT ALL ON FUNCTION "public"."log_document_equipment_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_document_equipment_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_document_equipment_changes"() TO "service_role";

GRANT ALL ON FUNCTION "public"."notify_document_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_document_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_document_update"() TO "service_role";

GRANT ALL ON FUNCTION "public"."obtener_documentos_por_vencer"() TO "anon";
GRANT ALL ON FUNCTION "public"."obtener_documentos_por_vencer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."obtener_documentos_por_vencer"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_company_by_defect"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_company_by_defect"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_company_by_defect"() TO "service_role";

GRANT ALL ON FUNCTION "public"."verificar_documentos_vencidos_prueba"() TO "anon";
GRANT ALL ON FUNCTION "public"."verificar_documentos_vencidos_prueba"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."verificar_documentos_vencidos_prueba"() TO "service_role";

GRANT ALL ON TABLE "public"."brand_vehicles" TO "anon";
GRANT ALL ON TABLE "public"."brand_vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."brand_vehicles" TO "service_role";

GRANT ALL ON SEQUENCE "public"."brand_vehicles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."brand_vehicles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."brand_vehicles_id_seq" TO "service_role";

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

GRANT ALL ON TABLE "public"."contractor_employee" TO "anon";
GRANT ALL ON TABLE "public"."contractor_employee" TO "authenticated";
GRANT ALL ON TABLE "public"."contractor_employee" TO "service_role";

GRANT ALL ON TABLE "public"."contractors" TO "anon";
GRANT ALL ON TABLE "public"."contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."contractors" TO "service_role";

GRANT ALL ON TABLE "public"."countries" TO "anon";
GRANT ALL ON TABLE "public"."countries" TO "authenticated";
GRANT ALL ON TABLE "public"."countries" TO "service_role";

GRANT ALL ON TABLE "public"."document_types" TO "anon";
GRANT ALL ON TABLE "public"."document_types" TO "authenticated";
GRANT ALL ON TABLE "public"."document_types" TO "service_role";

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

GRANT ALL ON TABLE "public"."hierarchy" TO "anon";
GRANT ALL ON TABLE "public"."hierarchy" TO "authenticated";
GRANT ALL ON TABLE "public"."hierarchy" TO "service_role";

GRANT ALL ON TABLE "public"."industry_type" TO "anon";
GRANT ALL ON TABLE "public"."industry_type" TO "authenticated";
GRANT ALL ON TABLE "public"."industry_type" TO "service_role";

GRANT ALL ON SEQUENCE "public"."industry_type_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."industry_type_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."industry_type_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."model_vehicles" TO "anon";
GRANT ALL ON TABLE "public"."model_vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."model_vehicles" TO "service_role";

GRANT ALL ON SEQUENCE "public"."model_vehicles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."model_vehicles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."model_vehicles_id_seq" TO "service_role";

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

GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";

GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."share_company_users" TO "anon";
GRANT ALL ON TABLE "public"."share_company_users" TO "authenticated";
GRANT ALL ON TABLE "public"."share_company_users" TO "service_role";

GRANT ALL ON TABLE "public"."type" TO "anon";
GRANT ALL ON TABLE "public"."type" TO "authenticated";
GRANT ALL ON TABLE "public"."type" TO "service_role";

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
