import type { PaymentOrderPDFDestination } from './types';

type RawSupplierPaymentMethod = {
  type: string;
  bank_name: string | null;
  account_holder: string | null;
  account_type: string | null;
  cbu: string | null;
  alias: string | null;
  currency: string | null;
  is_default: boolean;
};

/**
 * Mapea el supplier_payment_method asociado a una línea de pago al destino
 * que se renderiza dentro de la tabla "Detalle de los medios de pago" del PDF.
 */
export function mapPaymentDestinationForPDF(
  method: RawSupplierPaymentMethod | null | undefined
): PaymentOrderPDFDestination | undefined {
  if (!method) return undefined;
  if (method.type === 'CHECK') {
    return { kind: 'CHECK', isDefault: method.is_default };
  }
  if (method.type === 'ACCOUNT') {
    return {
      kind: 'ACCOUNT',
      bankName: method.bank_name ?? undefined,
      accountHolder: method.account_holder ?? undefined,
      accountType:
        method.account_type === 'CHECKING' || method.account_type === 'SAVINGS'
          ? method.account_type
          : undefined,
      cbu: method.cbu ?? undefined,
      alias: method.alias ?? undefined,
      currency: method.currency ?? undefined,
      isDefault: method.is_default,
    };
  }
  return undefined;
}
