import type { CompanyPDFData } from '@/shared/actions/export';

export interface RetentionCertificatePDFData {
  company: CompanyPDFData;
  certificate: {
    number: string;
    issueDate: Date | string;
    period: string; // "MM/YYYY"
  };
  taxType: {
    code: string;
    name: string;
    scope: 'NATIONAL' | 'PROVINCIAL' | 'MUNICIPAL';
    jurisdiction: string | null;
    calculationBase: 'NET' | 'TOTAL' | 'VAT';
  };
  paymentOrder: {
    fullNumber: string;
    date: Date | string;
  };
  retainee: {
    businessName: string;
    taxId: string;
    address: string | null;
  };
  baseAmount: number;
  rate: number;
  amount: number;
  amountInWords: string;
  notes: string | null;
  pdfSettings?: {
    headerText?: string | null;
    footerText?: string | null;
    signatureUrl?: string | null;
  };
}
