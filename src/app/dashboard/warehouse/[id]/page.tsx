import WarehouseDetail from '@/modules/warehouse/features/detail/components/WarehouseDetail';
import { getWarehouseById, getWarehouseStocks, getWarehousesByCompany } from '@/modules/warehouse/features/list/actions.server';
import { getProductsByCompany } from '@/modules/products/features/list/actions.server';
import { notFound } from 'next/navigation';

export default async function WarehouseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [warehouse, stocks, products, warehouses] = await Promise.all([
    getWarehouseById(id),
    getWarehouseStocks(id),
    getProductsByCompany(),
    getWarehousesByCompany(),
  ]);

  if (!warehouse) return notFound();

  return (
    <WarehouseDetail
      warehouse={warehouse}
      stocks={stocks}
      products={products.map((p) => ({ id: p.id, code: p.code, name: p.name, unit_of_measure: p.unit_of_measure }))}
      warehouses={warehouses}
    />
  );
}
