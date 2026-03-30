import CardsGrid, { CardsGridSkeleton } from '@/modules/dashboard/features/overview/components/CardsGrid';
import PurchasingCards, {
  PurchasingCardsSkeleton,
} from '@/modules/dashboard/features/overview/components/PurchasingCards';
import WarehouseCards, {
  WarehouseCardsSkeleton,
} from '@/modules/dashboard/features/overview/components/WarehouseCards';
import SupplierCards, {
  SupplierCardsSkeleton,
} from '@/modules/dashboard/features/overview/components/SupplierCards';
import { Suspense } from 'react';

export default async function DashboardComponent() {
  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Empleados y Equipos</h3>
        <Suspense fallback={<CardsGridSkeleton />}>
          <CardsGrid />
        </Suspense>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Compras</h3>
        <Suspense fallback={<PurchasingCardsSkeleton />}>
          <PurchasingCards />
        </Suspense>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Almacenes</h3>
        <Suspense fallback={<WarehouseCardsSkeleton />}>
          <WarehouseCards />
        </Suspense>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Proveedores</h3>
        <Suspense fallback={<SupplierCardsSkeleton />}>
          <SupplierCards />
        </Suspense>
      </div>
    </section>
  );
}
