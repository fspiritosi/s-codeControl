import { NextRequest, NextResponse } from 'next/server';
import { checkCronSecret } from '@/shared/lib/cron/auth';
import { runCloseExpiredExams } from '@/shared/lib/cron/jobs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const denied = checkCronSecret(req);
  if (denied) return denied;
  try {
    return NextResponse.json(await runCloseExpiredExams());
  } catch (error) {
    console.error('[cron/exams]', error);
    return NextResponse.json({ error: 'cron_failed' }, { status: 500 });
  }
}
