/**
 * API Route para generar y servir el PDF de una factura de venta.
 * GET /api/sales/invoices/:id/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateSalesInvoicePDF } from '@/modules/sales/shared/pdf';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Empresa activa (auth validada por middleware en /dashboard/*; la API scopa por cookie).
    const cookieStore = await cookies();
    const companyId = cookieStore.get('actualComp')?.value;
    if (!companyId) {
      return NextResponse.json({ error: 'No hay empresa activa' }, { status: 400 });
    }

    const result = await generateSalesInvoicePDF(id);
    if (!result) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
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
    console.error('Error generando PDF de factura de venta:', error);
    return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 });
  }
}
