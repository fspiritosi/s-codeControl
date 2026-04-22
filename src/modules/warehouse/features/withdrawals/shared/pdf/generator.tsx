/**
 * Generador de PDFs de Ordenes de Retiro de Mercaderia (ORM)
 * SERVER-ONLY: usa renderToBuffer de @react-pdf/renderer.
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { WithdrawalOrderTemplate } from './WithdrawalOrderTemplate';
import type { WithdrawalOrderPDFData } from './types';

/**
 * Genera un PDF de orden de retiro y lo retorna como Buffer
 */
export async function generateWithdrawalOrderPDF(
  data: WithdrawalOrderPDFData
): Promise<Buffer> {
  try {
    const buffer = await renderToBuffer(
      <WithdrawalOrderTemplate data={data} />
    );
    return buffer;
  } catch (error) {
    console.error('Error generating withdrawal order PDF:', error);
    throw new Error('Error al generar el PDF de la orden de retiro');
  }
}

/**
 * Genera el nombre de archivo para el PDF
 */
export function getWithdrawalOrderFileName(
  data: WithdrawalOrderPDFData
): string {
  const number = data.withdrawalOrder.fullNumber.replace(/-/g, '_');
  const date = new Date().toISOString().split('T')[0];

  return `Orden_Retiro_${number}_${date}.pdf`;
}
