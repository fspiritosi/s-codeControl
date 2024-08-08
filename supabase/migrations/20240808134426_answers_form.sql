drop policy "Enable read access for all users" on "public"."custom_form";

alter table "public"."customers" drop constraint "customers_client_email_key";

alter table "public"."customers" drop constraint "customers_client_phone_key";

alter table "public"."documents_employees" drop constraint "documents_employees_document_path_key";

drop index if exists "public"."customers_client_email_key";

drop index if exists "public"."customers_client_phone_key";

drop index if exists "public"."documents_employees_document_path_key";

create table "public"."category" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "covenant_id" uuid,
    "name" text,
    "is_active" boolean default true
);


alter table "public"."category" enable row level security;

create table "public"."category_employee" (
    "created_at" timestamp with time zone not null default now(),
    "category_id" uuid,
    "emplyee_id" uuid,
    "id" uuid not null default gen_random_uuid()
);


alter table "public"."category_employee" enable row level security;

create table "public"."covenant" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text,
    "company_id" uuid,
    "is_active" boolean default true,
    "guild_id" uuid
);


alter table "public"."covenant" enable row level security;

create table "public"."form_answers" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "form_id" uuid not null,
    "answer" json not null
);


alter table "public"."form_answers" enable row level security;

create table "public"."guild" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text,
    "company_id" uuid,
    "is_active" boolean not null default true
);


alter table "public"."guild" enable row level security;

alter table "public"."contacts" add column "reason_for_termination" text;

alter table "public"."contacts" add column "termination_date" date;

alter table "public"."customers" add column "reason_for_termination" text;

alter table "public"."customers" add column "termination_date" date;

alter table "public"."employees" add column "category" uuid;

alter table "public"."employees" add column "covenants" uuid;

alter table "public"."employees" add column "guild" uuid;

alter table "public"."share_company_users" add column "customer_id" uuid;

CREATE UNIQUE INDEX category_employee_created_at_key ON public.category_employee USING btree (created_at);

CREATE UNIQUE INDEX category_employee_pkey ON public.category_employee USING btree (id);

CREATE UNIQUE INDEX category_pkey ON public.category USING btree (id);

CREATE UNIQUE INDEX covenant_pkey ON public.covenant USING btree (id);

CREATE UNIQUE INDEX form_answers_pkey ON public.form_answers USING btree (id);

CREATE UNIQUE INDEX guild_pkey ON public.guild USING btree (id);

alter table "public"."category" add constraint "category_pkey" PRIMARY KEY using index "category_pkey";

alter table "public"."category_employee" add constraint "category_employee_pkey" PRIMARY KEY using index "category_employee_pkey";

alter table "public"."covenant" add constraint "covenant_pkey" PRIMARY KEY using index "covenant_pkey";

alter table "public"."form_answers" add constraint "form_answers_pkey" PRIMARY KEY using index "form_answers_pkey";

alter table "public"."guild" add constraint "guild_pkey" PRIMARY KEY using index "guild_pkey";

alter table "public"."category" add constraint "public_category_covenant_id_fkey" FOREIGN KEY (covenant_id) REFERENCES covenant(id) not valid;

alter table "public"."category" validate constraint "public_category_covenant_id_fkey";

alter table "public"."category_employee" add constraint "category_employee_created_at_key" UNIQUE using index "category_employee_created_at_key";

alter table "public"."category_employee" add constraint "public_covenant_category_category_id_fkey" FOREIGN KEY (category_id) REFERENCES category(id) not valid;

alter table "public"."category_employee" validate constraint "public_covenant_category_category_id_fkey";

alter table "public"."category_employee" add constraint "public_covenant_employee_emplyee_id_fkey" FOREIGN KEY (emplyee_id) REFERENCES employees(id) not valid;

alter table "public"."category_employee" validate constraint "public_covenant_employee_emplyee_id_fkey";

alter table "public"."covenant" add constraint "public_covenant_guild_id_fkey" FOREIGN KEY (guild_id) REFERENCES guild(id) not valid;

alter table "public"."covenant" validate constraint "public_covenant_guild_id_fkey";

alter table "public"."employees" add constraint "public_employees_category_fkey" FOREIGN KEY (category) REFERENCES category(id) not valid;

alter table "public"."employees" validate constraint "public_employees_category_fkey";

