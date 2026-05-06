import type { Prisma } from '@/generated/prisma/client';

/**
 * Asigna un número secuencial al comprobante de retención dentro de una
 * transacción Prisma. Inserta o actualiza la fila en
 * retention_certificate_sequences atómicamente.
 *
 * Devuelve el número formateado como string padded a 8 dígitos
 * (ej. "00000123") para usar como certificate_number.
 */
export async function nextCertificateNumber(
  tx: Prisma.TransactionClient,
  companyId: string,
  taxTypeId: string
): Promise<string> {
  // Upsert con incremento atómico. Si la row ya existía suma 1; si no,
  // la crea con last_number = 1.
  const seq = await tx.retention_certificate_sequences.upsert({
    where: {
      company_id_tax_type_id: { company_id: companyId, tax_type_id: taxTypeId },
    },
    update: { last_number: { increment: 1 }, updated_at: new Date() },
    create: { company_id: companyId, tax_type_id: taxTypeId, last_number: 1 },
    select: { last_number: true },
  });

  return String(seq.last_number).padStart(8, '0');
}
