/**
 * GET /api/retention-certificates/:id/pdf
 * Devuelve el PDF del comprobante de retención asociado a una línea
 * payment_order_retentions ya numerada (OP confirmada).
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  buildRetentionCertificateData,
  generateRetentionCertificatePDF,
  getRetentionCertificateFileName,
} from '@/modules/treasury/features/payment-orders/shared/retention-certificate';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieStore = await cookies();
    const companyId = cookieStore.get('actualComp')?.value;
    if (!companyId) {
      return NextResponse.json({ error: 'No hay empresa activa' }, { status: 400 });
    }

    const data = await buildRetentionCertificateData(id, companyId);
    if (!data) {
      return NextResponse.json(
        { error: 'Comprobante no encontrado o aún no numerado' },
        { status: 404 }
      );
    }

    const pdfBuffer = await generateRetentionCertificatePDF(data);
    const fileName = getRetentionCertificateFileName(data);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generando comprobante de retención:', error);
    return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 });
  }
}
