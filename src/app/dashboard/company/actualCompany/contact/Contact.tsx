
import { supabase } from '../../../../../../supabase/supabase';
import { columns } from './columns';
import { DataContacts } from './data-table';
import { cookies } from 'next/headers';

export default async function Contact() {
  const coockiesStore = cookies();
  const actualCompany = coockiesStore.get('actualComp')?.value;
  const { data: contacts, error } = await supabase //pasar a api
    .from('contacts')
    .select('*, customers(id, name)')
    .eq('company_id', actualCompany)

  if (error) {
    console.error('Error fetching customers:', error)
  }
  
  const contractorCompanies = contacts?.filter((company: any) => company.company_id.toString() === actualCompany)

  return (
    <section >
      <DataContacts
        columns={columns}
        data={contractorCompanies || []}
        localStorageName="contactColums"
      />
    </section>
  );
}
