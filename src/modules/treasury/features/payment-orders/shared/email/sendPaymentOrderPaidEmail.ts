'use server';

import { prisma } from '@/shared/lib/prisma';
import { sendEmail } from '@/shared/actions/email';
import { paymentOrderPaidEmail } from '@/shared/lib/email-templates/payment-order-paid';
import {
  generatePaymentOrderPDF,
  getPaymentOrderFileName,
  amountToSpanishWords,
  mapPaymentDestinationForPDF,
} from '../pdf';
import type { PaymentOrderPDFData } from '../pdf';
import type { CompanyPDFData } from '@/shared/actions/export';

export type SendPaymentOrderPaidEmailResult = {
  status: 'SENT' | 'NO_EMAIL' | 'FAILED';
  errorMessage?: string;
};

export async function sendPaymentOrderPaidEmail(
  paymentOrderId: string,
  companyId: string
): Promise<SendPaymentOrderPaidEmailResult> {
  try {
    const order = await prisma.payment_orders.findFirst({
      where: { id: paymentOrderId, company_id: companyId },
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
      return { status: 'FAILED', errorMessage: 'Orden de pago no encontrada' };
    }

    const supplierEmail = order.supplier?.email?.trim();

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
    const companyName = company?.company_name || 'Su cliente';

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

    if (!supplierEmail) {
      return { status: 'NO_EMAIL' };
    }

    const { subject, html } = paymentOrderPaidEmail({
      supplierName:
        order.supplier?.trade_name || order.supplier?.business_name || 'Proveedor',
      orderNumber: order.full_number,
      orderDate: order.date,
      total: totalAmount,
      currency: 'ARS',
      items: pdfData.invoices.map((inv) => ({
        fullNumber: inv.fullNumber,
        appliedAmount: inv.appliedAmount,
      })),
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
    console.error('Error en sendPaymentOrderPaidEmail:', error);
    return {
      status: 'FAILED',
      errorMessage:
        error instanceof Error ? error.message : 'Error desconocido enviando el mail',
    };
  }
}
