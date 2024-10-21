

-- alter table "public"."dailyreport" enable row level security;

-- alter table "public"."dailyreportemployeerelations" enable row level security;

-- alter table "public"."dailyreportequipmentrelations" enable row level security;

-- alter table "public"."dailyreportrows" enable row level security;


-- create policy "insertar_y_editar_autenticados"
-- on "public"."dailyreport"
-- as permissive
-- for all
-- to authenticated
-- using (true);


-- create policy "insertar_y_editar_relation_employee"
-- on "public"."dailyreportemployeerelations"
-- as permissive
-- for all
-- to authenticated
-- using (true);


-- create policy "insertar_y_editar_relation_equipment"
-- on "public"."dailyreportequipmentrelations"
-- as permissive
-- for all
-- to authenticated
-- using (true);


-- create policy "insertar_y_editar_fila"
-- on "public"."dailyreportrows"
-- as permissive
-- for all
-- to authenticated
-- using (true);






