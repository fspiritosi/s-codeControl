import { prisma } from '@/shared/lib/prisma';

/** Recalcula el estado de los documentos (vigente / por vencer / vencido). Reemplaza al job pg_cron 5. */
export async function runDocumentStates() {
  await prisma.$executeRaw`SELECT public.actualizar_estado_documentos()`;
  await prisma.$executeRaw`SELECT public.check_and_expire_documents()`;
  return { ok: true };
}

/** Cierra los exámenes HSE vencidos. Reemplaza al job pg_cron close-expired-exams. */
export async function runCloseExpiredExams() {
  const rows = await prisma.$queryRaw<{ result: unknown }[]>`SELECT public.close_expired_exams() AS result`;
  return { ok: true, result: rows[0]?.result ?? null };
}
