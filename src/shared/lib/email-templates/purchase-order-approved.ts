/**
 * Plantilla simple para el email enviado al proveedor cuando se aprueba una OC.
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PurchaseOrderApprovedEmailInput {
  supplierName: string;
  orderNumber: string;
  orderDate: Date | string;
  companyName: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function purchaseOrderApprovedEmail(
  input: PurchaseOrderApprovedEmailInput
): RenderedEmail {
  const { supplierName, orderNumber, orderDate, companyName } = input;

  const formattedDate = format(new Date(orderDate), "dd 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  const subject = `Orden de Compra Nº ${orderNumber} - ${companyName}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;color:#333;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:6px;overflow:hidden;">
          <tr>
            <td style="padding:24px;">
              <h2 style="margin:0 0 16px 0;color:#1f2937;font-size:20px;">Nueva orden de compra aprobada</h2>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.5;">Estimado/a ${supplierName},</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.5;">
                Le enviamos adjunta la Orden de Compra Nº <strong>${orderNumber}</strong> aprobada con fecha ${formattedDate}.
              </p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.5;">
                Por consultas, responda a este correo.
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
                Este correo fue generado automáticamente al aprobarse la orden de compra. El PDF de la orden se adjunta a este mensaje.
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
