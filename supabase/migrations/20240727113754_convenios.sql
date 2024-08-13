

-- create table "public"."category" (
--     "id" uuid not null default gen_random_uuid(),
--     "created_at" timestamp with time zone not null default now(),
--     "covenant_id" uuid,
--     "name" text,
--     "is_active" boolean default true
-- );


-- alter table "public"."category" enable row level security;

-- create table "public"."category_employee" (
--     "created_at" timestamp with time zone not null default now(),
--     "category_id" uuid,
--     "emplyee_id" uuid,
--     "id" uuid not null default gen_random_uuid()
-- );


-- alter table "public"."category_employee" enable row level security;

-- create table "public"."covenant" (
--     "id" uuid not null default gen_random_uuid(),
--     "created_at" timestamp with time zone not null default now(),
--     "name" text,
--     "company_id" uuid,
--     "is_active" boolean default true,
--     "guild_id" uuid
-- );


-- alter table "public"."covenant" enable row level security;

-- create table "public"."guild" (
--     "id" uuid not null default gen_random_uuid(),
--     "created_at" timestamp with time zone not null default now(),
--     "name" text,
--     "company_id" uuid,
--     "is_active" boolean not null default true
-- );


-- alter table "public"."guild" enable row level security;

-- -- alter table "public"."contacts" add column "reason_for_termination" text;

-- -- alter table "public"."contacts" add column "termination_date" date;

-- -- alter table "public"."customers" add column "reason_for_termination" text;

-- -- alter table "public"."customers" add column "termination_date" date;

-- alter table "public"."employees" add column "category" uuid;

-- alter table "public"."employees" add column "covenants" uuid;

-- alter table "public"."employees" add column "guild" uuid;

-- -- alter table "public"."share_company_users" add column "customer_id" text;

-- CREATE UNIQUE INDEX category_employee_created_at_key ON public.category_employee USING btree (created_at);

-- CREATE UNIQUE INDEX category_employee_pkey ON public.category_employee USING btree (id);

-- CREATE UNIQUE INDEX category_pkey ON public.category USING btree (id);

-- CREATE UNIQUE INDEX covenant_pkey ON public.covenant USING btree (id);

-- CREATE UNIQUE INDEX guild_pkey ON public.guild USING btree (id);

-- alter table "public"."category" add constraint "category_pkey" PRIMARY KEY using index "category_pkey";

-- alter table "public"."category_employee" add constraint "category_employee_pkey" PRIMARY KEY using index "category_employee_pkey";

-- alter table "public"."covenant" add constraint "covenant_pkey" PRIMARY KEY using index "covenant_pkey";

-- alter table "public"."guild" add constraint "guild_pkey" PRIMARY KEY using index "guild_pkey";

-- alter table "public"."category" add constraint "public_category_covenant_id_fkey" FOREIGN KEY (covenant_id) REFERENCES covenant(id) not valid;

-- alter table "public"."category" validate constraint "public_category_covenant_id_fkey";

-- alter table "public"."category_employee" add constraint "category_employee_created_at_key" UNIQUE using index "category_employee_created_at_key";

-- alter table "public"."category_employee" add constraint "public_covenant_category_category_id_fkey" FOREIGN KEY (category_id) REFERENCES category(id) not valid;

-- alter table "public"."category_employee" validate constraint "public_covenant_category_category_id_fkey";

-- alter table "public"."category_employee" add constraint "public_covenant_employee_emplyee_id_fkey" FOREIGN KEY (emplyee_id) REFERENCES employees(id) not valid;

-- alter table "public"."category_employee" validate constraint "public_covenant_employee_emplyee_id_fkey";

-- alter table "public"."covenant" add constraint "public_covenant_guild_id_fkey" FOREIGN KEY (guild_id) REFERENCES guild(id) not valid;

-- alter table "public"."covenant" validate constraint "public_covenant_guild_id_fkey";

-- alter table "public"."employees" add constraint "public_employees_category_fkey" FOREIGN KEY (category) REFERENCES category(id) not valid;

-- alter table "public"."employees" validate constraint "public_employees_category_fkey";

-- alter table "public"."employees" add constraint "public_employees_covenants_fkey" FOREIGN KEY (covenants) REFERENCES covenant(id) not valid;

-- alter table "public"."employees" validate constraint "public_employees_covenants_fkey";

-- alter table "public"."employees" add constraint "public_employees_guild_fkey" FOREIGN KEY (guild) REFERENCES guild(id) not valid;

-- alter table "public"."employees" validate constraint "public_employees_guild_fkey";

-- alter table "public"."guild" add constraint "public_guild_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) not valid;

-- alter table "public"."guild" validate constraint "public_guild_company_id_fkey";

-- grant delete on table "public"."category" to "anon";

-- grant insert on table "public"."category" to "anon";

-- grant references on table "public"."category" to "anon";

-- grant select on table "public"."category" to "anon";

-- grant trigger on table "public"."category" to "anon";

-- grant truncate on table "public"."category" to "anon";

-- grant update on table "public"."category" to "anon";

-- grant delete on table "public"."category" to "authenticated";

-- grant insert on table "public"."category" to "authenticated";

-- grant references on table "public"."category" to "authenticated";

-- grant select on table "public"."category" to "authenticated";

-- grant trigger on table "public"."category" to "authenticated";

