drop policy "Enable read access for all users" on "public"."type";

alter table "public"."brand_vehicles" add column "company_id" uuid;

alter table "public"."type" add column "company_id" uuid;

alter table "public"."type" alter column "name" set not null;

alter table "public"."types_of_repairs" add column "multi_equipment" boolean not null default true;

alter table "public"."types_of_repairs" add column "qr_close" boolean not null default false;

alter table "public"."brand_vehicles" add constraint "brand_vehicles_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."brand_vehicles" validate constraint "brand_vehicles_company_id_fkey";

alter table "public"."type" add constraint "type_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."type" validate constraint "type_company_id_fkey";

alter table "public"."types_of_repairs" add constraint "types_of_repairs_check" CHECK (true) not valid;

alter table "public"."types_of_repairs" validate constraint "types_of_repairs_check";

create policy "Permitir todo autenticado"
on "public"."type"
as permissive
for all
to authenticated
using (true);



