#!/bin/sh
# Arranque del contenedor: no hay migraciones automaticas (el repo no tiene prisma/migrations;
# la base viene del cutover, ver docs/deploy/runbook.md). Solo levanta Next.
set -e
echo "[entrypoint] arrancando Next standalone en ${HOSTNAME:-0.0.0.0}:${PORT:-3000}..."
exec node server.js
