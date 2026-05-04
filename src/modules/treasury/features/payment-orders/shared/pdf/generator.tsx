import { renderToBuffer } from '@react-pdf/renderer';
import { PaymentOrderTemplate } from './PaymentOrderTemplate';
import type { PaymentOrderPDFData } from './types';

export async function generatePaymentOrderPDF(data: PaymentOrderPDFData): Promise<Buffer> {
  const buffer = await renderToBuffer(<PaymentOrderTemplate data={data} />);
  return buffer;
}

export function getPaymentOrderFileName(data: PaymentOrderPDFData): string {
  const number = data.paymentOrder.fullNumber.replace(/-/g, '_');
  const date = new Date().toISOString().split('T')[0];
  return `Orden_Pago_${number}_${date}.pdf`;
}
