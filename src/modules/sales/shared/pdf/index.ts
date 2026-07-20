/**
 * Barrel de generación de PDFs del módulo de Ventas (facturas y recibos).
 * SERVER-ONLY: los generadores usan renderToBuffer de @react-pdf/renderer.
 */

export { generateSalesInvoicePDF } from './invoice/generator';
export { mapSalesInvoiceDataForPDF } from './invoice/data-mapper';
export { InvoiceTemplate } from './invoice/InvoiceTemplate';

export { generateReceiptPDF } from './receipt/generator';
export { mapReceiptDataForPDF } from './receipt/data-mapper';
export { ReceiptTemplate } from './receipt/ReceiptTemplate';

export type { GeneratedPDF } from './invoice/generator';
export type {
  SalesInvoicePDFData,
  ReceiptPDFData,
  SalesCompanyPDFData,
  SalesCustomerPDFData,
} from './types';
