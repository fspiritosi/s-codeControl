// Sin dependencias: se usa desde componentes cliente (utils.ts arrastra código de servidor).
const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** Deja solo los dígitos de un CUIT/CUIL. */
export function cuitDigits(cuit: string | null | undefined): string {
  return (cuit ?? '').replace(/\D/g, '');
}

/** Formatea 11 dígitos como XX-XXXXXXXX-X; si no tiene 11 dígitos lo devuelve tal cual. */
export function formatCuit(cuit: string | null | undefined): string {
  const digits = cuitDigits(cuit);
  if (digits.length !== 11) return cuit ?? '';
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

/** true si el CUIT tiene 11 dígitos y el dígito verificador es correcto. */
export function isValidCuit(cuit: string | null | undefined): boolean {
  const digits = cuitDigits(cuit);
  if (digits.length !== 11) return false;
  const sum = CUIT_WEIGHTS.reduce((acc, w, i) => acc + w * Number(digits[i]), 0);
  const check = 11 - (sum % 11);
  // 11 → 0; 10 no es un dígito válido (AFIP reasigna el prefijo en ese caso).
  return (check === 11 ? 0 : check) === Number(digits[10]);
}

/**
 * Opción de proveedor para `SearchableSelect`: se busca por razón social o por
 * CUIT (con o sin guiones) y el CUIT se muestra debajo, marcado si es inválido.
 */
export function supplierOption(
  supplier: { id: string; business_name: string; tax_id?: string | null },
  label = supplier.business_name
) {
  const digits = cuitDigits(supplier.tax_id);
  const formatted = formatCuit(supplier.tax_id);
  return {
    value: supplier.id,
    label,
    description: digits
      ? `CUIT ${formatted}${isValidCuit(digits) ? '' : ' · CUIT inválido'}`
      : 'Sin CUIT',
    keywords: digits ? [digits, formatted] : [],
  };
}
