# Cron de notificaciones

Job diario que evalúa documentos por vencer/vencidos, OC pendientes de aprobación y OP pendientes de confirmación, y crea notificaciones agregadas por empresa para los usuarios con el permiso correspondiente.

## Arquitectura

```
Supabase pg_cron (cron.schedule)
    └─ pg_net.http_post  →  https://<APP_URL>/api/cron/notifications
                              header: x-cron-secret: <CRON_SECRET>
                              ↓
                            Next.js route handler
                              ↓
                            createNotification(...) por empresa
                              · dedupe_key por día → no duplica
                              · fan-out a usuarios con el permiso requerido
```

La lógica vive en TypeScript ([src/app/api/cron/notifications/route.ts](../src/app/api/cron/notifications/route.ts)). Supabase es solo el scheduler.

## Variables de entorno

```bash
# .env / Vercel env
CRON_SECRET=<string aleatorio largo>
```

Cualquier llamada al endpoint sin este header (o con valor distinto) recibe `401`.

## Activación

### Local (Supabase local)

1. Asegurate de tener `CRON_SECRET` en `.env`.
2. Las extensiones `pg_cron` y `pg_net` ya las habilita la migración `20260505153359_enable_cron_for_notifications.sql`.
3. Para programar el job apuntando al dev server (puerto 3000):

```sql
SELECT public.schedule_notifications_cron(
  'http://host.docker.internal:3000/api/cron/notifications',
  'local-dev-cron-secret-change-in-prod',
  '*/5 * * * *'  -- cada 5 minutos para testing
);
```

> En Supabase local el contenedor de Postgres no resuelve `localhost` → usar `host.docker.internal`.

### Producción

1. Agregar `CRON_SECRET` a Vercel (Production + Preview).
2. Ejecutar **una vez** desde Supabase Studio (SQL editor) o `psql`:

```sql
SELECT public.schedule_notifications_cron(
  'https://<tu-dominio>/api/cron/notifications',
  '<el mismo CRON_SECRET de Vercel>',
  '0 8 * * *'  -- 08:00 UTC diariamente
);
```

3. Verificar que el job quedó programado:

```sql
SELECT * FROM cron.job WHERE jobname = 'daily-notifications';
```

## Operación

### Disparo manual

```bash
curl -X POST https://<APP_URL>/api/cron/notifications \
  -H "x-cron-secret: $CRON_SECRET"
```

Respuesta:

```json
{
  "ok": true,
  "date": "2026-05-05",
  "companies": 3,
  "summary": {
    "documents.expiring_soon": { "created": 2, "skipped": 1 },
    "purchase_orders.pending_approval": { "created": 0, "skipped": 5 }
  }
}
```

`skipped` significa que el `dedupe_key` ya existía (la notificación ya se generó hoy).

### Ver corridas pasadas

```sql
SELECT runid, jobid, status, return_message, start_time, end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### Ver respuestas HTTP

```sql
SELECT id, status_code, content::text, created
FROM net._http_response
ORDER BY created DESC
LIMIT 10;
```

### Re-programar / cambiar horario

Llamar de nuevo a `schedule_notifications_cron(...)` — la función borra el job anterior antes de crear el nuevo.

### Apagar el cron

```sql
SELECT public.unschedule_notifications_cron();
```

## Tipos de notificaciones generados

| Code | Permiso requerido | Trigger en cron |
|---|---|---|
| `documents.expired` | `documentacion.view` | hay documentos con `state='vencido'` o `validity < hoy` |
| `documents.expiring_soon` | `documentacion.view` | hay documentos con `validity` entre hoy y hoy+5 |
| `purchase_orders.pending_approval` | `compras.approve` | una OC por cada `status='PENDING_APPROVAL'` |
| `payment_orders.pending_confirmation` | `tesoreria.confirm` | una OP por cada `status='DRAFT'` |

`dedupe_key` por día (`<code>:<date>` o `<code>:<entity_id>:<date>`) evita duplicar notificaciones si el cron corre más de una vez en el mismo día.
