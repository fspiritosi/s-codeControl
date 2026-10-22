# syntax=docker/dockerfile:1
# Next.js 16 standalone + Prisma 7. La imagen se construye en GitHub Actions y se publica en el
# registry del VPS: la VPS no buildea (ver docs/deploy/runbook.md).

##### deps #####
FROM node:24-bookworm-slim AS deps
WORKDIR /app
# .npmrc trae legacy-peer-deps=true: sin el, npm ci falla por peer deps.
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts

##### build #####
FROM node:24-bookworm-slim AS build
WORKDIR /app
# openssl: Prisma lo necesita para elegir el binario del engine en slim.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_PROJECT_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SHOW_LOGS=false
ARG NEXT_PUBLIC_STORAGE_DRIVER
ARG NEXT_PUBLIC_STORAGE_PUBLIC_URL
# Solo si el clon todavia usa el driver de storage `supabase` en el navegador. Con
# NEXT_PUBLIC_STORAGE_DRIVER=s3 no se usan y pueden quedar vacias.
ARG NEXT_PUBLIC_SUPABASE_URL=""
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=""
# NODE_OPTIONS: el heap por defecto se queda corto para `next build`. Solo aplica a este stage.
# DATABASE_URL: placeholder para prisma generate / build; no se conecta.
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_PROJECT_URL=$NEXT_PUBLIC_PROJECT_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_SHOW_LOGS=$NEXT_PUBLIC_SHOW_LOGS \
    NEXT_PUBLIC_STORAGE_DRIVER=$NEXT_PUBLIC_STORAGE_DRIVER \
    NEXT_PUBLIC_STORAGE_PUBLIC_URL=$NEXT_PUBLIC_STORAGE_PUBLIC_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=8192
# Las NEXT_PUBLIC_* se hornean en el bundle: sin estas el build pasaria igual y produccion
# quedaria con localhost / storage supabase en silencio. Se corta aca.
RUN for v in NEXT_PUBLIC_BASE_URL NEXT_PUBLIC_PROJECT_URL NEXT_PUBLIC_APP_URL \
             NEXT_PUBLIC_STORAGE_DRIVER NEXT_PUBLIC_STORAGE_PUBLIC_URL; do \
      eval "val=\$$v"; \
      [ -n "$val" ] || { echo "ERROR: falta el build-arg $v"; exit 1; }; \
    done
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN --mount=type=cache,target=/app/.next/cache npx next build

##### runner #####
FROM node:24-bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    CHECKPOINT_DISABLE=1
RUN groupadd -g 1001 nodejs && useradd -m -u 1001 -g nodejs nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Commit de esta imagen, que /api/health devuelve para que el deploy distinga el contenedor nuevo
# del viejo. Va al final a proposito: cambia en cada commit y solo invalida estas ultimas capas.
ARG GIT_SHA=""
ENV GIT_SHA=$GIT_SHA

USER nextjs
EXPOSE 3000
# Sin curl en la imagen slim: el chequeo usa el fetch de Node.
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["./entrypoint.sh"]
