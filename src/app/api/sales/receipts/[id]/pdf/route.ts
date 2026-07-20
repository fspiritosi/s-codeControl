/**
 * API Route para generar y servir el PDF de un recibo de cobro.
 * GET /api/sales/receipts/:id/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateReceiptPDF } from '@/modules/sales/shared/pdf';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieStore = await cookies();
    const companyId = cookieStore.get('actualComp')?.value;
    if (!companyId) {
      return NextResponse.json({ error: 'No hay empresa activa' }, { status: 400 });
    }

    const result = await generateReceiptPDF(id);
    if (!result) {
      return NextResponse.json({ error: 'Recibo no encontrado' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${result.fileName}"`,
        'Content-Length': result.buffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generando PDF de recibo:', error);
    return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 });
  }
}
