import { prisma } from '@/shared/lib/prisma';
import { resolveEmailSender } from '@/modules/settings/features/pdf/email-resolver';
import type { CompanyPDFData } from '@/shared/actions/export';
import { amountToSpanishWords } from '../pdf/amount-in-words';
import type { RetentionCertificatePDFData } from './types';

/**
 * Construye los datos completos para emitir el PDF del comprobante de retención
 * a partir del ID de la línea payment_order_retentions. Devuelve null si la
 * retención no existe o todavía no fue numerada (la OP no se confirmó).
 */
export async function buildRetentionCertificateData(
  retentionId: string,
  expectedCompanyId?: string
): Promise<RetentionCertificatePDFData | null> {
  const retention = await prisma.payment_order_retentions.findUnique({
    where: { id: retentionId },
    include: {
      tax_type: true,
      payment_order: {
        select: {
          id: true,
          full_number: true,
          date: true,
          confirmed_at: true,
          company_id: true,
          supplier: {
            select: { business_name: true, tax_id: true, address: true },
          },
        },
      },
    },
  });

  if (!retention) return null;
  if (expectedCompanyId && retention.payment_order.company_id !== expectedCompanyId) {
    return null;
  }
  if (!retention.certificate_number) return null;

  const companyId = retention.payment_order.company_id;
  const [company, pdfSettingsRow, sender] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        company_name: true,
        company_logo: true,
        company_cuit: true,
        address: true,
        contact_phone: true,
        contact_email: true,
      },
    }),
    prisma.pdf_settings.findUnique({ where: { company_id: companyId } }),
    resolveEmailSender(companyId, 'payment-order'),
  ]);

  const isSigned =
    pdfSettingsRow?.signed_pdf_keys.includes('payment-order') ?? false;
  const pdfSettings = pdfSettingsRow
    ? {
        headerText: pdfSettingsRow.header_text,
        footerText: pdfSettingsRow.footer_text,
        signatureUrl: isSigned ? pdfSettingsRow.signature_image_url : null,
      }
    : undefined;

  const companyData: CompanyPDFData = {
    name: company?.company_name ?? '',
    logo: company?.company_logo ?? null,
    cuit: company?.company_cuit ?? '',
    address: company?.address ?? '',
    phone: company?.contact_phone ?? '',
    email: sender.replyTo ?? company?.contact_email ?? '',
  };

  const issueDate = retention.payment_order.confirmed_at ?? retention.payment_order.date;
  const period = `${String(new Date(issueDate).getMonth() + 1).padStart(2, '0')}/${new Date(issueDate).getFullYear()}`;

  const amount = Number(retention.amount);

  return {
    company: companyData,
    certificate: {
      number: retention.certificate_number,
      issueDate,
      period,
    },
    taxType: {
      code: retention.tax_type.code,
      name: retention.tax_type.name,
      scope: retention.tax_type.scope,
      jurisdiction: retention.tax_type.jurisdiction,
      calculationBase: retention.tax_type.calculation_base,
    },
    paymentOrder: {
      fullNumber: retention.payment_order.full_number,
      date: retention.payment_order.date,
    },
    retainee: {
      businessName: retention.payment_order.supplier?.business_name ?? 'Sin proveedor',
      taxId: retention.payment_order.supplier?.tax_id ?? '',
      address: retention.payment_order.supplier?.address ?? null,
    },
    baseAmount: Number(retention.base_amount),
    rate: Number(retention.rate),
    amount,
    amountInWords: amountToSpanishWords(amount),
    notes: retention.notes,
    pdfSettings,
  };
}
