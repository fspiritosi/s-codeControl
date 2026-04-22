import SupplierForm from '@/modules/suppliers/features/create/components/SupplierForm';

export default function NewSupplierPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Nuevo proveedor</h1>
      <SupplierForm />
    </div>
  );
}
