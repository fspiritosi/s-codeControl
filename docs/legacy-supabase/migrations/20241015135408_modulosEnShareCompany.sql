-- alter table "public"."diagram_type" drop constraint "diagram_type_name_key";

-- drop index if exists "public"."diagram_type_name_key";

-- alter type "public"."modulos" rename to "modulos__old_version_to_be_dropped";

-- create type "public"."modulos" as enum ('empresa', 'empleados', 'equipos', 'documentacion', 'mantenimiento', 'dashboard', 'ayuda', 'operaciones');

-- drop type "public"."modulos__old_version_to_be_dropped";

-- alter table "public"."share_company_users" add column "modules" modulos[];


