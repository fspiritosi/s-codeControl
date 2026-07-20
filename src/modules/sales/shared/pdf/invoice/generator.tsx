/**
 * Generador de PDFs de Facturas de Venta.
 * SERVER-ONLY: usa renderToBuffer de @react-pdf/renderer.
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceTemplate } from './InvoiceTemplate';
import { mapSalesInvoiceDataForPDF } from './data-mapper';
import { getSalesInvoiceById } from '@/modules/sales/features/invoices/list/actions.server';
import { getCompanyDataForPDF } from '@/shared/actions/export';
import type { SalesCompanyPDFData } from '../types';

export interface GeneratedPDF {
  buffer: Buffer;
  fileName: string;
}

/**
 * Genera el PDF de una factura de venta a partir de su id.
 * Valida la pertenencia a la empresa vía getSalesInvoiceById (scope por cookie actualComp).
 * Retorna null si la factura no existe / no pertenece a la empresa.
 */
export async function generateSalesInvoicePDF(id: string): Promise<GeneratedPDF | null> {
  const invoice = await getSalesInvoiceById(id);
  if (!invoice) return null;

  const companyRaw = await getCompanyDataForPDF();
  const company: SalesCompanyPDFData = {
    name: companyRaw?.name ?? '',
    logo: companyRaw?.logo ?? null,
    cuit: companyRaw?.cuit ?? '',
    address: companyRaw?.address ?? '',
    phone: companyRaw?.phone || undefined,
    email: companyRaw?.email || undefined,
  };

  const data = mapSalesInvoiceDataForPDF(invoice as any, company);
  const buffer = await renderToBuffer(<InvoiceTemplate data={data} />);

  const number = (data.invoice.fullNumber || 'factura').replace(/[^0-9A-Za-z]/g, '_');
  const fileName = `Factura_${number}.pdf`;

  return { buffer, fileName };
}
