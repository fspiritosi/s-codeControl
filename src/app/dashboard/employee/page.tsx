'use client';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoggedUserStore } from '@/store/loggedUser';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { supabase } from '../../../../supabase/supabase';
import { columns } from './columns';
import { DataTable } from './data-table';

const EmployeePage = () => {
  if (typeof window !== 'undefined') {
    const company_id = localStorage.getItem('company_id');
    let actualComp = Cookies.set('actualComp', company_id as string);
  }

  // const profile = useLoggedUserStore((state) => state);

  // let role: string = '';
  // if (profile?.actualCompany?.owner_id?.credential_id === profile?.credentialUser?.id) {
  //   role = profile?.actualCompany?.owner_id?.role as string;
  // } else {
  //   role = profile?.actualCompany?.share_company_users?.[0]?.role as string;
  // }
  const [clientData, setClientData] = useState<any>(null);
  const share = useLoggedUserStore((state) => state.sharedCompanies);
  console.log('share: ', share)
  const profile = useLoggedUserStore((state) => state.credentialUser?.id);
  const owner = useLoggedUserStore((state) => state.actualCompany?.owner_id.id);
  const users = useLoggedUserStore((state) => state);
  const company = useLoggedUserStore((state) => state.actualCompany?.id);

  const employees = useLoggedUserStore((state) => state.employeesToShow);
  const setActivesEmployees = useLoggedUserStore((state) => state.setActivesEmployees);
  const setInactiveEmployees = useLoggedUserStore((state) => state.setInactiveEmployees);
  const showDeletedEmployees = useLoggedUserStore((state) => state.showDeletedEmployees);
  const setShowDeletedEmployees = useLoggedUserStore((state) => state.setShowDeletedEmployees);

  console.log("company: ", company)
  console.log("owner: ", owner)
  console.log('profile: ', profile)
  let role = '';
  if (owner === profile) {
    role = users?.actualCompany?.owner_id?.role as string;
    console.log("rol dueño: ", role)
  } else {
    // const roleRaw = share?.filter((item: any) => Object.values(item).some((value) => typeof value === 'string' && value.includes(profile as string))).map((item: any) => item.role);
    const roleRaw = share
      .filter((item: any) =>
        item.company_id.id === company &&
        Object.values(item).some((value) => typeof value === 'string' && value.includes(profile as string))
      )
      .map((item: any) => item.role);
    role = roleRaw?.join('');
    // role = users?.actualCompany?.share_company_users?.[0]?.role as string;
    console.log("rol empleado: ", role)
   
  }

  useEffect(() => {

    if (company && profile && role === "Invitado") {
      const fetchCustomers = async () => {
        const { data, error } = await supabase
          .from('share_company_users')
          .select('*')
          .eq('company_id', company)
          .eq('profile_id', profile);

        if (error) {
          console.error('Error fetching customers:', error);
        } else {
          setClientData(data);

        }
      };

      fetchCustomers();
    }
  }, [company, profile]);
  
  const filteredCustomersEmployees = employees?.filter((customer: any) =>
    customer?.allocated_to?.includes(clientData?.[0]?.customer_id)
  );






  supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
      if (showDeletedEmployees) {
        setInactiveEmployees();
      } else {
        setActivesEmployees();
      }
    })
    .subscribe();
  return (
    <section className="max-w-full">
      <Card className="mt-6 md:mx-7 overflow-hidden">
        <CardHeader className=" flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Empleados</CardTitle>
            <CardDescription className="text-muted-foreground">
              Aquí puedes ver los empleados de tu empresa
            </CardDescription>
          </div>
          {role && role !== 'Invitado' && (
            <Link
              href="/dashboard/employee/action?action=new"
              className={[
                'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                buttonVariants({ variant: 'outline' }),
              ].join(' ')}
            >
              Agregar nuevo empleado
            </Link>
          )}
        </CardHeader>

        <div className=" px-8 ">
          <DataTable
            columns={columns}
            data={role === "Invitado" ? filteredCustomersEmployees : employees || []}
            setActivesEmployees={setActivesEmployees}
            setInactiveEmployees={setInactiveEmployees}
            showDeletedEmployees={showDeletedEmployees}
            setShowDeletedEmployees={setShowDeletedEmployees}
          />
        </div>
        <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
      </Card>
    </section>
  );
};

export default EmployeePage;
