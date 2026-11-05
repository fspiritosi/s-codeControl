import { AlertTriangle } from 'lucide-react';

import { formatCuit, isValidCuit } from '@/shared/lib/cuit';

/** Muestra el CUIT del proveedor elegido y avisa si el dígito verificador no coincide. */
export function SupplierCuitHint({ taxId }: { taxId: string | null | undefined }) {
  if (taxId === undefined) return null;
  if (!taxId) return <p className="text-xs text-muted-foreground">Sin CUIT cargado</p>;

  if (isValidCuit(taxId)) {
    return <p className="text-xs text-muted-foreground">CUIT {formatCuit(taxId)}</p>;
  }

  return (
    <p role="status" className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      CUIT {formatCuit(taxId)} inválido: el dígito verificador no coincide.
    </p>
  );
}
