-- Pasa una copia de la base de Supabase (esquema public restaurado) a Postgres standalone.
-- Requisitos: 01-auth-columns.sql aplicado y public._import_auth_users cargada desde auth.users.
BEGIN;

-- 1) Credenciales y metadata que vivían en auth.users (hash bcrypt compatible con bcryptjs).
UPDATE public.profile p
SET password_hash = u.encrypted_password
FROM public._import_auth_users u
WHERE u.id = p.credential_id
  AND p.password_hash IS NULL
  AND u.encrypted_password LIKE '$2%';

UPDATE public.profile p
SET email_verified_at = u.email_confirmed_at,
    last_sign_in_at   = u.last_sign_in_at,
    phone             = u.phone,
    metadata          = COALESCE(u.raw_user_meta_data, '{}'::jsonb),
    cuil              = NULLIF(u.raw_user_meta_data->>'cuil', '')
FROM public._import_auth_users u
WHERE u.id = p.credential_id;

-- 2) Claves foráneas hacia auth.users
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conrelid::regclass AS tbl, conname
    FROM pg_constraint
    WHERE contype = 'f' AND confrelid = 'auth.users'::regclass
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
  END LOOP;
END $$;

-- 3) Defaults que dependían de Supabase
ALTER TABLE public.vehicles       ALTER COLUMN user_id     DROP DEFAULT;
ALTER TABLE public.diagrams_logs  ALTER COLUMN modified_by DROP DEFAULT;
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_default LIKE 'extensions.uuid_generate_v4()%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET DEFAULT uuid_generate_v4()', r.table_name, r.column_name);
  END LOOP;
END $$;

-- 4) RLS: el acceso es siempre por Prisma con un único rol, se deja todo sin políticas.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- 5) Funciones que dependen de Supabase (pg_net, cron, auth.users) o que ya no se usan
DROP FUNCTION IF EXISTS public.get_company_users_by_cuil(uuid);
DROP FUNCTION IF EXISTS public.create_user_for_external_login();
DROP FUNCTION IF EXISTS public.schedule_notifications_cron(text, text, text);
DROP FUNCTION IF EXISTS public.unschedule_notifications_cron();
DROP FUNCTION IF EXISTS public.pruebaemail();
DROP FUNCTION IF EXISTS public.verificar_documentos_vencidos_prueba();
DROP FUNCTION IF EXISTS public.enviar_documentos_vencidos();
DROP FUNCTION IF EXISTS public.enviar_documentos_a_46_dias();
DROP FUNCTION IF EXISTS public.migrate_document(uuid, boolean);
DROP FUNCTION IF EXISTS public.migrate_documents_preview();

-- 6) Restos del andamiaje
DROP TABLE IF EXISTS public._import_auth_users;
DROP SCHEMA IF EXISTS extensions CASCADE;
DROP SCHEMA IF EXISTS auth CASCADE;

COMMIT;