alter table "public"."employees" add constraint "public_employees_covenants_fkey" FOREIGN KEY (covenants) REFERENCES covenant(id) not valid;

alter table "public"."employees" validate constraint "public_employees_covenants_fkey";

alter table "public"."employees" add constraint "public_employees_guild_fkey" FOREIGN KEY (guild) REFERENCES guild(id) not valid;

alter table "public"."employees" validate constraint "public_employees_guild_fkey";

alter table "public"."form_answers" add constraint "form_answers_form_id_fkey" FOREIGN KEY (form_id) REFERENCES custom_form(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."form_answers" validate constraint "form_answers_form_id_fkey";

alter table "public"."guild" add constraint "public_guild_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) not valid;

alter table "public"."guild" validate constraint "public_guild_company_id_fkey";

alter table "public"."share_company_users" add constraint "share_company_users_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."share_company_users" validate constraint "share_company_users_customer_id_fkey";

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

CREATE OR REPLACE FUNCTION public.enviar_documentos_a_46_dias()
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
            <!DOCTYPE html PUBLIC >
            <html lang="es">
            <head>
                <meta content="text/html; charset=UTF-8"/>
            </head>
            <body style="background-color:#f3f3f5;font-family:HelveticaNeue,Helvetica,Arial,sans-serif">
                <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:100%;width:680px;margin:0 auto;background-color:#ffffff">
                    <tbody>
                        <tr style="width:100%">
                            <td>
                                <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="border-radius:0px 0px 0 0;display:flex;flex-direciont:column;background-color:#2b2d6e">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                                                    <tbody style="width:100%">
                                                        <tr style="width:100%">
                                                            <td style="padding:20px 30px 15px">
                                                                <h1 style="color:#fff;font-size:27px;font-weight:bold;line-height:27px">Codecontrol</h1>
                                                                <p style="font-size:17px;line-height:24px;margin:16px 0;color:#fff">Documentos a Vencer en los próximos 45 días</p>
                                                            </td>
                                                            <td  style="padding:30px 10px"><img src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/24417298440.png" style="display:block;outline:none;border:none;text-decoration:none;max-width:100%" width="140" /></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="padding:30px 30px 40px 30px">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <h2 style="margin:0 0 15px;font-weight:bold;font-size:21px;line-height:21px;color:#0c0d0e">Listado de Documentos de la compañia ' || nombre_compania || '</h2>
                                                
                                                <hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin:30px 0" />
                                                
                                                <ul>' || array_to_string(documentos_usuario,'<br>') || '</ul>
                                                
                                                <hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin:30px 0" />
                                                <h2 style="margin:0 0 15px;font-weight:bold;font-size:21px;line-height:21px;color:#0c0d0e">Para ver los documentos diríjase a la app</h2>
                                                <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin-top:24px;display:block">
                                                    <tbody>
                                                        <tr>
                                                            <td><a href="https://codecontrol.com.ar/dashboard" style="color:#fff;text-decoration:none;background-color:#0095ff;border:1px solid #0077cc;font-size:17px;line-height:17px;padding:13px 17px;border-radius:4px;max-width:120px" target="_blank">ir a CodeControl</a></td>
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
        
    END LOOP;
END;$function$
;

CREATE OR REPLACE FUNCTION public.enviar_documentos_vencidos()
 RETURNS void
 LANGUAGE plpgsql
AS $function$DECLARE
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
        -- Inicializar el contenido del correo electrónico para el destinatario actual
        contenido := '';

    SELECT c.company_name
        INTO nombre_compania
        FROM company c
        JOIN share_company_users scu ON c.id = scu.company_id
        JOIN profile p ON scu.profile_id = p.id
        WHERE p.email = destinatario;
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
                AND TO_DATE(de.validity, 'DD-MM-YYYY') = DATE_TRUNC('day', CURRENT_DATE)
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
                AND TO_DATE(de.validity, 'DD-MM-YYYY') = DATE_TRUNC('day', CURRENT_DATE)
                AND profile.email = destinatario
        ) AS documentos;

        -- Construir el contenido del correo electrónico con el HTML proporcionado
        contenido := '
            <!DOCTYPE html PUBLIC >
            <html lang="es">
            <head>
                <meta content="text/html; charset=UTF-8"/>
            </head>
            <body style="background-color:#f3f3f5;font-family:HelveticaNeue,Helvetica,Arial,sans-serif">
                <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:100%;width:680px;margin:0 auto;background-color:#ffffff">
                    <tbody>
                        <tr style="width:100%">
                            <td>
                                <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="border-radius:0px 0px 0 0;display:flex;flex-direciont:column;background-color:#2b2d6e">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                                                    <tbody style="width:100%">
                                                        <tr style="width:100%">
                                                            <td style="padding:20px 30px 15px">
                                                                <h1 style="color:#fff;font-size:27px;font-weight:bold;line-height:27px">Codecontrol</h1>
                                                                <p style="font-size:17px;line-height:24px;margin:16px 0;color:#fff">Documentos Vencidos</p>
                                                            </td>
                                                            <td  style="padding:30px 10px"><img src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/24417298440.png" style="display:block;outline:none;border:none;text-decoration:none;max-width:100%" width="140" /></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="padding:30px 30px 40px 30px">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <h2 style="margin:0 0 15px;font-weight:bold;font-size:21px;line-height:21px;color:#0c0d0e">Listado de Documentos de la compañía: ' || nombre_compania || '</h2>
                                                
                                                <hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin:30px 0" />
                                                
                                                <ul>' || array_to_string(documentos_usuario, '<br>') || '</ul>
                                                
                                                <hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin:30px 0" />
                                                <h2 style="margin:0 0 15px;font-weight:bold;font-size:21px;line-height:21px;color:#0c0d0e">Para ver los documentos diríjase a la app</h2>
                                                <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin-top:24px;display:block">
                                                    <tbody>
                                                        <tr>
                                                            <td><a href="https://codecontrol.com.ar/dashboard" style="color:#fff;text-decoration:none;background-color:#0095ff;border:1px solid #0077cc;font-size:17px;line-height:17px;padding:13px 17px;border-radius:4px;max-width:120px" target="_blank">ir a CodeControl</a></td>
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
        

        SELECT array_agg(p.email)
        INTO destinatarios_adicionales
        FROM share_company_users scu
        JOIN company c ON scu.company_id = c.id
        JOIN profile p ON scu.profile_id = p.id
        WHERE c.owner_id = (SELECT id FROM profile WHERE email = destinatario);

        -- Crear el array todos_destinatarios
        todos_destinatarios := ARRAY[destinatario] || destinatarios_adicionales;

        asunto := 'Documentos vencidos';

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

