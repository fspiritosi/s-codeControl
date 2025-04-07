alter table "public"."customers" drop constraint "public_customers_company_id_fkey";

alter table "public"."contractor_employee" drop constraint "contractor_employee_contractor_id_fkey";

CREATE UNIQUE INDEX unique_contractor_employee ON public.contractor_employee USING btree (employee_id, contractor_id);

alter table "public"."contractor_employee" add constraint "unique_contractor_employee" UNIQUE using index "unique_contractor_employee";

alter table "public"."customers" add constraint "customers_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."customers" validate constraint "customers_company_id_fkey";

alter table "public"."contractor_employee" add constraint "contractor_employee_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES customers(id) not valid;

alter table "public"."contractor_employee" validate constraint "contractor_employee_contractor_id_fkey";


