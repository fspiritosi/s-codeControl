import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Health check del contenedor y del deploy (docs/deploy/runbook.md).
 *
 * Devuelve el commit con el que se construyó la imagen (`ARG GIT_SHA` del Dockerfile): el
 * contenedor viejo también responde "ok", así que el deploy compara el `sha` para saber que ya
 * rotó al nuevo. No toca la base y no requiere sesión (el proxy solo cubre /dashboard y /admin).
 */
export function GET() {
  return NextResponse.json({ status: 'ok', sha: process.env.GIT_SHA ?? '' });
}
