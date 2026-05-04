export type SupplierPaymentMethodType = 'CHECK' | 'ACCOUNT';
export type SupplierAccountType = 'CHECKING' | 'SAVINGS';
export type SupplierPaymentMethodStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface SupplierPaymentMethod {
  id: string;
  supplier_id: string;
  company_id: string;
  type: SupplierPaymentMethodType;
  bank_name: string | null;
  account_holder: string | null;
  account_holder_tax_id: string | null;
  account_type: SupplierAccountType | null;
  cbu: string | null;
  alias: string | null;
  currency: string | null;
  is_default: boolean;
  status: SupplierPaymentMethodStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Supplier {
  id: string;
  company_id: string;
  code: string;
  business_name: string;
  trade_name: string | null;
  tax_id: string;
  tax_condition: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  zip_code: string | null;
  country: string;
  payment_term_days: number;
  credit_limit: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  payment_methods?: SupplierPaymentMethod[];
}

export const TAX_CONDITION_LABELS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTISTA: 'Monotributista',
  EXENTO: 'Exento',
  NO_RESPONSABLE: 'No Responsable',
  CONSUMIDOR_FINAL: 'Consumidor Final',
};

export const SUPPLIER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  BLOCKED: 'Bloqueado',
};

export const SUPPLIER_ACCOUNT_TYPE_LABELS: Record<SupplierAccountType, string> = {
  CHECKING: 'Cuenta corriente',
  SAVINGS: 'Caja de ahorro',
};

export const SUPPLIER_PAYMENT_METHOD_TYPE_LABELS: Record<SupplierPaymentMethodType, string> = {
  CHECK: 'Cheque',
  ACCOUNT: 'Cuenta bancaria',
};