CREATE OR REPLACE FUNCTION public.equipment_allocated_to()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
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

CREATE OR REPLACE FUNCTION public.update_status_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

grant delete on table "public"."category" to "anon";

grant insert on table "public"."category" to "anon";

grant references on table "public"."category" to "anon";

grant select on table "public"."category" to "anon";

grant trigger on table "public"."category" to "anon";

grant truncate on table "public"."category" to "anon";

grant update on table "public"."category" to "anon";

grant delete on table "public"."category" to "authenticated";

grant insert on table "public"."category" to "authenticated";

grant references on table "public"."category" to "authenticated";

grant select on table "public"."category" to "authenticated";

grant trigger on table "public"."category" to "authenticated";

grant truncate on table "public"."category" to "authenticated";

grant update on table "public"."category" to "authenticated";

grant delete on table "public"."category" to "service_role";

grant insert on table "public"."category" to "service_role";

grant references on table "public"."category" to "service_role";

grant select on table "public"."category" to "service_role";

grant trigger on table "public"."category" to "service_role";

grant truncate on table "public"."category" to "service_role";

grant update on table "public"."category" to "service_role";

grant delete on table "public"."category_employee" to "anon";

grant insert on table "public"."category_employee" to "anon";

grant references on table "public"."category_employee" to "anon";

grant select on table "public"."category_employee" to "anon";

grant trigger on table "public"."category_employee" to "anon";

grant truncate on table "public"."category_employee" to "anon";

grant update on table "public"."category_employee" to "anon";

grant delete on table "public"."category_employee" to "authenticated";

grant insert on table "public"."category_employee" to "authenticated";

grant references on table "public"."category_employee" to "authenticated";

grant select on table "public"."category_employee" to "authenticated";

grant trigger on table "public"."category_employee" to "authenticated";

grant truncate on table "public"."category_employee" to "authenticated";

grant update on table "public"."category_employee" to "authenticated";

grant delete on table "public"."category_employee" to "service_role";

grant insert on table "public"."category_employee" to "service_role";

grant references on table "public"."category_employee" to "service_role";

