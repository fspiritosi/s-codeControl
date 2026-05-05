/**
 * GET /api/payment-orders/:id/pdf
 * Devuelve el PDF de la orden de pago para preview/descarga manual.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/shared/lib/prisma';
import {
  amountToSpanishWords,
  generatePaymentOrderPDF,
  getPaymentOrderFileName,
  mapPaymentDestinationForPDF,
} from '@/modules/treasury/features/payment-orders/shared/pdf';
import type { PaymentOrderPDFData } from '@/modules/treasury/features/payment-orders/shared/pdf';
import type { CompanyPDFData } from '@/shared/actions/export';
import { resolveEmailSender } from '@/modules/settings/features/pdf/email-resolver';

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

    const order = await prisma.payment_orders.findFirst({
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
        items: {
          include: {
            invoice: {
              select: {
                full_number: true,
                issue_date: true,
                due_date: true,
                total: true,
              },
            },
          },
        },
        payments: {
          include: {
            cash_register: { select: { code: true, name: true } },
            bank_account: { select: { bank_name: true, account_number: true } },
            supplier_payment_method: {
              select: {
                type: true,
                bank_name: true,
                account_holder: true,
                account_type: true,
                cbu: true,
                alias: true,
                currency: true,
                is_default: true,
              },
            },
          },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
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
    const sender = await resolveEmailSender(companyId, 'payment-order');
    const companyData: CompanyPDFData = {
      name: company?.company_name ?? '',
      logo: company?.company_logo ?? null,
      cuit: company?.company_cuit ?? '',
      address: company?.address ?? '',
      phone: company?.contact_phone ?? '',
      email: sender.replyTo ?? company?.contact_email ?? '',
    };

    const pdfSettingsRow = await prisma.pdf_settings.findUnique({
      where: { company_id: companyId },
    });
    const isSigned =
      pdfSettingsRow?.signed_pdf_keys.includes('payment-order') ?? false;
    const pdfSettings = pdfSettingsRow
      ? {
          headerText: pdfSettingsRow.header_text,
          footerText: pdfSettingsRow.footer_text,
          signatureUrl: isSigned ? pdfSettingsRow.signature_image_url : null,
        }
      : undefined;

    const totalAmount = Number(order.total_amount);
    const pdfData: PaymentOrderPDFData = {
      company: companyData,
      paymentOrder: {
        fullNumber: order.full_number,
        number: order.number,
        date: order.date,
        notes: order.notes ?? undefined,
        status: order.status,
      },
      supplier: {
        businessName: order.supplier?.business_name ?? 'Sin proveedor',
        tradeName: order.supplier?.trade_name ?? undefined,
        taxId: order.supplier?.tax_id ?? '',
        address: order.supplier?.address ?? undefined,
        phone: order.supplier?.phone ?? undefined,
        email: order.supplier?.email ?? undefined,
      },
      invoices: order.items
        .filter((it) => it.invoice)
        .map((it) => ({
          fullNumber: it.invoice!.full_number,
          issueDate: it.invoice!.issue_date,
          dueDate: it.invoice!.due_date,
          total: Number(it.invoice!.total),
          appliedAmount: Number(it.amount),
        })),
      payments: order.payments.map((p) => ({
        method: p.payment_method,
        bankName: p.bank_account?.bank_name ?? undefined,
        accountNumber: p.bank_account?.account_number ?? undefined,
        cashRegisterCode: p.cash_register?.code ?? undefined,
        cashRegisterName: p.cash_register?.name ?? undefined,
        checkNumber: p.check_number ?? undefined,
        cardLast4: p.card_last4 ?? undefined,
        reference: p.reference ?? undefined,
        amount: Number(p.amount),
        destination: mapPaymentDestinationForPDF(p.supplier_payment_method),
      })),
      totalAmount,
      amountInWords: amountToSpanishWords(totalAmount),
      pdfSettings,
    };

    const pdfBuffer = await generatePaymentOrderPDF(pdfData);
    const fileName = getPaymentOrderFileName(pdfData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generando PDF de OP:', error);
    return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 });
  }
}
