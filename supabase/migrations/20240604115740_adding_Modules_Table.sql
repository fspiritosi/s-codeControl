create table "public"."hired_modules" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "company_id" uuid,
    "module_id" uuid,
    "due_to" date default (CURRENT_DATE + '1 mon'::interval)
);


alter table "public"."hired_modules" enable row level security;

create table "public"."modules" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "price" numeric not null,
    "description" text not null
);


alter table "public"."modules" enable row level security;

CREATE UNIQUE INDEX hired_modules_pkey ON public.hired_modules USING btree (id);

CREATE UNIQUE INDEX modules_pkey ON public.modules USING btree (id);

alter table "public"."hired_modules" add constraint "hired_modules_pkey" PRIMARY KEY using index "hired_modules_pkey";

alter table "public"."modules" add constraint "modules_pkey" PRIMARY KEY using index "modules_pkey";

alter table "public"."hired_modules" add constraint "hired_modules_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."hired_modules" validate constraint "hired_modules_company_id_fkey";

alter table "public"."hired_modules" add constraint "hired_modules_module_id_fkey" FOREIGN KEY (module_id) REFERENCES modules(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."hired_modules" validate constraint "hired_modules_module_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.delete_expired_subscriptions()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM hired_modules WHERE due_to < CURRENT_DATE;
END;
$function$
;

grant delete on table "public"."hired_modules" to "anon";

grant insert on table "public"."hired_modules" to "anon";

grant references on table "public"."hired_modules" to "anon";

grant select on table "public"."hired_modules" to "anon";

grant trigger on table "public"."hired_modules" to "anon";

grant truncate on table "public"."hired_modules" to "anon";

grant update on table "public"."hired_modules" to "anon";

grant delete on table "public"."hired_modules" to "authenticated";

grant insert on table "public"."hired_modules" to "authenticated";

grant references on table "public"."hired_modules" to "authenticated";

grant select on table "public"."hired_modules" to "authenticated";

grant trigger on table "public"."hired_modules" to "authenticated";

grant truncate on table "public"."hired_modules" to "authenticated";

grant update on table "public"."hired_modules" to "authenticated";

grant delete on table "public"."hired_modules" to "service_role";

grant insert on table "public"."hired_modules" to "service_role";

grant references on table "public"."hired_modules" to "service_role";

grant select on table "public"."hired_modules" to "service_role";

grant trigger on table "public"."hired_modules" to "service_role";

grant truncate on table "public"."hired_modules" to "service_role";

grant update on table "public"."hired_modules" to "service_role";

grant delete on table "public"."modules" to "anon";

grant insert on table "public"."modules" to "anon";

grant references on table "public"."modules" to "anon";

grant select on table "public"."modules" to "anon";

grant trigger on table "public"."modules" to "anon";

grant truncate on table "public"."modules" to "anon";

grant update on table "public"."modules" to "anon";

grant delete on table "public"."modules" to "authenticated";

grant insert on table "public"."modules" to "authenticated";

grant references on table "public"."modules" to "authenticated";

grant select on table "public"."modules" to "authenticated";

grant trigger on table "public"."modules" to "authenticated";

grant truncate on table "public"."modules" to "authenticated";

grant update on table "public"."modules" to "authenticated";

grant delete on table "public"."modules" to "service_role";

grant insert on table "public"."modules" to "service_role";

grant references on table "public"."modules" to "service_role";

grant select on table "public"."modules" to "service_role";

grant trigger on table "public"."modules" to "service_role";

grant truncate on table "public"."modules" to "service_role";

grant update on table "public"."modules" to "service_role";


