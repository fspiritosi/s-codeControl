/**
 * API Route para generar y servir PDF de orden de retiro de mercaderia (ORM)
 * GET /api/withdrawal-orders/:id/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/shared/lib/prisma';
import {
  generateWithdrawalOrderPDF,
  getWithdrawalOrderFileName,
  mapWithdrawalOrderDataForPDF,
} from '@/modules/warehouse/features/withdrawals/shared/pdf';
import type { CompanyPDFData } from '@/shared/actions/export';
import { resolveEmailSender } from '@/modules/settings/features/pdf/email-resolver';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Leer companyId de cookie (auth validada por middleware en /dashboard/*)
    const cookieStore = await cookies();
    const companyId = cookieStore.get('actualComp')?.value;
    if (!companyId) {
      return NextResponse.json(
        { error: 'No hay empresa activa' },
        { status: 400 }
      );
    }

    // Consultar la ORM validando que pertenezca a la company
    const withdrawalOrder = await prisma.withdrawal_orders.findFirst({
      where: { id, company_id: companyId },
      include: {
        warehouse: {
          select: { name: true, code: true },
        },
        employee: {
          select: { firstname: true, lastname: true },
        },
        vehicle: {
          select: { domain: true, intern_number: true },
        },
        lines: {
          include: {
            product: {
              select: { code: true, name: true, unit_of_measure: true },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!withdrawalOrder) {
      return NextResponse.json(
        { error: 'Orden de retiro no encontrada' },
        { status: 404 }
      );
    }

    // Obtener datos de la empresa para el header del PDF
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        company_name: true,
        company_logo: true,
        company_cuit: true,
        address: true,
        contact_phone: true,
        contact_email: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    const sender = await resolveEmailSender(companyId, 'withdrawal-order');
    const companyData: CompanyPDFData = {
      name: company.company_name,
      logo: company.company_logo ?? null,
      cuit: company.company_cuit ?? '',
      address: company.address ?? '',
      phone: company.contact_phone ?? '',
      email: sender.replyTo ?? company.contact_email ?? '',
    };

    // Configuración de PDF de la empresa (header/footer/firma)
    const pdfSettingsRow = await prisma.pdf_settings.findUnique({
      where: { company_id: companyId },
    });
    const isSigned = pdfSettingsRow?.signed_pdf_keys.includes('withdrawal-order') ?? false;
    const pdfSettings = pdfSettingsRow
      ? {
          headerText: pdfSettingsRow.header_text,
          footerText: pdfSettingsRow.footer_text,
          signatureUrl: isSigned ? pdfSettingsRow.signature_image_url : null,
        }
      : undefined;

    // Mapear y generar PDF
    const pdfData = mapWithdrawalOrderDataForPDF(
      withdrawalOrder as any,
      companyData,
      pdfSettings
    );

    const pdfBuffer = await generateWithdrawalOrderPDF(pdfData);
    const fileName = getWithdrawalOrderFileName(pdfData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generando PDF de orden de retiro:', error);
    return NextResponse.json(
      { error: 'Error al generar el PDF' },
      { status: 500 }
    );
  }
}
