import { z } from 'zod';

/**
 * Resultado de la extracción de datos de una factura de compra por AI.
 *
 * Todos los campos de cabecera son `string | null` (o `number | null` para
 * importes), porque la AI puede no encontrar un dato en el comprobante. El
 * mapeo a los campos del formulario (`purchaseInvoiceSchema`) se hace en un
 * lote posterior; acá solo describimos lo que la AI devuelve "crudo".
 *
 * `voucher_type` se devuelve como string libre (ej. "FACTURA_A"); el prompt le
 * pide a la AI que use uno de los valores válidos del enum de comprobantes,
 * pero NO lo validamos contra el enum acá para no perder la extracción si la AI
 * devuelve algo levemente distinto. La normalización es responsabilidad del
 * mapeo posterior.
 */
export const ExtractedInvoiceLineSchema = z.object({
  description: z.string().nullable(),
  quantity: z.number().nullable(),
  unit_cost: z.number().nullable(),
  vat_rate: z.number().nullable(),
});

export const ExtractedInvoiceSchema = z.object({
  razon_social: z.string().nullable(),
  cuit: z.string().nullable(),
  voucher_type: z.string().nullable(),
  point_of_sale: z.string().nullable(),
  number: z.string().nullable(),
  issue_date: z.string().nullable(),
  due_date: z.string().nullable(),
  cae: z.string().nullable(),
  total: z.number().nullable(),
  lines: z.array(ExtractedInvoiceLineSchema),
});

export type ExtractedInvoiceLine = z.infer<typeof ExtractedInvoiceLineSchema>;
export type ExtractedInvoice = z.infer<typeof ExtractedInvoiceSchema>;

/**
 * Archivo de entrada para los providers de extracción: el contenido ya
 * convertido a base64 (sin el prefijo `data:`) y su MIME type.
 */
export interface ExtractionFileInput {
  base64: string;
  mimeType: string;
}
