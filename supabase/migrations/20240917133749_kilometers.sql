alter table "public"."repair_solicitudes" add column "employee_id" uuid;

alter table "public"."repair_solicitudes" add column "kilometraje" numeric;

alter table "public"."repair_solicitudes" alter column "user_id" drop not null;

alter table "public"."vehicles" add column "kilometer" text default '0'::text;

alter table "public"."vehicles" alter column "condition" set default 'operativo'::condition_enum;

alter table "public"."repair_solicitudes" add constraint "repair_solicitudes_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."repair_solicitudes" validate constraint "repair_solicitudes_employee_id_fkey";


