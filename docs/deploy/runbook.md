# Runbook de deploy (Dokploy, clon)

## Arquitectura

```
push a migracion/dokploy ──► changes (filtro de paths: docs, *.md, .claude… no disparan)
                 ├─► verify: npm ci + prisma generate + check-types   (en paralelo)
                 └─► build:  imagen :sha-<commit> con GIT_SHA adentro → registry
                        │
                        ▼ (solo si verify y build pasaron)
                 deploy: retag :sha-<commit> → :dokploy  →  webhook de Dokploy
                         → espera a que /api/health responda {"status":"ok","sha":"<commit>"}
```

- La VPS no buildea: la imagen se construye en GitHub Actions y se publica en
  `registry-31-97-42-82.sslip.io/codecontrol`. Dokploy solo hace pull de `:dokploy`.
- Una imagen por commit (`:sha-<commit>`, inmutable). `:dokploy` es un puntero que mueve el job `deploy`.
  Si la imagen del commit ya existe (rerun, dispatch), no se reconstruye.
- El readiness compara el `sha` de `/api/health`, no solo `"ok"` (el contenedor viejo también responde sano).
- Sin tests ni jobs de base (pedido del dueño). `ci.yml` hace `check-types` y un lint informativo.
- **No hay migraciones automáticas**: el repo no tiene `prisma/migrations`. La base viene del cutover
  (ver abajo) y el contenedor solo levanta `node server.js`.

| Archivo | Qué hace |
| --- | --- |
| `.github/workflows/deploy.yml` | Orquesta: filtro, `verify`, `build`, `deploy`. También `workflow_dispatch` (solo sobre `migracion/dokploy`). |
| `.github/workflows/_build-image.yml` | Build + push de `:sha-<commit>`, cache en registry, soporte Blacksmith. |
| `.github/workflows/_deploy.yml` | Retag, webhook, readiness por commit. |
| `.github/workflows/ci.yml` | `check-types` + lint informativo en push/PR a `dev` y `migracion/dokploy`. |
| `Dockerfile`, `.dockerignore`, `docker/entrypoint.sh` | `deps` → `build` → `runner` (standalone, usuario no root). |
| `src/app/api/health/route.ts` | `{"status":"ok","sha":GIT_SHA}`, sin tocar la base. |

## GitHub: variables y secrets

**Settings → Secrets and variables → Actions.**

Secrets:

| Secret | Valor |
| --- | --- |
| `REGISTRY_PASSWORD` | Password del usuario CI del registry. |
| `DOKPLOY_DEPLOY_WEBHOOK` | Webhook URL de deploy de la app en Dokploy (Deployments → Webhook URL). |

Variables (las `NEXT_PUBLIC_*` se hornean en el bundle durante el build; cambiarlas exige imagen nueva):

| Variable | Valor | Obligatoria |
| --- | --- | --- |
| `REGISTRY_USERNAME` | Usuario CI del registry (variable, no secret: GitHub enmascararía substrings en los logs). | sí |
| `DOKPLOY_HEALTH_URL` | URL completa terminada en `/api/health` del clon. | sí |
| `NEXT_PUBLIC_BASE_URL` | URL pública del clon, sin barra final. Se usa en links de mails y recuperación de contraseña. | sí |
| `NEXT_PUBLIC_PROJECT_URL` | Misma URL pública. | sí |
| `NEXT_PUBLIC_APP_URL` | Misma URL pública (links en mails de capacitaciones HSE). | sí |
| `NEXT_PUBLIC_STORAGE_DRIVER` | `s3`. Vacío = el navegador usaría Supabase Storage. | sí |
| `NEXT_PUBLIC_STORAGE_PUBLIC_URL` | Base pública del bucket S3 (igual a `STORAGE_PUBLIC_URL` de runtime). | sí |
| `NEXT_PUBLIC_SHOW_LOGS` | `false` (default si no se carga). | no |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Solo si el clon todavía usa el driver `supabase`. Con `s3` no se cargan. | no |
| `CI_RUNNER` | Vacía = `ubuntu-latest`. Con `blacksmith-2vcpu-ubuntu-2404` el build (y `ci.yml`) corre en Blacksmith. `deploy` siempre corre en GitHub. | no |

Si falta una obligatoria, el workflow corta antes de gastar minutos de build (y el Dockerfile repite el chequeo).

## Dokploy

- Provider **Docker**, imagen `registry-31-97-42-82.sslip.io/codecontrol:dokploy` con credenciales del registry.
  Un Redeploy manual no trae código nuevo: solo vuelve a pullear el tag.
- **Autodeploy ON** (para que exista el webhook). Puerto 3000, dominio con HTTPS.
- El `HEALTHCHECK` de la imagen pega a `/api/health`.

### Env de runtime de la app

Revisado con `grep process.env` sobre `src/`, `prisma.config.ts` y `next.config.js`.

