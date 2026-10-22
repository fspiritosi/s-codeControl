# Crons (sin Supabase)

Los jobs corren desde el scheduler de Dokploy (Schedules del proyecto CodeControl), que llama por HTTP a la app con el header `x-cron-secret: $CRON_SECRET`. Ya no se usa `pg_cron` ni `pg_net`.

| Endpoint | Horario (UTC) | Qué hace | Estado en Supabase prod |
|---|---|---|---|
| `POST /api/cron/document-states` | `1 0 * * *` y `0 3 * * *` | `actualizar_estado_documentos()` + `check_and_expire_documents()` | activos |
| `POST /api/cron/exams` | `*/5 * * * *` | `close_expired_exams()` | **inactivo** (no activarlo sin pedirlo) |
| `POST /api/cron/notifications` | `0 8 * * *` | notificaciones y mails de documentos por vencer/vencidos, OC y OP | **nunca se programó** |

Los jobs `documentos_vencidos` y `enviar mails documentos a vencer` de Supabase fallaban todos los días
(`column e.profile_id does not exist`) y dependían de una Edge Function que desaparece con el proyecto, por eso no se portaron.

Los schedules del clon se crean **pausados** y se activan recién en el go-live, a la vez que se pausan los de Supabase,
para que nunca corran los dos entornos a la vez.
