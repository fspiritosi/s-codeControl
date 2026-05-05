-- ================================================================
-- CRON DE NOTIFICACIONES (Fase 7)
-- ================================================================
-- Habilita las extensiones pg_cron y pg_net en Supabase, y crea una
-- función helper para registrar el job que dispara HTTP al route
-- handler de Next.js (/api/cron/notifications).
--
-- El job NO se registra automáticamente desde acá porque la URL del
-- entorno y el secret no son conocidos en la migración. Se registra
-- una vez por entorno con:
--
--   SELECT public.schedule_notifications_cron(
--     'https://app.codecontrol.com.ar/api/cron/notifications',
--     '<CRON_SECRET>',
--     '0 8 * * *'  -- 08:00 UTC diariamente
--   );
--
-- Para desprogramar:
--   SELECT public.unschedule_notifications_cron();
-- ================================================================

BEGIN;

-- Extensiones (idempotentes)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Permitir invocar las funciones desde el rol postgres (default en Supabase).
-- Si tu schema usa otro rol para deploys, ajustá los GRANTS.

CREATE OR REPLACE FUNCTION public.schedule_notifications_cron(
  app_url     text,
  cron_secret text,
  schedule    text DEFAULT '0 8 * * *'
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_id bigint;
BEGIN
  -- Si ya existía un job con el mismo nombre, eliminarlo primero (re-schedule).
  PERFORM cron.unschedule('daily-notifications')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-notifications');

  -- Programar nuevo job. La llamada HTTP usa pg_net (asincrónico).
  SELECT cron.schedule(
    'daily-notifications',
    schedule,
    format(
      $sql$
      SELECT net.http_post(
        url     := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body    := '{}'::jsonb
      )
      $sql$,
      app_url,
      cron_secret
    )
  ) INTO job_id;

  RETURN job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.unschedule_notifications_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM cron.unschedule('daily-notifications')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-notifications');
END;
$$;

COMMIT;
