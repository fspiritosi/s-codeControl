import { cookies } from 'next/headers';
import { fetchCustomerById } from '@/modules/commercial/features/customers/actions.server';
import CustomerDataForm, {
  type CustomerDataInitial,
} from '@/modules/commercial/features/customers/components/CustomerDataForm';

export default async function CustomerFormAction({ searchParams }: { searchParams: Promise<any> }) {
  const resolved = await searchParams;
  const cookieStore = await cookies();
  const companyId = cookieStore.get('actualComp')?.value ?? '';
  const id = resolved.id as string | undefined;

  let initialData: CustomerDataInitial | undefined;
  if (id && resolved.action !== 'new') {
    const customer = await fetchCustomerById(id);
    if (customer) {
      initialData = {
        id: customer.id,
        company_name: customer.name,
        client_cuit: customer.cuit != null ? String(customer.cuit) : '',
        client_email: customer.client_email ?? '',
        client_phone: customer.client_phone != null ? String(customer.client_phone) : '',
        address: customer.address ?? '',
        tax_condition: (customer as any).tax_condition ?? '',
        document_type: (customer as any).document_type ?? 'CUIT',
        tax_id: (customer as any).tax_id ?? '',
        fiscal_address: (customer as any).fiscal_address ?? '',
        fiscal_city: (customer as any).fiscal_city ?? '',
        fiscal_province: (customer as any).fiscal_province ?? '',
        fiscal_zip_code: (customer as any).fiscal_zip_code ?? '',
      };
    }
  }

  return (
    <div className="py-2">
      <CustomerDataForm companyId={companyId} initialData={initialData} />
    </div>
  );
}
