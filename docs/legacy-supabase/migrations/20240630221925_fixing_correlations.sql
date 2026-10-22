-- alter table "public"."customers" drop constraint "customers_client_email_key";

-- alter table "public"."customers" drop constraint "customers_client_phone_key";

alter table "public"."document_types" drop constraint "document_types_name_key";

drop function if exists "public"."enviar_correos_documentos_a_vencer"();

drop function if exists "public"."enviar_documentos_a_45_dias"();

drop function if exists "public"."enviar_documentos_por_vencer"();

-- drop index if exists "public"."customers_client_email_key";

-- drop index if exists "public"."customers_client_phone_key";

drop index if exists "public"."document_types_name_key";

alter table "public"."customers" alter column "client_email" drop not null;

set check_function_bodies = off;

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


