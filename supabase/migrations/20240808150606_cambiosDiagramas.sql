alter table "public"."diagram_type" add column "color" text not null;

alter table "public"."diagram_type" add column "short_description" text not null;

alter table "public"."employees_diagram" drop column "from_date";

alter table "public"."employees_diagram" drop column "to_date";

alter table "public"."employees_diagram" add column "day" numeric not null;

alter table "public"."employees_diagram" add column "month" numeric not null;

alter table "public"."employees_diagram" add column "year" numeric not null;

create policy "Policy with security definer functions"
on "public"."diagram_type"
as permissive
for all
to authenticated
using (true);



