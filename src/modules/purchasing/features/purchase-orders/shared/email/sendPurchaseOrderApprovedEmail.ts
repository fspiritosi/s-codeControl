'use server';

import { prisma } from '@/shared/lib/prisma';
import { sendEmail } from '@/shared/actions/email';
import { purchaseOrderApprovedEmail } from '@/shared/lib/email-templates/purchase-order-approved';
import {
  generatePurchaseOrderPDF,
  getPurchaseOrderFileName,
  mapPurchaseOrderDataForPDF,
} from '../pdf';
import type { CompanyPDFData } from '@/shared/actions/export';

export type SendPurchaseOrderApprovedEmailResult = {
  status: 'SENT' | 'NO_EMAIL' | 'FAILED';
  errorMessage?: string;
};

/**
 * Envía al proveedor el mail de OC aprobada con el PDF adjunto.
 * - No tira excepción: retorna status estructurado.
 * - Si el proveedor no tiene email, retorna NO_EMAIL sin enviar.
 */
export async function sendPurchaseOrderApprovedEmail(
  orderId: string,
  companyId: string
): Promise<SendPurchaseOrderApprovedEmailResult> {
  try {
    const purchaseOrder = await prisma.purchase_orders.findFirst({
      where: { id: orderId, company_id: companyId },
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
          include: { product: { select: { code: true, name: true } } },
          orderBy: { id: 'asc' },
        },
        installments: {
          select: { number: true, due_date: true, amount: true, notes: true },
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!purchaseOrder) {
      return { status: 'FAILED', errorMessage: 'Orden de compra no encontrada' };
    }

    const supplierEmail = purchaseOrder.supplier?.email?.trim();
    if (!supplierEmail) {
      return { status: 'NO_EMAIL' };
    }

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

    const companyName = company?.company_name || 'Su proveedor';

    const companyData: CompanyPDFData = {
      name: companyName,
      logo: company?.company_logo ?? null,
      cuit: company?.company_cuit ?? '',
      address: company?.address ?? '',
      phone: company?.contact_phone ?? '',
      email: company?.contact_email ?? '',
    };

    const pdfSettingsRow = await prisma.pdf_settings.findUnique({
      where: { company_id: companyId },
    });
    const isSigned =
      pdfSettingsRow?.signed_pdf_keys.includes('purchase-order') ?? false;
    const pdfSettings = pdfSettingsRow
      ? {
          headerText: pdfSettingsRow.header_text,
          footerText: pdfSettingsRow.footer_text,
          signatureUrl: isSigned ? pdfSettingsRow.signature_image_url : null,
        }
      : undefined;

    const pdfData = mapPurchaseOrderDataForPDF(
      purchaseOrder as any,
      companyData,
      undefined,
      pdfSettings
    );

    const pdfBuffer = await generatePurchaseOrderPDF(pdfData);
    const fileName = getPurchaseOrderFileName(pdfData);

    const { subject, html } = purchaseOrderApprovedEmail({
      supplierName:
        purchaseOrder.supplier.trade_name || purchaseOrder.supplier.business_name,
      orderNumber: purchaseOrder.full_number,
      orderDate: purchaseOrder.issue_date,
      companyName,
    });

    const result = await sendEmail({
      to: supplierEmail,
      subject,
      html,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    if (!result.success) {
      return {
        status: 'FAILED',
        errorMessage: result.error || 'No se pudo enviar el correo',
      };
    }

    return { status: 'SENT' };
  } catch (error) {
    console.error('Error en sendPurchaseOrderApprovedEmail:', error);
    return {
      status: 'FAILED',
      errorMessage:
        error instanceof Error ? error.message : 'Error desconocido enviando el mail',
    };
  }
}