| Variable | Nota |
| --- | --- |
| `DATABASE_URL` | `postgresql://user:pass@<servicio-postgres>:5432/<db>`. Único uso de la base (pool `pg` + `prisma.config.ts`). |
| `AUTH_SECRET` | NextAuth v5. `openssl rand -base64 32`. Cambiarla cierra todas las sesiones. (`NEXTAUTH_SECRET` es alias, usar `AUTH_SECRET`.) |
| `AUTH_TRUST_HOST` | `true`: detrás de Traefik NextAuth rechaza el host si no está. |
| `AUTH_URL` | Opcional; URL pública si el host detectado no coincide (`NEXTAUTH_URL` es alias). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Login con Google. En el redirect URI de Google hay que agregar `<URL>/api/auth/callback/google`. |
| `SMTP_HOST`, `SMTP_PORT` (def. 465), `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` | Envío de mails; `SMTP_USER` es también el remitente. |
| `EMAIL_FROM_NAME` | Nombre del remitente (def. `CodeControl`). |
| `MAIL_MODE` | `off` = no envía nada; `redirect` = todo a `MAIL_REDIRECT_TO`; vacío = envío real. Para el clon de pruebas usar `off` o `redirect`. |
| `MAIL_REDIRECT_TO` | Casilla de destino cuando `MAIL_MODE=redirect`. |
| `CRON_SECRET` | Header `x-cron-secret` de `/api/cron/*`. Vacío = esos endpoints responden 500. |
| `ENCRYPTION_KEY` | Obligatoria: cifra las API keys de IA guardadas en la base. **Debe ser la misma que en Vercel** si se migra la base, o no se podrán descifrar. |
| `STORAGE_DRIVER` | `s3`. |
| `S3_ENDPOINT` | Ej. `http://<servicio-minio>:9000`. |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Credenciales del bucket. |
| `S3_REGION` | Def. `us-east-1`. |
| `STORAGE_PUBLIC_URL` | Base pública del storage (igual a `NEXT_PUBLIC_STORAGE_PUBLIC_URL`). Los buckets se llaman como en Supabase con `_` → `-` (`document-files`, …) y deben existir. |
| `TASKAPP_BASE_URL` / `TASKAPP_PROJECT_API_KEY` | Centro de Ayuda (opcional). |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Fallback de IA para facturas (opcional; el proveedor se configura en la UI). |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Solo con `STORAGE_DRIVER=supabase`. Con `s3` no cargar. |

`GIT_SHA`, `NODE_ENV`, `PORT` y `HOSTNAME` los fija la imagen. `TZ` solo lo usan los tests.
`RESEND_SUPABASE_API_KEY` y `SUPABASE_SERVICE_KEY` aparecen en `.env.example`/scripts pero no en la app.

### Crons

Schedules de Dokploy (creados pausados hasta el go-live) con `POST` y header `x-cron-secret: $CRON_SECRET`.
Detalle en `docs/cron.md`.

## Cutover de la base

El Postgres del clon se restaura desde un dump de Supabase (pg_cron figura como extensión en el
schema). Después hay que aplicar el SQL de reemplazo de `auth.users`, **una vez**:

```bash
psql "$DATABASE_URL" -f prisma/cutover/01-auth-columns.sql
```

(Desde la terminal del servicio Postgres en Dokploy o desde la VPS; el archivo no está en la imagen,
copiarlo o pegarlo.) El archivo indica además que el DROP de las FK a `auth.users` y el ajuste de
`user_table_preferences` van **después del restore**. Prisma no gestiona migraciones acá: no
correr `prisma migrate deploy` ni `db push` contra esa base.

## Operación

- **Deploy normal**: push a `migracion/dokploy`. Un push de solo docs no dispara nada.
- **Redeploy del mismo commit**: Actions → deploy → Run workflow (no reconstruye).
- **Cambiar una `NEXT_PUBLIC_*`**: cambiar la variable y pushear un commit.
- **Rollback**: `docker buildx imagetools create -t registry-31-97-42-82.sslip.io/codecontrol:dokploy registry-31-97-42-82.sslip.io/codecontrol:sha-<commit-bueno>` y Redeploy.
- **Verificar**: `gh run list --workflow deploy.yml` y `curl <DOKPLOY_HEALTH_URL>` comparando `sha` con el commit.

## Go-live

1. En `deploy.yml` y `ci.yml`: cambiar `migracion/dokploy` por `main` (marcado `RAMA DE DEPLOY`, 3 lugares en `deploy.yml`).
2. Decidir el tag promovido (`:dokploy` o `:main`) y alinear la imagen en Dokploy.
3. Pasar los Schedules de cron a activos y pausar los de Supabase.
4. Limpieza del registry: sumar `codecontrol` al Scheduled Task global (proteger digests de `:dokploy`/`:main` y `buildcache`).
