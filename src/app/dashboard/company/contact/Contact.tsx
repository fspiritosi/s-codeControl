'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../../supabase/supabase';
import { columns } from './columns';
import { DataContacts } from './data-table';

export default function Contact() {
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const router = useRouter();
  const [contacts, setContacts] = useState(['']);
  const allCompany = useLoggedUserStore((state) => state.allCompanies);
  const [showInactive, setShowInactive] = useState(false);
  const useSearch = useSearchParams();
  const fetchContacts = useCountriesStore((state) => state.fetchContacts);
  const subscribeToContactsChanges = useCountriesStore((state) => state.subscribeToContactsChanges);
  const contractorCompanies = useCountriesStore((state) =>
    state.contacts?.filter((company: any) => company.company_id.toString() === actualCompany?.id)
  );

  useEffect(() => {
    fetchContacts();

    const unsubscribe = subscribeToContactsChanges();

    return () => {
      unsubscribe();
    };
  }, [fetchContacts, subscribeToContactsChanges]);

  const channels = supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, (payload) => {
      fetchContacts();
    })
    .subscribe();

  return (         
      <section >            
              <DataContacts
                columns={columns}
                data={contractorCompanies || []}
                allCompany={allCompany}
                showInactive={showInactive}
                setShowInactive={setShowInactive}
                localStorageName="contactColums"
              />         
      </section>   
  );
}
