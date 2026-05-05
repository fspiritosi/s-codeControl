'use client';

import { useCallback } from 'react';
import { usePermissionsStore } from '@/shared/store/permissionsStore';

/**
 * Hook para verificar permisos en componentes cliente.
 *
 * Usage:
 *   const { can, canAny, canAll, permissions } = usePermissions();
 *   if (can('purchase_orders.approve')) { ... }
 *
 * Los permisos se hidratan en el layout vía InitUser → permissionsStore.
 */
export function usePermissions() {
  const permissions = usePermissionsStore((s) => s.permissions);

  const can = useCallback((code: string) => permissions.has(code), [permissions]);

  const canAny = useCallback(
    (codes: string[]) => codes.some((c) => permissions.has(c)),
    [permissions]
  );

  const canAll = useCallback(
    (codes: string[]) => codes.every((c) => permissions.has(c)),
    [permissions]
  );

  return { can, canAny, canAll, permissions };
}
