/**
 * Claves estables de los PDFs que se pueden firmar.
 * Cuando agreguemos un nuevo template firmable, sumar la clave acá.
 */
export const SIGNABLE_PDF_KEYS = [
  { key: 'purchase-order', label: 'Órdenes de compra' },
  { key: 'withdrawal-order', label: 'Retiros de mercadería' },
  { key: 'payment-order', label: 'Órdenes de pago' },
] as const;

export type SignablePdfKey = (typeof SIGNABLE_PDF_KEYS)[number]['key'];

export interface PdfSettingsData {
  header_text: string | null;
  footer_text: string | null;
  signature_image_url: string | null;
  signed_pdf_keys: string[];
}

/**
 * Claves de PDFs que se pueden enviar por mail. Para cada una se puede
 * configurar un from_email + from_name; si no, fallback al contact_email
 * de la empresa.
 */
export const EMAILABLE_PDF_KEYS = [
  { key: 'purchase-order', label: 'Órdenes de compra' },
  { key: 'payment-order', label: 'Órdenes de pago' },
  { key: 'withdrawal-order', label: 'Retiros de mercadería' },
] as const;

export type EmailablePdfKey = (typeof EMAILABLE_PDF_KEYS)[number]['key'];

export interface PdfEmailSetting {
  pdf_key: string;
  from_email: string;
  from_name: string | null;
}
