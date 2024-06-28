alter type "public"."document_applies" rename to "document_applies__old_version_to_be_dropped";

create type "public"."document_applies" as enum ('Persona', 'Equipos', 'Empresa');

create table "public"."documents_company" (
    "created_at" timestamp with time zone not null default now(),
    "id_document_types" uuid,
    "validity" text,
    "state" state not null default 'pendiente'::state,
    "is_active" boolean default true,
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "applies" uuid not null,
    "deny_reason" text,
    "document_path" text,
    "period" text
);


alter table "public"."documents_company" enable row level security;

alter table "public"."document_types" alter column applies type "public"."document_applies" using applies::text::"public"."document_applies";

drop type "public"."document_applies__old_version_to_be_dropped";

alter table "public"."document_types" add column "is_it_montlhy" boolean;

alter table "public"."documents_employees" add column "period" text;

alter table "public"."documents_equipment" add column "period" text;

CREATE UNIQUE INDEX documents_company_document_path_key ON public.documents_company USING btree (document_path);

CREATE UNIQUE INDEX documents_company_pkey ON public.documents_company USING btree (id);

alter table "public"."documents_company" add constraint "documents_company_pkey" PRIMARY KEY using index "documents_company_pkey";

alter table "public"."documents_company" add constraint "documents_company_applies_fkey" FOREIGN KEY (applies) REFERENCES company(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."documents_company" validate constraint "documents_company_applies_fkey";

alter table "public"."documents_company" add constraint "documents_company_document_path_key" UNIQUE using index "documents_company_document_path_key";

alter table "public"."documents_company" add constraint "documents_company_id_document_types_fkey" FOREIGN KEY (id_document_types) REFERENCES document_types(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."documents_company" validate constraint "documents_company_id_document_types_fkey";

alter table "public"."documents_company" add constraint "documents_company_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profile(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."documents_company" validate constraint "documents_company_user_id_fkey";

set check_function_bodies = off;

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
      ELSE
        SELECT owner_id INTO company_owner_id FROM company WHERE id = NEW.company_id;
        FOR vehicle_id IN SELECT id FROM vehicles WHERE company_id = NEW.company_id LOOP
          INSERT INTO documents_equipment (id_document_types, applies, validity, state, is_active, user_id, deny_reason, document_path)
          VALUES (NEW.id, vehicle_id, NULL, 'pendiente', TRUE, company_owner_id, NULL, NULL);
        END LOOP;
      END IF;
    ELSIF NEW.applies = 'Persona' THEN
      IF NEW.company_id IS NULL THEN
        FOR company_owner_id IN SELECT owner_id FROM company LOOP
          FOR employee_id IN SELECT id FROM employees WHERE company_id = company_owner_id LOOP
            INSERT INTO documents_employees (id_document_types, applies, validity, state, is_active, user_id, deny_reason, document_path)
            VALUES (NEW.id, employee_id, NULL, 'pendiente', TRUE, company_owner_id, NULL, NULL);
          END LOOP;
        END LOOP;
      ELSE
        SELECT owner_id INTO company_owner_id FROM company WHERE id = NEW.company_id;
        FOR employee_id IN SELECT id FROM employees WHERE company_id = NEW.company_id LOOP
          INSERT INTO documents_employees (id_document_types, applies, validity, state, is_active, user_id, deny_reason, document_path)
          VALUES (NEW.id, employee_id, NULL, 'pendiente', TRUE, company_owner_id, NULL, NULL);
        END LOOP;
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

grant delete on table "public"."documents_company" to "anon";

grant insert on table "public"."documents_company" to "anon";

grant references on table "public"."documents_company" to "anon";

grant select on table "public"."documents_company" to "anon";

grant trigger on table "public"."documents_company" to "anon";

grant truncate on table "public"."documents_company" to "anon";

grant update on table "public"."documents_company" to "anon";

grant delete on table "public"."documents_company" to "authenticated";

grant insert on table "public"."documents_company" to "authenticated";

grant references on table "public"."documents_company" to "authenticated";

grant select on table "public"."documents_company" to "authenticated";

grant trigger on table "public"."documents_company" to "authenticated";

grant truncate on table "public"."documents_company" to "authenticated";

grant update on table "public"."documents_company" to "authenticated";

grant delete on table "public"."documents_company" to "service_role";

grant insert on table "public"."documents_company" to "service_role";

grant references on table "public"."documents_company" to "service_role";

grant select on table "public"."documents_company" to "service_role";

grant trigger on table "public"."documents_company" to "service_role";

grant truncate on table "public"."documents_company" to "service_role";

grant update on table "public"."documents_company" to "service_role";

create policy "Enable insert for authenticated users only"
on "public"."documents_company"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable update for users based on email"
on "public"."documents_company"
as permissive
for update
to public
using (true)
with check (true);


create policy "Permitir acceso a los autenticados"
on "public"."documents_company"
as permissive
for select
to authenticated
using (true);



