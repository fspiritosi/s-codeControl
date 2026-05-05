import { prisma } from '@/shared/lib/prisma';

export interface ResolvedEmailSender {
  /**
   * Display name a usar en el header `From:`. El email técnico del From sigue
   * siendo el SMTP_USER autenticado (para no romper SPF/DKIM); este campo solo
   * cambia el nombre visible al destinatario.
   */
  fromName: string;
  /**
   * Email al que se redirigen las respuestas. Lo configura la empresa por
   * pdf_key (override) o, si no hay override, cae al contact_email de la empresa.
   * Cuando el destinatario hace "Responder", su mail va acá — no al SMTP_USER.
   */
  replyTo: string | null;
  /** true si vino del override por pdf_key, false si fue fallback a company. */
  overridden: boolean;
}

/**
 * Resuelve la configuración de envío para un PDF de una empresa:
 *   - fromName: override.from_name → company.company_name → 'CodeControl'
 *   - replyTo: override.from_email → company.contact_email → null
 *
 * Nunca lanza. Si la empresa no existe ni tiene override, devuelve defaults
 * razonables sin replyTo.
 */
export async function resolveEmailSender(
  companyId: string,
  pdfKey: string
): Promise<ResolvedEmailSender> {
  const [override, company] = await Promise.all([
    prisma.pdf_email_settings.findUnique({
      where: { company_id_pdf_key: { company_id: companyId, pdf_key: pdfKey } },
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { company_name: true, contact_email: true },
    }),
  ]);

  if (override?.from_email) {
    return {
      fromName: override.from_name?.trim() || company?.company_name || 'CodeControl',
      replyTo: override.from_email,
      overridden: true,
    };
  }

  return {
    fromName: company?.company_name || 'CodeControl',
    replyTo: company?.contact_email ?? null,
    overridden: false,
  };
}
