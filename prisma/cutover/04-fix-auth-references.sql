-- Funciones que seguían usando el esquema `auth` de Supabase (auth.uid(), auth.jwt(), auth.users).
-- Sin esto fallan con `schema "auth" does not exist`: crear tipos de documento obligatorios y crear/editar solicitudes de mantenimiento.
-- Idempotente. El usuario que modifica ya no se conoce desde la base: queda NULL (la app guarda el autor en sus propias acciones).
BEGIN;

DO $$
DECLARE d text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO d FROM pg_proc p
   WHERE p.proname = 'controlar_alertas_documentos' AND p.pronamespace = 'public'::regnamespace;
  IF d IS NOT NULL AND d LIKE '%auth.jwt()%' THEN
    EXECUTE replace(d, 'user_jwt := auth.jwt();', 'user_jwt := NULL::jsonb;');
  END IF;

  SELECT pg_get_functiondef(p.oid) INTO d FROM pg_proc p
   WHERE p.proname = 'log_repair_changes' AND p.pronamespace = 'public'::regnamespace;
  IF d IS NOT NULL AND d LIKE '%auth.uid()%' THEN
    EXECUTE replace(d, '(SELECT auth.uid())', 'NULL::uuid');
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.validate_user_password(text);

COMMIT;
