create type "public"."modulos" as enum ('empresa', 'empleados', 'equipos', 'documentación', 'mantenimiento', 'dashboard', 'ayuda');

-- alter table "public"."diagram_type" drop constraint "diagram_type_name_key";

-- drop index if exists "public"."diagram_type_name_key";

alter table "public"."profile" add column "modulos" modulos[];


