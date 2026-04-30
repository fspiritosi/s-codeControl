import { notFound } from 'next/navigation';
import ProductForm from '@/modules/products/features/create/components/ProductForm';
import { getProductById } from '@/modules/products/features/list/actions.server';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return notFound();

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Editar producto</h1>
      <ProductForm product={product} />
    </div>
  );
}
