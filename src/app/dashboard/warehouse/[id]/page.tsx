import WarehouseDetail from '@/modules/warehouse/features/detail/components/WarehouseDetail';
import {
  getWarehouseById,
  getWarehouseStocks,
  getWarehousesByCompany,
  getWarehouseStocksPaginated,
} from '@/modules/warehouse/features/list/actions.server';
import { getProductsByCompany } from '@/modules/products/features/list/actions.server';
import { getCompanyScope } from '@/shared/lib/company-scope';
import { notFound } from 'next/navigation';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

export default async function WarehouseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DataTableSearchParams>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const [warehouse, stocks, paginated, products, warehouses, scope] = await Promise.all([
    getWarehouseById(id),
    getWarehouseStocks(id),
    getWarehouseStocksPaginated(id, resolvedSearchParams),
    getProductsByCompany(),
    getWarehousesByCompany(),
    getCompanyScope(),
  ]);

  if (!warehouse) return notFound();

  return (
    <WarehouseDetail
      warehouse={warehouse}
      stocks={stocks}
      paginatedStocks={paginated.data}
      totalStocks={paginated.total}
      searchParams={resolvedSearchParams as Record<string, string | undefined>}
      products={products.map((p) => ({ id: p.id, code: p.code, name: p.name, unit_of_measure: p.unit_of_measure }))}
      warehouses={warehouses}
      showCompany={!!scope?.groupId}
    />
  );
}
