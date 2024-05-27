alter table "public"."brand_vehicles" add column "is_active" boolean default true;

alter table "public"."hierarchy" add column "is_active" boolean default true;

alter table "public"."industry_type" add column "is_active" boolean default true;

alter table "public"."model_vehicles" add column "is_active" boolean default true;

alter table "public"."type" add column "is_active" boolean default true;

alter table "public"."types_of_vehicles" add column "is_active" boolean default true;

alter table "public"."work-diagram" drop column "isActive";

alter table "public"."work-diagram" add column "is_active" boolean default true;


