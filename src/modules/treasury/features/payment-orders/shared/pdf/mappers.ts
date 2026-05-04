import type { SupplierPaymentMethodPDFItem } from './types';

type RawSupplierPaymentMethod = {
  type: string;
  bank_name: string | null;
  account_holder: string | null;
  account_holder_tax_id: string | null;
  account_type: string | null;
  cbu: string | null;
  alias: string | null;
  currency: string | null;
  is_default: boolean;
};

/**
 * Mapea los métodos de pago del proveedor (filas Prisma) al formato esperado
 * por el PDF de Orden de Pago. Filtra tipos no soportados (solo CHECK | ACCOUNT).
 */
export function mapSupplierPaymentMethodsForPDF(
  methods: RawSupplierPaymentMethod[] | null | undefined
): SupplierPaymentMethodPDFItem[] {
  if (!methods || methods.length === 0) return [];
  return methods
    .filter((m) => m.type === 'CHECK' || m.type === 'ACCOUNT')
    .map((m) => ({
      type: m.type as 'CHECK' | 'ACCOUNT',
      bankName: m.bank_name ?? undefined,
      accountHolder: m.account_holder ?? undefined,
      accountHolderTaxId: m.account_holder_tax_id ?? undefined,
      accountType:
        m.account_type === 'CHECKING' || m.account_type === 'SAVINGS'
          ? m.account_type
          : undefined,
      cbu: m.cbu ?? undefined,
      alias: m.alias ?? undefined,
      currency: m.currency ?? undefined,
      isDefault: m.is_default,
    }));
}
