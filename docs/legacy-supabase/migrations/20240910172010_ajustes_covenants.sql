alter table "public"."category" drop constraint "public_category_covenant_id_fkey";

alter table "public"."covenant" drop constraint "public_covenant_guild_id_fkey";

alter table "public"."employees" drop constraint "public_employees_category_fkey";

alter table "public"."employees" drop constraint "public_employees_covenants_fkey";

alter table "public"."employees" drop constraint "public_employees_guild_fkey";

alter table "public"."covenant" alter column "company_id" set not null;

alter table "public"."covenant" alter column "guild_id" set not null;

alter table "public"."employees" drop column "category";

alter table "public"."employees" drop column "covenants";

alter table "public"."employees" drop column "guild";

alter table "public"."employees" add column "category_id" uuid;

alter table "public"."employees" add column "covenants_id" uuid;

alter table "public"."employees" add column "guild_id" uuid;

alter table "public"."category" add constraint "category_covenant_id_fkey" FOREIGN KEY (covenant_id) REFERENCES covenant(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."category" validate constraint "category_covenant_id_fkey";

alter table "public"."covenant" add constraint "covenant_company_id_fkey" FOREIGN KEY (company_id) REFERENCES company(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."covenant" validate constraint "covenant_company_id_fkey";

alter table "public"."covenant" add constraint "covenant_guild_id_fkey" FOREIGN KEY (guild_id) REFERENCES guild(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."covenant" validate constraint "covenant_guild_id_fkey";

alter table "public"."employees" add constraint "employees_category_id_fkey" FOREIGN KEY (category_id) REFERENCES category(id) not valid;

alter table "public"."employees" validate constraint "employees_category_id_fkey";

alter table "public"."employees" add constraint "employees_covenants_id_fkey" FOREIGN KEY (covenants_id) REFERENCES covenant(id) not valid;

alter table "public"."employees" validate constraint "employees_covenants_id_fkey";

alter table "public"."employees" add constraint "employees_guild_id_fkey" FOREIGN KEY (guild_id) REFERENCES guild(id) not valid;

alter table "public"."employees" validate constraint "employees_guild_id_fkey";


