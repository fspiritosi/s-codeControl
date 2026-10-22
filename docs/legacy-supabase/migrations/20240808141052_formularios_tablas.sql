drop policy "Enable read access for all users" on "public"."custom_form";

alter table "public"."documents_employees" drop constraint "documents_employees_docoment_path_key";

drop index if exists "public"."documents_employees_docoment_path_key";

alter table "public"."employees" alter column "status" drop default;

alter table "public"."vehicles" alter column "status" drop default;

alter type "public"."status_type" rename to "status_type__old_version_to_be_dropped";

create type "public"."status_type" as enum ('Avalado', 'No avalado', 'Incompleto', 'Completo', 'Completo con doc vencida');

create table "public"."contractor_equipment" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "equipment_id" uuid,
    "contractor_id" uuid
);


alter table "public"."contractor_equipment" enable row level security;

create table "public"."form_answers" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "form_id" uuid not null,
    "answer" json not null
);


alter table "public"."form_answers" enable row level security;

alter table "public"."employees" alter column status type "public"."status_type" using status::text::"public"."status_type";

alter table "public"."vehicles" alter column status type "public"."status_type" using status::text::"public"."status_type";

alter table "public"."employees" alter column "status" set default 'No avalado'::status_type;

alter table "public"."vehicles" alter column "status" set default 'No avalado'::status_type;

drop type "public"."status_type__old_version_to_be_dropped";

alter table "public"."document_types" add column "down_document" boolean;

alter table "public"."employees" alter column "status" set default 'Incompleto'::status_type;

alter table "public"."vehicles" alter column "status" set default 'Incompleto'::status_type;

CREATE UNIQUE INDEX contractor_equipment_employee_id_contractor_id_key ON public.contractor_equipment USING btree (equipment_id, contractor_id);

CREATE UNIQUE INDEX contractor_equipment_pkey ON public.contractor_equipment USING btree (id);

CREATE UNIQUE INDEX form_answers_pkey ON public.form_answers USING btree (id);

alter table "public"."contractor_equipment" add constraint "contractor_equipment_pkey" PRIMARY KEY using index "contractor_equipment_pkey";

alter table "public"."form_answers" add constraint "form_answers_pkey" PRIMARY KEY using index "form_answers_pkey";

alter table "public"."contractor_equipment" add constraint "contractor_equipment_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES customers(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."contractor_equipment" validate constraint "contractor_equipment_contractor_id_fkey";

alter table "public"."contractor_equipment" add constraint "contractor_equipment_employee_id_contractor_id_key" UNIQUE using index "contractor_equipment_employee_id_contractor_id_key";

alter table "public"."contractor_equipment" add constraint "contractor_equipment_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES vehicles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."contractor_equipment" validate constraint "contractor_equipment_equipment_id_fkey";

alter table "public"."form_answers" add constraint "form_answers_form_id_fkey" FOREIGN KEY (form_id) REFERENCES custom_form(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."form_answers" validate constraint "form_answers_form_id_fkey";

set check_function_bodies = off;

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

grant delete on table "public"."contractor_equipment" to "anon";

grant insert on table "public"."contractor_equipment" to "anon";

grant references on table "public"."contractor_equipment" to "anon";

grant select on table "public"."contractor_equipment" to "anon";

grant trigger on table "public"."contractor_equipment" to "anon";

grant truncate on table "public"."contractor_equipment" to "anon";

grant update on table "public"."contractor_equipment" to "anon";

grant delete on table "public"."contractor_equipment" to "authenticated";

grant insert on table "public"."contractor_equipment" to "authenticated";

grant references on table "public"."contractor_equipment" to "authenticated";

grant select on table "public"."contractor_equipment" to "authenticated";

grant trigger on table "public"."contractor_equipment" to "authenticated";

grant truncate on table "public"."contractor_equipment" to "authenticated";

grant update on table "public"."contractor_equipment" to "authenticated";

grant delete on table "public"."contractor_equipment" to "service_role";

grant insert on table "public"."contractor_equipment" to "service_role";

grant references on table "public"."contractor_equipment" to "service_role";

grant select on table "public"."contractor_equipment" to "service_role";

grant trigger on table "public"."contractor_equipment" to "service_role";

grant truncate on table "public"."contractor_equipment" to "service_role";

grant update on table "public"."contractor_equipment" to "service_role";

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

create policy "todos los permisos"
on "public"."contractor_equipment"
as permissive
for all
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


CREATE TRIGGER trg_update_documents_employees AFTER UPDATE ON public.documents_employees FOR EACH ROW EXECUTE FUNCTION update_status_trigger();

CREATE TRIGGER trg_update_documents_equipment AFTER UPDATE ON public.documents_equipment FOR EACH ROW EXECUTE FUNCTION update_status_trigger();

CREATE TRIGGER add_contractor_equipment BEFORE INSERT ON public.vehicles FOR EACH ROW EXECUTE FUNCTION equipment_allocated_to();