grant select on table "public"."category_employee" to "service_role";

grant trigger on table "public"."category_employee" to "service_role";

grant truncate on table "public"."category_employee" to "service_role";

grant update on table "public"."category_employee" to "service_role";

grant delete on table "public"."covenant" to "anon";

grant insert on table "public"."covenant" to "anon";

grant references on table "public"."covenant" to "anon";

grant select on table "public"."covenant" to "anon";

grant trigger on table "public"."covenant" to "anon";

grant truncate on table "public"."covenant" to "anon";

grant update on table "public"."covenant" to "anon";

grant delete on table "public"."covenant" to "authenticated";

grant insert on table "public"."covenant" to "authenticated";

grant references on table "public"."covenant" to "authenticated";

grant select on table "public"."covenant" to "authenticated";

grant trigger on table "public"."covenant" to "authenticated";

grant truncate on table "public"."covenant" to "authenticated";

grant update on table "public"."covenant" to "authenticated";

grant delete on table "public"."covenant" to "service_role";

grant insert on table "public"."covenant" to "service_role";

grant references on table "public"."covenant" to "service_role";

grant select on table "public"."covenant" to "service_role";

grant trigger on table "public"."covenant" to "service_role";

grant truncate on table "public"."covenant" to "service_role";

grant update on table "public"."covenant" to "service_role";

grant delete on table "public"."form_answers" to "anon";

grant insert on table "public"."form_answers" to "anon";

grant references on table "public"."form_answers" to "anon";

grant select on table "public"."form_answers" to "anon";

grant trigger on table "public"."form_answers" to "anon";

grant truncate on table "public"."form_answers" to "anon";

grant update on table "public"."form_answers" to "anon";

grant delete on table "public"."form_answers" to "authenticated";

grant insert on table "public"."form_answers" to "authenticated";

grant references on table "public"."form_answers" to "authenticated";

grant select on table "public"."form_answers" to "authenticated";

grant trigger on table "public"."form_answers" to "authenticated";

grant truncate on table "public"."form_answers" to "authenticated";

grant update on table "public"."form_answers" to "authenticated";

grant delete on table "public"."form_answers" to "service_role";

grant insert on table "public"."form_answers" to "service_role";

grant references on table "public"."form_answers" to "service_role";

grant select on table "public"."form_answers" to "service_role";

grant trigger on table "public"."form_answers" to "service_role";

grant truncate on table "public"."form_answers" to "service_role";

grant update on table "public"."form_answers" to "service_role";

grant delete on table "public"."guild" to "anon";

grant insert on table "public"."guild" to "anon";

grant references on table "public"."guild" to "anon";

grant select on table "public"."guild" to "anon";

grant trigger on table "public"."guild" to "anon";

grant truncate on table "public"."guild" to "anon";

grant update on table "public"."guild" to "anon";

grant delete on table "public"."guild" to "authenticated";

grant insert on table "public"."guild" to "authenticated";

grant references on table "public"."guild" to "authenticated";

grant select on table "public"."guild" to "authenticated";

grant trigger on table "public"."guild" to "authenticated";

grant truncate on table "public"."guild" to "authenticated";

grant update on table "public"."guild" to "authenticated";

grant delete on table "public"."guild" to "service_role";

grant insert on table "public"."guild" to "service_role";

grant references on table "public"."guild" to "service_role";

grant select on table "public"."guild" to "service_role";

grant trigger on table "public"."guild" to "service_role";

grant truncate on table "public"."guild" to "service_role";

grant update on table "public"."guild" to "service_role";

create policy "Enable insert for authenticated users only"
on "public"."category"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."category"
as permissive
for select
to public
using (true);


create policy "update category"
on "public"."category"
as permissive
for update
to authenticated
using (true);


create policy "Enable insert for authenticated users only"
on "public"."covenant"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."covenant"
as permissive
for select
to public
using (true);


create policy "update covenant"
on "public"."covenant"
as permissive
for update
to authenticated
using (true);


create policy "todos los permisos"
on "public"."custom_form"
as permissive
for all
to authenticated
using (true);


create policy "Permitir todo a autenticated"
on "public"."form_answers"
as permissive
for all
to authenticated
using (true);


create policy "Enable insert for authenticated users only"
on "public"."guild"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."guild"
as permissive
for select
to public
using (true);


create policy "update guild"
on "public"."guild"
as permissive
for update
to authenticated
using (true);



