/**
 * Claves estables de los PDFs que se pueden firmar.
 * Cuando agreguemos un nuevo template firmable, sumar la clave acá.
 */
export const SIGNABLE_PDF_KEYS = [
  { key: 'purchase-order', label: 'Órdenes de compra' },
  { key: 'withdrawal-order', label: 'Retiros de mercadería' },
] as const;

export type SignablePdfKey = (typeof SIGNABLE_PDF_KEYS)[number]['key'];

export interface PdfSettingsData {
  header_text: string | null;
  footer_text: string | null;
  signature_image_url: string | null;
  signed_pdf_keys: string[];
}
