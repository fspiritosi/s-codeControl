CREATE TRIGGER create_user_trigger AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_user_for_external_login();

CREATE TRIGGER new_external_user_login AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_user_for_external_login();


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION storage.extension(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
_filename text;
BEGIN
    select string_to_array(name, '/') into _parts;
    select _parts[array_length(_parts,1)] into _filename;
    -- @todo return the last part instead of 2
    return split_part(_filename, '.', 2);
END
$function$
;

CREATE OR REPLACE FUNCTION storage.filename(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
BEGIN
    select string_to_array(name, '/') into _parts;
    return _parts[array_length(_parts,1)];
END
$function$
;

CREATE OR REPLACE FUNCTION storage.foldername(name text)
 RETURNS text[]
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
BEGIN
    select string_to_array(name, '/') into _parts;
    return _parts[1:array_length(_parts,1)-1];
END
$function$
;

create policy "Enable insert for users based on user_id"
on "storage"."objects"
as permissive
for insert
to public
with check (true);


create policy "Enable read access for all users"
on "storage"."objects"
as permissive
for select
to public
using (true);


create policy "delete document"
on "storage"."objects"
as permissive
for delete
to public
using ((bucket_id = 'document_files'::text));


create policy "delete employees"
on "storage"."objects"
as permissive
for delete
to public
using ((bucket_id = 'employee_photos'::text));


create policy "delete logo"
on "storage"."objects"
as permissive
for delete
to public
using ((bucket_id = 'logo'::text));


create policy "delete"
on "storage"."objects"
as permissive
for delete
to public
using ((bucket_id = 'vehicle_photos'::text));


create policy "select document"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'document_files'::text));


create policy "select employees"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'employee_photos'::text));


create policy "select logo"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'logo'::text));


create policy "select"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'vehicle_photos'::text));


create policy "update document"
on "storage"."objects"
as permissive
for update
to public
using ((bucket_id = 'document_files'::text));


create policy "update employees"
on "storage"."objects"
as permissive
for update
to public
using ((bucket_id = 'employee_photos'::text));


create policy "update logo"
on "storage"."objects"
as permissive
for update
to public
using ((bucket_id = 'logo'::text));


create policy "update"
on "storage"."objects"
as permissive
for update
to public
using ((bucket_id = 'vehicle_photos'::text));



