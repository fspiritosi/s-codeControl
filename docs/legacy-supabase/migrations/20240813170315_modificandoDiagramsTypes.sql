alter table "public"."diagram_type" add column "work_active" boolean default false;

create policy "Policy with security definer functions"
on "public"."employees_diagram"
as permissive
for all
to authenticated
using (true);



