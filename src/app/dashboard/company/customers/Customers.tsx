'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

  const handleCreateClient = () => {
    router.push(`/dashboard/company/customers/action?action=new`);
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
                Clientes
                {/* </div> */}
                <Button className="ml-auto flex justify-between mb-2" onClick={handleCreateClient}>
                  Registrar Cliente
                </Button>
              </CardTitle>
              <CardDescription className="text-muted-foreground">Todos tus Clientes</CardDescription>
            </CardHeader>

            <CardContent>
              <DataCustomers
                columns={columns}
                // data={customers || []}
                data={contractorCompanies || []}
                allCompany={allCompany}
                showInactive={showInactive}
                setShowInactive={setShowInactive}
                localStorageName="customersColumns"
              />
            </CardContent>
          </div>
          <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
        </Card>
      </section>
    </div>
  );
}
