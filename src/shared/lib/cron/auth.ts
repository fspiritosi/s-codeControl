import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/** Valida el header `x-cron-secret` contra CRON_SECRET. Devuelve una respuesta de error o null si pasa. */
export function checkCronSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 });

  const provided = Buffer.from(req.headers.get('x-cron-secret') ?? '');
  const wanted = Buffer.from(expected);
  if (provided.length !== wanted.length || !timingSafeEqual(provided, wanted)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return null;
}
