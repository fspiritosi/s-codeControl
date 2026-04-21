import ProductForm from '@/modules/products/features/create/components/ProductForm';

export default function NewProductPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Nuevo producto</h1>
      <ProductForm />
    </div>
  );
}
