-- create type "public"."daily_report_status" as enum ('pendiente', 'ejecutado', 'reprogramado', 'cancelado');


-- create table "public"."dailyreport" (
--     "id" uuid not null default gen_random_uuid(),
--     "creation_date" date default CURRENT_DATE,
--     "date" date not null,
--     "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
--     "updated_at" timestamp without time zone default CURRENT_TIMESTAMP,
--     "company_id" uuid not null,
--     "status" boolean default true,
--     "is_active" boolean default true
-- );


-- create table "public"."dailyreportemployeerelations" (
--     "id" uuid not null default gen_random_uuid(),
--     "daily_report_row_id" uuid,
--     "employee_id" uuid,
--     "created_at" timestamp without time zone default CURRENT_TIMESTAMP
-- );


-- create table "public"."dailyreportequipmentrelations" (
--     "id" uuid not null default gen_random_uuid(),
--     "daily_report_row_id" uuid,
--     "equipment_id" uuid,
--     "created_at" timestamp without time zone default CURRENT_TIMESTAMP
-- );


-- create table "public"."dailyreportrows" (
--     "id" uuid not null default gen_random_uuid(),
--     "daily_report_id" uuid,
--     "customer_id" uuid,
--     "service_id" uuid,
--     "item_id" uuid,
--     "start_time" time without time zone,
--     "end_time" time without time zone,
--     "description" text,
--     "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
--     "updated_at" timestamp without time zone default CURRENT_TIMESTAMP,
--     "status" daily_report_status not null default 'pendiente'::daily_report_status,
--     "working_day" text
-- );


-- alter table "public"."measure_units" enable row level security;

-- alter table "public"."service_items" enable row level security;

-- CREATE UNIQUE INDEX dailyreport_pkey ON public.dailyreport USING btree (id);

-- CREATE UNIQUE INDEX dailyreportemployeerelations_pkey ON public.dailyreportemployeerelations USING btree (id);

-- CREATE UNIQUE INDEX dailyreportequipmentrelations_pkey ON public.dailyreportequipmentrelations USING btree (id);

-- CREATE UNIQUE INDEX dailyreportrows_pkey ON public.dailyreportrows USING btree (id);

-- alter table "public"."dailyreport" add constraint "dailyreport_pkey" PRIMARY KEY using index "dailyreport_pkey";

-- alter table "public"."dailyreportemployeerelations" add constraint "dailyreportemployeerelations_pkey" PRIMARY KEY using index "dailyreportemployeerelations_pkey";

-- alter table "public"."dailyreportequipmentrelations" add constraint "dailyreportequipmentrelations_pkey" PRIMARY KEY using index "dailyreportequipmentrelations_pkey";

-- alter table "public"."dailyreportrows" add constraint "dailyreportrows_pkey" PRIMARY KEY using index "dailyreportrows_pkey";

-- alter table "public"."dailyreport" add constraint "public_dailyreport_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) not valid;

-- alter table "public"."dailyreport" validate constraint "public_dailyreport_company_id_fkey";

-- alter table "public"."dailyreportemployeerelations" add constraint "dailyreportemployeerelations_daily_report_row_id_fkey" FOREIGN KEY (daily_report_row_id) REFERENCES dailyreportrows(id) ON DELETE CASCADE not valid;

-- alter table "public"."dailyreportemployeerelations" validate constraint "dailyreportemployeerelations_daily_report_row_id_fkey";

-- alter table "public"."dailyreportemployeerelations" add constraint "dailyreportemployeerelations_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE not valid;

-- alter table "public"."dailyreportemployeerelations" validate constraint "dailyreportemployeerelations_employee_id_fkey";

-- alter table "public"."dailyreportequipmentrelations" add constraint "dailyreportequipmentrelations_daily_report_row_id_fkey" FOREIGN KEY (daily_report_row_id) REFERENCES dailyreportrows(id) ON DELETE CASCADE not valid;

-- alter table "public"."dailyreportequipmentrelations" validate constraint "dailyreportequipmentrelations_daily_report_row_id_fkey";

-- alter table "public"."dailyreportequipmentrelations" add constraint "dailyreportequipmentrelations_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES vehicles(id) ON DELETE CASCADE not valid;

-- alter table "public"."dailyreportequipmentrelations" validate constraint "dailyreportequipmentrelations_equipment_id_fkey";

-- alter table "public"."dailyreportrows" add constraint "dailyreportrows_daily_report_id_fkey" FOREIGN KEY (daily_report_id) REFERENCES dailyreport(id) ON DELETE CASCADE not valid;

-- alter table "public"."dailyreportrows" validate constraint "dailyreportrows_daily_report_id_fkey";

-- alter table "public"."dailyreportrows" add constraint "public_dailyreportrows_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

-- alter table "public"."dailyreportrows" validate constraint "public_dailyreportrows_customer_id_fkey";

-- alter table "public"."dailyreportrows" add constraint "public_dailyreportrows_item_id_fkey" FOREIGN KEY (item_id) REFERENCES service_items(id) not valid;

-- alter table "public"."dailyreportrows" validate constraint "public_dailyreportrows_item_id_fkey";

-- alter table "public"."dailyreportrows" add constraint "public_dailyreportrows_service_id_fkey" FOREIGN KEY (service_id) REFERENCES customer_services(id) not valid;

-- alter table "public"."dailyreportrows" validate constraint "public_dailyreportrows_service_id_fkey";