-- grant truncate on table "public"."category" to "authenticated";

-- grant update on table "public"."category" to "authenticated";

-- grant delete on table "public"."category" to "service_role";

-- grant insert on table "public"."category" to "service_role";

-- grant references on table "public"."category" to "service_role";

-- grant select on table "public"."category" to "service_role";

-- grant trigger on table "public"."category" to "service_role";

-- grant truncate on table "public"."category" to "service_role";

-- grant update on table "public"."category" to "service_role";

-- grant delete on table "public"."category_employee" to "anon";

-- grant insert on table "public"."category_employee" to "anon";

-- grant references on table "public"."category_employee" to "anon";

-- grant select on table "public"."category_employee" to "anon";

-- grant trigger on table "public"."category_employee" to "anon";

-- grant truncate on table "public"."category_employee" to "anon";

-- grant update on table "public"."category_employee" to "anon";

-- grant delete on table "public"."category_employee" to "authenticated";

-- grant insert on table "public"."category_employee" to "authenticated";

-- grant references on table "public"."category_employee" to "authenticated";

-- grant select on table "public"."category_employee" to "authenticated";

-- grant trigger on table "public"."category_employee" to "authenticated";

-- grant truncate on table "public"."category_employee" to "authenticated";

-- grant update on table "public"."category_employee" to "authenticated";

-- grant delete on table "public"."category_employee" to "service_role";

-- grant insert on table "public"."category_employee" to "service_role";

-- grant references on table "public"."category_employee" to "service_role";

-- grant select on table "public"."category_employee" to "service_role";

-- grant trigger on table "public"."category_employee" to "service_role";

-- grant truncate on table "public"."category_employee" to "service_role";

-- grant update on table "public"."category_employee" to "service_role";

-- grant delete on table "public"."covenant" to "anon";

-- grant insert on table "public"."covenant" to "anon";

-- grant references on table "public"."covenant" to "anon";

-- grant select on table "public"."covenant" to "anon";

-- grant trigger on table "public"."covenant" to "anon";

-- grant truncate on table "public"."covenant" to "anon";

-- grant update on table "public"."covenant" to "anon";

-- grant delete on table "public"."covenant" to "authenticated";

-- grant insert on table "public"."covenant" to "authenticated";

-- grant references on table "public"."covenant" to "authenticated";

-- grant select on table "public"."covenant" to "authenticated";

-- grant trigger on table "public"."covenant" to "authenticated";

-- grant truncate on table "public"."covenant" to "authenticated";

-- grant update on table "public"."covenant" to "authenticated";

-- grant delete on table "public"."covenant" to "service_role";

-- grant insert on table "public"."covenant" to "service_role";

-- grant references on table "public"."covenant" to "service_role";

-- grant select on table "public"."covenant" to "service_role";

-- grant trigger on table "public"."covenant" to "service_role";

-- grant truncate on table "public"."covenant" to "service_role";

-- grant update on table "public"."covenant" to "service_role";

-- grant delete on table "public"."guild" to "anon";

-- grant insert on table "public"."guild" to "anon";

-- grant references on table "public"."guild" to "anon";

-- grant select on table "public"."guild" to "anon";

-- grant trigger on table "public"."guild" to "anon";

-- grant truncate on table "public"."guild" to "anon";

-- grant update on table "public"."guild" to "anon";

-- grant delete on table "public"."guild" to "authenticated";

-- grant insert on table "public"."guild" to "authenticated";

-- grant references on table "public"."guild" to "authenticated";

-- grant select on table "public"."guild" to "authenticated";

-- grant trigger on table "public"."guild" to "authenticated";

-- grant truncate on table "public"."guild" to "authenticated";

-- grant update on table "public"."guild" to "authenticated";

-- grant delete on table "public"."guild" to "service_role";

-- grant insert on table "public"."guild" to "service_role";

-- grant references on table "public"."guild" to "service_role";

-- grant select on table "public"."guild" to "service_role";

-- grant trigger on table "public"."guild" to "service_role";

-- grant truncate on table "public"."guild" to "service_role";

-- grant update on table "public"."guild" to "service_role";

-- create policy "Enable insert for authenticated users only"
-- on "public"."category"
-- as permissive
-- for insert
-- to authenticated
-- with check (true);


-- create policy "Enable read access for all users"
-- on "public"."category"
-- as permissive
-- for select
-- to public
-- using (true);


-- create policy "update category"
-- on "public"."category"
-- as permissive
-- for update
-- to authenticated
-- using (true);


-- create policy "Enable insert for authenticated users only"
-- on "public"."covenant"
-- as permissive
-- for insert
-- to authenticated
-- with check (true);


-- create policy "Enable read access for all users"
-- on "public"."covenant"
-- as permissive
-- for select
-- to public
-- using (true);


-- create policy "update covenant"
-- on "public"."covenant"
-- as permissive
-- for update
-- to authenticated
-- using (true);


-- create policy "Enable insert for authenticated users only"
-- on "public"."guild"
-- as permissive
-- for insert
-- to authenticated
-- with check (true);


-- create policy "Enable read access for all users"
-- on "public"."guild"
-- as permissive
-- for select
-- to public
-- using (true);


-- create policy "update guild"
-- on "public"."guild"
-- as permissive
-- for update
-- to authenticated
-- using (true);



