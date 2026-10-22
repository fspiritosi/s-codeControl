create table "public"."custom_form" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "company_id" uuid not null,
    "form" jsonb not null,
    "name" text not null
);

alter table "public"."custom_form" enable row level security;

CREATE UNIQUE INDEX custom_form_pkey ON public.custom_form USING btree (id);

alter table "public"."custom_form" add constraint "custom_form_pkey" PRIMARY KEY using index "custom_form_pkey";

alter table "public"."custom_form" add constraint "custom_form_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."custom_form" validate constraint "custom_form_company_id_fkey";

grant delete on table "public"."custom_form" to "anon";
grant insert on table "public"."custom_form" to "anon";
grant references on table "public"."custom_form" to "anon";
grant select on table "public"."custom_form" to "anon";
grant trigger on table "public"."custom_form" to "anon";
grant truncate on table "public"."custom_form" to "anon";
grant update on table "public"."custom_form" to "anon";

grant delete on table "public"."custom_form" to "authenticated";
grant insert on table "public"."custom_form" to "authenticated";
grant references on table "public"."custom_form" to "authenticated";
grant select on table "public"."custom_form" to "authenticated";
grant trigger on table "public"."custom_form" to "authenticated";
grant truncate on table "public"."custom_form" to "authenticated";
grant update on table "public"."custom_form" to "authenticated";

grant delete on table "public"."custom_form" to "service_role";
grant insert on table "public"."custom_form" to "service_role";
grant references on table "public"."custom_form" to "service_role";
grant select on table "public"."custom_form" to "service_role";
grant trigger on table "public"."custom_form" to "service_role";
grant truncate on table "public"."custom_form" to "service_role";
grant update on table "public"."custom_form" to "service_role";

create policy "Enable read access for all users"
on "public"."custom_form"
as permissive
for select
to public
using (true);

create policy "Permitir insert a untenticados"
on "public"."custom_form"
as permissive
for insert
to authenticated
with check (true);
