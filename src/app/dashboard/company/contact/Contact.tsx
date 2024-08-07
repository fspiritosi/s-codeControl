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

  const handleCreateContact = () => {
    router.push(`/dashboard/company/contact/action?action=new`);
  };

  return (
    <div>
      {/* <section className="grid sm:grid-cols-2 grid-cols-1 gap-6 mx-7">
        
        <CardTitle className="text-[2vw]">Bienvenido a Clientes</CardTitle>
      </section> */}
      <section className="grid grid-cols-1  xl:grid-cols-2 gap-3 mb-4">
        <Card className="col-span-3 flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className="w-full bg-muted dark:bg-muted/50 border-b-2">
              {/* <div className="grid gap-1"> */}
              <CardTitle className="text-2xl font-bold tracking-tight flex justify-between">
                Contactos
                {/* </div> */}
                <Button className="ml-auto flex justify-between mb-2" onClick={handleCreateContact}>
                  Registrar Contacto
                </Button>
              </CardTitle>
              <CardDescription className="text-muted-foreground">Todos tus Contactos</CardDescription>
            </CardHeader>

            <CardContent>
              <DataContacts
                columns={columns}
                data={contractorCompanies || []}
                allCompany={allCompany}
                showInactive={showInactive}
                setShowInactive={setShowInactive}
                localStorageName="contactColums"
              />
            </CardContent>
          </div>
          <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
        </Card>
      </section>
    </div>
  );
}
