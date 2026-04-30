/**
 * API Route para generar y servir PDF de orden de compra
 * GET /api/purchase-orders/:id/pdf
 * Query params: ?include=receivingNotes,purchaseInvoices
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/shared/lib/prisma';
import {
  generatePurchaseOrderPDF,
  getPurchaseOrderFileName,
  mapPurchaseOrderDataForPDF,
} from '@/modules/purchasing/features/purchase-orders/shared/pdf';
import type {
  LinkedDocumentsData,
  LinkedDocumentSection,
} from '@/shared/components/pdf/linked-documents-types';
import type { CompanyPDFData } from '@/shared/actions/export';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function parseIncludes(request: NextRequest): Set<string> {
  const includeParam = request.nextUrl.searchParams.get('include');
  if (!includeParam) return new Set();
  return new Set(includeParam.split(',').map((s) => s.trim()));
}

function formatCurrency(value: number | { toNumber?: () => number }): string {
  const num = typeof value === 'number' ? value : Number(value);
  return `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es });
}

function getReceivingNoteStatusLabel(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'Confirmado';
    case 'CANCELLED':
      return 'Anulado';
    default:
      return 'Borrador';
  }
}

function getInvoiceStatusLabel(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'Confirmada';
    case 'PAID':
      return 'Pagada';
    case 'PARTIAL_PAID':
      return 'Pago parcial';
    case 'CANCELLED':
      return 'Anulada';
    default:
      return 'Borrador';
  }
}

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

    const includes = parseIncludes(request);

    // Consultar la OC validando que pertenezca a la company
    const purchaseOrder = await prisma.purchase_orders.findFirst({
      where: { id, company_id: companyId },
      include: {
        supplier: {
          select: {
            business_name: true,
            trade_name: true,
            tax_id: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        lines: {
          include: {
            product: { select: { code: true, name: true } },
          },
          orderBy: { id: 'asc' },
        },
        installments: {
          select: {
            number: true,
            due_date: true,
            amount: true,
            notes: true,
          },
          orderBy: { number: 'asc' },
        },
        ...(includes.has('receivingNotes') && {
          receiving_notes: {
            select: {
              full_number: true,
              reception_date: true,
              status: true,
            },
            orderBy: { reception_date: 'desc' as const },
          },
        }),
        ...(includes.has('purchaseInvoices') && {
          purchase_invoices: {
            select: {
              full_number: true,
              issue_date: true,
              total: true,
              status: true,
            },
            orderBy: { issue_date: 'desc' as const },
          },
        }),
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Orden de compra no encontrada' },
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

    const companyData: CompanyPDFData = {
      name: company.company_name,
      logo: company.company_logo ?? null,
      cuit: company.company_cuit ?? '',
      address: company.address ?? '',
      phone: company.contact_phone ?? '',
      email: company.contact_email ?? '',
    };

    // Construir documentos vinculados si se solicitaron
    let linkedDocuments: LinkedDocumentsData | undefined;

    if (includes.size > 0) {
      const sections: LinkedDocumentSection[] = [];

      if (
        includes.has('receivingNotes') &&
        (purchaseOrder as any).receiving_notes?.length > 0
      ) {
        sections.push({
          title: 'Remitos de Recepcion',
          columns: ['Remito', 'Fecha', '', 'Estado'],
          records: (purchaseOrder as any).receiving_notes.map((rn: any) => ({
            label: rn.full_number,
            date: formatDate(rn.reception_date),
            status: getReceivingNoteStatusLabel(rn.status),
          })),
        });
      }

      if (
        includes.has('purchaseInvoices') &&
        (purchaseOrder as any).purchase_invoices?.length > 0
      ) {
        sections.push({
          title: 'Facturas de Compra',
          columns: ['Factura', 'Fecha', 'Total', 'Estado'],
          records: (purchaseOrder as any).purchase_invoices.map((inv: any) => ({
            label: inv.full_number,
            date: formatDate(inv.issue_date),
            amount: formatCurrency(inv.total),
            status: getInvoiceStatusLabel(inv.status),
          })),
        });
      }

      if (sections.length > 0) {
        linkedDocuments = { sections };
      }
    }

    // Configuración de PDF de la empresa (header/footer/firma)
    const pdfSettingsRow = await prisma.pdf_settings.findUnique({
      where: { company_id: companyId },
    });
    const isSigned = pdfSettingsRow?.signed_pdf_keys.includes('purchase-order') ?? false;
    const pdfSettings = pdfSettingsRow
      ? {
          headerText: pdfSettingsRow.header_text,
          footerText: pdfSettingsRow.footer_text,
          signatureUrl: isSigned ? pdfSettingsRow.signature_image_url : null,
        }
      : undefined;

    // Mapear y generar PDF
    const pdfData = mapPurchaseOrderDataForPDF(
      purchaseOrder as any,
      companyData,
      linkedDocuments,
      pdfSettings
    );

    const pdfBuffer = await generatePurchaseOrderPDF(pdfData);
    const fileName = getPurchaseOrderFileName(pdfData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generando PDF de orden de compra:', error);
    return NextResponse.json(
      { error: 'Error al generar el PDF' },
      { status: 500 }
    );
  }
}
