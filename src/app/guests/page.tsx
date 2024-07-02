"use client";

import { useEffect, useState } from 'react';
import { useLoggedUserStore } from '@/store/loggedUser';
import { supabase } from '../../../supabase/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from '@/app/dashboard/employee/data-table';
import { columns } from '@/app/dashboard/employee/columns';
import { DataEquipment } from '@/app/dashboard/equipment/data-equipment';
import { columns as columns1 } from "@/app/dashboard/equipment/columns";
// import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Guests() {
  const [clientData, setClientData] = useState<any>(null);
  // const [contactData, setContactData] = useState<any>(null);
  const profile = useLoggedUserStore(state => state.profile?.[0]?.id)
  const employees = useLoggedUserStore(state => state.employeesToShow);
  const equipment = useLoggedUserStore(state => state.vehiclesToShow);
  const company = useLoggedUserStore((state) => state.actualCompany?.id);

  useEffect(() => {

    if (company && profile) {
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


  const filteredCustomersEquipment = equipment?.filter((customer: any) =>
    customer.allocated_to.includes(clientData?.[0]?.customer_id)
  );

  const setActivesEmployees = useLoggedUserStore(
    state => state.setActivesEmployees
  );
  const setInactiveEmployees = useLoggedUserStore(
    state => state.setInactiveEmployees
  );
  const showDeletedEmployees = useLoggedUserStore(
    state => state.showDeletedEmployees
  );
  const setShowDeletedEmployees = useLoggedUserStore(
    state => state.setShowDeletedEmployees
  );
  const allCompany = useLoggedUserStore(state => state.allCompanies);
  const [showInactive, setShowInactive] = useState(false);

  return (
    <div className="flex flex-col gap-6 py-4 px-0 mr-6">
      <Tabs defaultValue="employees" className="w-full ml-4">
        <TabsList>
          <TabsTrigger value="employees" >Empleados</TabsTrigger>
          <TabsTrigger value="equipment" >Equipos</TabsTrigger>
        </TabsList>
        <TabsContent value="employees">
          <Card className="overflow-hidden">
            <CardHeader className="w-full flex bg-muted dark:bg-muted/50 border-b-2 flex-row justify-between">
              <CardTitle className="text-2xl font-bold tracking-tight w-fit">Empleados</CardTitle>
              <CardDescription className="text-muted-foreground w-fit"></CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={filteredCustomersEmployees || []}
                setActivesEmployees={setActivesEmployees}
                setInactiveEmployees={setInactiveEmployees}
                showDeletedEmployees={showDeletedEmployees}
                setShowDeletedEmployees={setShowDeletedEmployees}
              />
            </CardContent>
            <CardFooter>

            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="equipment">
          <Card className="overflow-hidden">
            <CardHeader className="w-full flex bg-muted dark:bg-muted/50 border-b-2 flex-row justify-between">
              <CardTitle className="text-2xl font-bold tracking-tight w-fit">Equipos</CardTitle>
              <CardDescription className="text-muted-foreground w-fit"></CardDescription>
            </CardHeader>
            <CardContent>
              <DataEquipment
                columns={columns1}
                data={filteredCustomersEquipment || []}
                allCompany={allCompany}
                showInactive={showInactive}
                setShowInactive={setShowInactive}
              />
            </CardContent>
            <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3">

            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


