import type { Prisma } from '@/generated/prisma/client';

/**
 * Asigna el próximo número correlativo para (punto de venta + tipo de comprobante),
 * incrementando la secuencia de forma atómica. Debe ejecutarse dentro de una transacción.
 *
 * La secuencia guarda `next_number` = el número que se asignará la próxima vez.
 * El usuario puede configurar ese valor inicial por tipo (ver config de puntos de venta).
 * Si la secuencia no existe todavía, arranca en 1.
 */
export async function assignNextSalesNumber(
  tx: Prisma.TransactionClient,
  pointOfSaleId: string,
  voucherType: string
): Promise<number> {
  const seq = await tx.sales_number_sequences.upsert({
    where: {
      point_of_sale_id_voucher_type: {
        point_of_sale_id: pointOfSaleId,
        voucher_type: voucherType as any,
      },
    },
    update: { next_number: { increment: 1 } },
    create: { point_of_sale_id: pointOfSaleId, voucher_type: voucherType as any, next_number: 2 },
  });
  // `next_number` devuelto es el valor POSTERIOR al incremento → el asignado es el anterior.
  return seq.next_number - 1;
}

/** Compone el número completo "PPPPP-NNNNNNNN" (punto de venta - correlativo). */
export function formatSalesFullNumber(pointOfSaleNumber: number, number: number): string {
  return `${String(pointOfSaleNumber).padStart(5, '0')}-${String(number).padStart(8, '0')}`;
}
