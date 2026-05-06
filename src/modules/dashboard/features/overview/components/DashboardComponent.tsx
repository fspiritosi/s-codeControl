import CardsGrid, { CardsGridSkeleton } from '@/modules/dashboard/features/overview/components/CardsGrid';
import MaintenanceCards, {
  MaintenanceCardsSkeleton,
} from '@/modules/dashboard/features/overview/components/MaintenanceCards';
import PurchasingCards, {
  PurchasingCardsSkeleton,
} from '@/modules/dashboard/features/overview/components/PurchasingCards';
import WarehouseCards, {
  WarehouseCardsSkeleton,
} from '@/modules/dashboard/features/overview/components/WarehouseCards';
import SupplierCards, {
  SupplierCardsSkeleton,
} from '@/modules/dashboard/features/overview/components/SupplierCards';
import { getSessionPermissions } from '@/shared/lib/permissions';
import { Suspense } from 'react';

export default async function DashboardComponent() {
  const perms = await getSessionPermissions();
  const canAny = (...codes: string[]) => codes.some((c) => perms.has(c));

  const showPeopleEquip = canAny('empleados.view', 'equipos.view', 'documentacion.view');
  const showMaintenance = perms.has('mantenimiento.view');
  const showPurchasing = perms.has('compras.view');
  const showWarehouse = perms.has('almacenes.view');
  const showSuppliers = perms.has('proveedores.view');

  const nothingVisible =
    !showPeopleEquip && !showMaintenance && !showPurchasing && !showWarehouse && !showSuppliers;

  if (nothingVisible) {
    return (
      <section className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No tenés permisos para ver información en el dashboard. Si creés que necesitás acceso,
        solicitalo a tu administrador.
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {showPeopleEquip && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Empleados y Equipos</h3>
          <Suspense fallback={<CardsGridSkeleton />}>
            <CardsGrid />
          </Suspense>
        </div>
      )}

      {showMaintenance && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Mantenimiento</h3>
          <Suspense fallback={<MaintenanceCardsSkeleton />}>
            <MaintenanceCards />
          </Suspense>
        </div>
      )}

      {showPurchasing && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Compras</h3>
          <Suspense fallback={<PurchasingCardsSkeleton />}>
            <PurchasingCards />
          </Suspense>
        </div>
      )}

      {showWarehouse && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Almacenes</h3>
          <Suspense fallback={<WarehouseCardsSkeleton />}>
            <WarehouseCards />
          </Suspense>
        </div>
      )}

      {showSuppliers && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Proveedores</h3>
          <Suspense fallback={<SupplierCardsSkeleton />}>
            <SupplierCards />
          </Suspense>
        </div>
      )}
    </section>
  );
}
