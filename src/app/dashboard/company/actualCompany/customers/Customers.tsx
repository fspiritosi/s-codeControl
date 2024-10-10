
import { supabase } from '../../../../../../supabase/supabase';
import { columns } from './columns';
import { DataCustomers } from './data-table';
import { cookies } from 'next/headers';

export default async function Customers() {

  const coockiesStore = cookies();
  const actualCompany = coockiesStore.get('actualComp')?.value;

  const { data: customers, error } = await supabase.from('customers').select('*');

  if (error) {
    console.error('Error al obtener los contratistas:', error);
  }
  const contractorCompanies = customers?.filter((company: any) => company.company_id.toString() === actualCompany)

  return (
    <div>
      <DataCustomers
        columns={columns}
        data={contractorCompanies || []}
        localStorageName="customersColumns"
      />
    
    </div>
  );
}
