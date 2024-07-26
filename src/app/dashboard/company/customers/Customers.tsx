'use client';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../../supabase/supabase';
import { columns } from './columns';
import { DataCustomers } from './data-table';

export default function Customers() {
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const router = useRouter();
  const [customers, setCustomers] = useState(['']);
  const allCompany = useLoggedUserStore((state) => state.allCompanies);
  const [showInactive, setShowInactive] = useState(false);
  const useSearch = useSearchParams();
  const fetchContractors = useCountriesStore((state) => state.fetchContractors);
  const subscribeToCustomersChanges = useCountriesStore((state) => state.subscribeToCustomersChanges);
  const contractorCompanies = useCountriesStore((state) =>
    state.customers?.filter((company: any) => company.company_id.toString() === actualCompany?.id)
  );
  
  useEffect(() => {
    fetchContractors();

    const unsubscribe = subscribeToCustomersChanges();

    return () => {
      unsubscribe();
    };
  }, [fetchContractors, subscribeToCustomersChanges]);

  const channels = supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
      fetchContractors();
    })
    .subscribe();

  

  return (
    <div>
      
              <DataCustomers
                columns={columns}        
                data={contractorCompanies || []}
                allCompany={allCompany}
                showInactive={showInactive}
                setShowInactive={setShowInactive}
                localStorageName="customersColumns"
              />
            
    </div>
  );
}
