drop trigger if exists "trg_update_documents_employees" on "public"."documents_employees";

drop trigger if exists "trg_update_documents_equipment" on "public"."documents_equipment";

drop trigger if exists "add_contractor_equipment" on "public"."vehicles";

drop policy "todos los permisos" on "public"."contractor_equipment";

drop policy "todos los permisos" on "public"."custom_form";

drop policy "Permitir todo a autenticated" on "public"."form_answers";

revoke delete on table "public"."contractor_equipment" from "anon";

revoke insert on table "public"."contractor_equipment" from "anon";

revoke references on table "public"."contractor_equipment" from "anon";

revoke select on table "public"."contractor_equipment" from "anon";

revoke trigger on table "public"."contractor_equipment" from "anon";

revoke truncate on table "public"."contractor_equipment" from "anon";

revoke update on table "public"."contractor_equipment" from "anon";

revoke delete on table "public"."contractor_equipment" from "authenticated";

revoke insert on table "public"."contractor_equipment" from "authenticated";

revoke references on table "public"."contractor_equipment" from "authenticated";

revoke select on table "public"."contractor_equipment" from "authenticated";

revoke trigger on table "public"."contractor_equipment" from "authenticated";

revoke truncate on table "public"."contractor_equipment" from "authenticated";

revoke update on table "public"."contractor_equipment" from "authenticated";

revoke delete on table "public"."contractor_equipment" from "service_role";

revoke insert on table "public"."contractor_equipment" from "service_role";

revoke references on table "public"."contractor_equipment" from "service_role";

revoke select on table "public"."contractor_equipment" from "service_role";

revoke trigger on table "public"."contractor_equipment" from "service_role";

revoke truncate on table "public"."contractor_equipment" from "service_role";

revoke update on table "public"."contractor_equipment" from "service_role";

revoke delete on table "public"."form_answers" from "anon";

revoke insert on table "public"."form_answers" from "anon";

revoke references on table "public"."form_answers" from "anon";

revoke select on table "public"."form_answers" from "anon";

revoke trigger on table "public"."form_answers" from "anon";

revoke truncate on table "public"."form_answers" from "anon";

revoke update on table "public"."form_answers" from "anon";

revoke delete on table "public"."form_answers" from "authenticated";

revoke insert on table "public"."form_answers" from "authenticated";

revoke references on table "public"."form_answers" from "authenticated";

revoke select on table "public"."form_answers" from "authenticated";

revoke trigger on table "public"."form_answers" from "authenticated";

revoke truncate on table "public"."form_answers" from "authenticated";

revoke update on table "public"."form_answers" from "authenticated";

revoke delete on table "public"."form_answers" from "service_role";

revoke insert on table "public"."form_answers" from "service_role";

revoke references on table "public"."form_answers" from "service_role";

revoke select on table "public"."form_answers" from "service_role";

revoke trigger on table "public"."form_answers" from "service_role";

revoke truncate on table "public"."form_answers" from "service_role";

revoke update on table "public"."form_answers" from "service_role";

alter table "public"."contractor_equipment" drop constraint "contractor_equipment_contractor_id_fkey";

alter table "public"."contractor_equipment" drop constraint "contractor_equipment_employee_id_contractor_id_key";

alter table "public"."contractor_equipment" drop constraint "contractor_equipment_equipment_id_fkey";

alter table "public"."form_answers" drop constraint "form_answers_form_id_fkey";

drop function if exists "public"."equipment_allocated_to"();

drop function if exists "public"."update_status_trigger"();

alter table "public"."contractor_equipment" drop constraint "contractor_equipment_pkey";

alter table "public"."form_answers" drop constraint "form_answers_pkey";

drop index if exists "public"."contractor_equipment_employee_id_contractor_id_key";

drop index if exists "public"."contractor_equipment_pkey";

drop index if exists "public"."form_answers_pkey";

drop table "public"."contractor_equipment";

drop table "public"."form_answers";

alter table "public"."employees" alter column "status" drop default;

alter table "public"."vehicles" alter column "status" drop default;

alter type "public"."status_type" rename to "status_type__old_version_to_be_dropped";

create type "public"."status_type" as enum ('Avalado', 'No avalado');

alter table "public"."employees" alter column status type "public"."status_type" using status::text::"public"."status_type";

alter table "public"."vehicles" alter column status type "public"."status_type" using status::text::"public"."status_type";

-- alter table "public"."employees" alter column "status" set default 'Incompleto'::status_type;

-- alter table "public"."vehicles" alter column "status" set default 'Incompleto'::status_type;

drop type "public"."status_type__old_version_to_be_dropped";

alter table "public"."document_types" drop column "down_document";

alter table "public"."employees" alter column "status" set default 'No avalado'::status_type;

alter table "public"."vehicles" alter column "status" set default 'No avalado'::status_type;

CREATE UNIQUE INDEX documents_employees_docoment_path_key ON public.documents_employees USING btree (document_path);

alter table "public"."documents_employees" add constraint "documents_employees_docoment_path_key" UNIQUE using index "documents_employees_docoment_path_key";

create policy "Enable read access for all users"
on "public"."custom_form"
as permissive
for select
to public
using (true);



