# Runbook de corte: Supabase → Postgres + RustFS en Dokploy

Ensayado sobre el clon (`codecontrol-clon.31.97.42.82.sslip.io`). Cada paso es repetible. Los archivos de trabajo van en `~/cc-migracion` de la VPS de Dokploy (permisos 700) y se borran al terminar: contienen hashes de contraseñas.

## Antes del día del corte (sin impacto en prod)
1. Bajar el TTL del DNS del dominio a 300 s, 24 h antes como mínimo.
2. Tener cargados en Dokploy: `ENCRYPTION_KEY` (la misma de Vercel), `GOOGLE_CLIENT_ID/SECRET`, `SMTP_*`, y `MAIL_MODE` vacío (mails reales) solo en el momento del corte.
3. En Google Cloud, agregar el redirect URI `https://<dominio-final>/api/auth/callback/google`.
4. Verificar SPF/DKIM del dominio de `SMTP_USER`.
5. Confirmar que Blacksmith (opcional) o los runners de GitHub construyen la rama que va a producción.

## Ventana de mantenimiento (objetivo: < 30 min)
1. **Congelar escrituras en prod.** Poner Vercel en modo mantenimiento (o pausar el dominio). Pausar los crons de Supabase: `update cron.job set active = false` (anotar cuáles estaban activos: ids 5, `documentos_vencidos`, `enviar mails documentos a vencer`, `check-expired-documents-daily`).
2. **Dump de prod** (solo lectura): `pg_dump -Fc -n public --no-owner --no-privileges` con el cliente 15 y `\copy` de `auth.users` (id, email, phone, encrypted_password, email_confirmed_at, last_sign_in_at, raw_user_meta_data), como en `~/cc-migracion` del ensayo.
3. **Restore en el Postgres de Dokploy** sobre un esquema `public` vacío, con los stubs previos (`auth.users(id)`, `auth.uid()`, roles `anon/authenticated/service_role`, `extensions.uuid_generate_v4()`).
4. **Aplicar** `01-auth-columns.sql`, `02-supabase-to-standalone.sql` y `03-storage-urls.sql -v base=<URL pública de RustFS>`.
5. **Delta de storage:** relanzar `sync.mjs` (idempotente; salta lo ya copiado) con un `objects.csv` regenerado desde `storage.objects`. Copiar a mano los buckets privados `costos-pdfs` y `purchase_orders`.
6. **Verificar** conteos (profiles, employees, documentos, vehículos), objetos por bucket, login con un usuario real y con Google, subida y descarga de un archivo, `/api/health`.
7. **Cambiar el DNS** (o el dominio de la app en Dokploy) al clon. Cambiar la rama de deploy a `main` si corresponde (3 lugares marcados `RAMA DE DEPLOY`).
8. **Activar** los schedules de Dokploy (ver `docs/cron.md`) y quitar `MAIL_MODE=off`.
9. Salir de mantenimiento y vigilar 1 hora (errores 5xx, login, mails).

## Rollback
Antes de que entren escrituras en la base nueva: volver el DNS a Vercel, reactivar los crons de Supabase y salir de mantenimiento. Supabase queda intacto. Pasada la primera hora con escrituras nuevas, se arregla hacia adelante.

## Después del corte
- Mantener Supabase en pausa unos días antes de borrarlo.
- Quitar `@supabase/*`, el driver `supabase` de `src/shared/lib/storage*.ts`, `database.types.ts` y `supabase/`.
- Borrar `~/cc-migracion` y el perfil QA (`qa-clon@test.local`) del clon.
- Rotar `ENCRYPTION_KEY`/claves solo si estuvieron expuestas.

## Cuentas sin contraseña
Las 8 cuentas sin `password_hash` entran solo con Google (3 Admin y 5 CodeControlClient): sin las credenciales de Google no pueden ingresar. Alternativa: `requestPasswordReset` con SMTP real.
