/**
 * Plantilla del email enviado al proveedor cuando una OP es marcada como Pagada.
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentOrderPaidEmailItem {
  fullNumber: string;
  appliedAmount: number;
}

interface PaymentOrderPaidEmailInput {
  supplierName: string;
  orderNumber: string;
  orderDate: Date | string;
  total: number;
  currency: string;
  items: PaymentOrderPaidEmailItem[];
  companyName: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

function fmtAmount(n: number, currency: string): string {
  const sign = currency === 'ARS' ? '$' : `${currency} `;
  return `${sign}${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function paymentOrderPaidEmail(input: PaymentOrderPaidEmailInput): RenderedEmail {
  const { supplierName, orderNumber, orderDate, total, currency, items, companyName } = input;
  const formattedDate = format(new Date(orderDate), "dd 'de' MMMM 'de' yyyy", { locale: es });
  const subject = `Orden de Pago Nº ${orderNumber} - ${companyName}`;

  const itemsRows =
    items.length > 0
      ? items
          .map(
            (it) => `
            <tr>
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:13px;">${it.fullNumber}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-family:monospace;font-size:13px;">${fmtAmount(it.appliedAmount, currency)}</td>
            </tr>`
          )
          .join('')
      : `<tr><td colspan="2" style="padding:6px 8px;color:#6b7280;font-style:italic;">Pago sin facturas asociadas</td></tr>`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;color:#333;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:6px;overflow:hidden;">
          <tr>
            <td style="padding:24px;">
              <h2 style="margin:0 0 16px 0;color:#0f172a;font-size:20px;">Confirmación de pago</h2>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.5;">Estimado/a ${supplierName},</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.5;">
                Le confirmamos el pago correspondiente a la <strong>Orden de Pago Nº ${orderNumber}</strong>
                de fecha ${formattedDate} por un total de <strong>${fmtAmount(total, currency)}</strong>.
              </p>

              <h3 style="margin:20px 0 8px 0;color:#0f172a;font-size:14px;">Comprobantes cancelados</h3>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid #e5e7eb;">
                <thead>
                  <tr style="background-color:#f1f5f9;">
                    <th align="left" style="padding:8px;font-size:13px;border-bottom:1px solid #e5e7eb;">Comprobante</th>
                    <th align="right" style="padding:8px;font-size:13px;border-bottom:1px solid #e5e7eb;">Importe aplicado</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
                <tfoot>
                  <tr>
                    <td style="padding:8px;font-weight:bold;font-size:13px;border-top:2px solid #0f172a;">Total</td>
                    <td style="padding:8px;text-align:right;font-weight:bold;font-family:monospace;font-size:13px;border-top:2px solid #0f172a;">${fmtAmount(total, currency)}</td>
                  </tr>
                </tfoot>
              </table>

              <p style="margin:20px 0 12px 0;font-size:14px;line-height:1.5;">
                Adjuntamos el comprobante en formato PDF.
              </p>
              <p style="margin:24px 0 0 0;font-size:15px;line-height:1.5;">
                Saludos cordiales,<br/>
                <strong>${companyName}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background-color:#f8f8f8;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.4;">
                Este correo fue generado automáticamente al marcarse la orden como pagada.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html };
}
