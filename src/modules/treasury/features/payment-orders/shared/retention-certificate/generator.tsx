import { renderToBuffer } from '@react-pdf/renderer';
import { RetentionCertificateTemplate } from './RetentionCertificateTemplate';
import type { RetentionCertificatePDFData } from './types';

export async function generateRetentionCertificatePDF(
  data: RetentionCertificatePDFData
): Promise<Buffer> {
  return renderToBuffer(<RetentionCertificateTemplate data={data} />);
}

export function getRetentionCertificateFileName(data: RetentionCertificatePDFData): string {
  const code = data.taxType.code.replace(/[^A-Z0-9_]/gi, '');
  return `Cert-${code}-${data.certificate.number}.pdf`;
}
