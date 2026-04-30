import { notFound } from 'next/navigation';
import ProductDetail from '@/modules/products/features/detail/components/ProductDetail';
import {
  getProductById,
  getProductStockByWarehouse,
  getProductMovements,
} from '@/modules/products/features/list/actions.server';
import { getCompanyScope } from '@/shared/lib/company-scope';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, stocks, movements, scope] = await Promise.all([
    getProductById(id),
    getProductStockByWarehouse(id),
    getProductMovements(id),
    getCompanyScope(),
  ]);

  if (!product) return notFound();

  return (
    <ProductDetail
      product={product as any}
      stocks={stocks}
      movements={movements}
      showCompany={!!scope?.groupId}
    />
  );
}
