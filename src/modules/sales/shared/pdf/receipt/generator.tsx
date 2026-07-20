/**
 * Generador de PDFs de Recibos de Cobro.
 * SERVER-ONLY: usa renderToBuffer de @react-pdf/renderer.
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { ReceiptTemplate } from './ReceiptTemplate';
import { mapReceiptDataForPDF } from './data-mapper';
import { getReceiptById } from '@/modules/sales/features/receipts/list/actions.server';
import { getCompanyDataForPDF } from '@/shared/actions/export';
import type { SalesCompanyPDFData } from '../types';
import type { GeneratedPDF } from '../invoice/generator';

/**
 * Genera el PDF de un recibo de cobro a partir de su id.
 * Valida la pertenencia a la empresa vía getReceiptById (scope por cookie actualComp).
 * Retorna null si el recibo no existe / no pertenece a la empresa.
 */
export async function generateReceiptPDF(id: string): Promise<GeneratedPDF | null> {
  const receipt = await getReceiptById(id);
  if (!receipt) return null;

  const companyRaw = await getCompanyDataForPDF();
  const company: SalesCompanyPDFData = {
    name: companyRaw?.name ?? '',
    logo: companyRaw?.logo ?? null,
    cuit: companyRaw?.cuit ?? '',
    address: companyRaw?.address ?? '',
    phone: companyRaw?.phone || undefined,
    email: companyRaw?.email || undefined,
  };

  const data = mapReceiptDataForPDF(receipt as any, company);
  const buffer = await renderToBuffer(<ReceiptTemplate data={data} />);

  const number = (data.receipt.fullNumber || 'recibo').replace(/[^0-9A-Za-z]/g, '_');
  const fileName = `Recibo_${number}.pdf`;

  return { buffer, fileName };
}
