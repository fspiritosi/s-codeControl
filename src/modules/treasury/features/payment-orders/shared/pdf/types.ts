import type { CompanyPDFData } from '@/shared/actions/export';

export interface PaymentOrderPDFInvoice {
  fullNumber: string;
  issueDate: Date | string | null;
  dueDate: Date | string | null;
  total: number;
  appliedAmount: number;
}

export type PaymentOrderPDFDestination =
  | {
      kind: 'ACCOUNT';
      bankName?: string;
      accountHolder?: string;
      accountType?: 'CHECKING' | 'SAVINGS';
      cbu?: string;
      alias?: string;
      currency?: string;
      isDefault: boolean;
    }
  | { kind: 'CHECK'; isDefault: boolean };

export interface PaymentOrderPDFPayment {
  method: string;
  bankName?: string;
  accountNumber?: string;
  cashRegisterCode?: string;
  cashRegisterName?: string;
  checkNumber?: string;
  cardLast4?: string;
  reference?: string;
  amount: number;
  destination?: PaymentOrderPDFDestination;
}

export interface PaymentOrderPDFRetention {
  name: string;
  jurisdiction?: string | null;
  baseAmount: number;
  rate: number;
  amount: number;
  certificateNumber?: string | null;
}

export interface PaymentOrderPDFData {
  company: CompanyPDFData;
  paymentOrder: {
    fullNumber: string;
    number: number;
    date: Date | string;
    notes?: string;
    status: string;
  };
  supplier: {
    businessName: string;
    tradeName?: string;
    taxId: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  invoices: PaymentOrderPDFInvoice[];
  payments: PaymentOrderPDFPayment[];
  retentions?: PaymentOrderPDFRetention[];
  totalAmount: number;
  retentionsTotal?: number;
  netToPay?: number;
  amountInWords: string;
  pdfSettings?: {
    headerText?: string | null;
    footerText?: string | null;
    signatureUrl?: string | null;
  };
}
