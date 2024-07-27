'use client';
import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { columnsGuests } from '@/app/dashboard/company/actualCompany/components/columnsGuests';
import { DataTable } from '@/app/dashboard/company/actualCompany/components/data-table';
import { columns } from '@/app/dashboard/company/actualCompany/components/columns';
import { supabaseServer } from '@/lib/supabase/server';
import cookies from 'js-cookie';
import { useLoggedUserStore } from '@/store/loggedUser';
export default function UsersTabComponent() {
  const sharedUsersAll = useLoggedUserStore((state) => state.sharedUsers);
  const ownerUser = useLoggedUserStore((state) => state.profile);
    // const supabase = supabaseServer();
    // const user = await supabase.auth.getUser();
    const URL = process.env.NEXT_PUBLIC_BASE_URL;
    
    const company_id = cookies.get('actualComp');
    // const ownerUserResponse = await fetch(`${URL}/api/profile/?user=${user?.data?.user?.id}`);
    // const ownerUser = await ownerUserResponse.json();
    // console.log(ownerUser.data);
    const userShared = cookies.get('guestRole');
 
    // const { data: userShared } = await supabase
    // .from('share_company_users')
    // .select('*')
    // .eq('profile_id', user?.data?.user?.id);
    // console.log(userShared);
    
    // let { data: sharedUsersAll, error: sharedError } = await supabase
    // .from('share_company_users')
    // .select(`*, profile_id(*)`)
    //   .eq('company_id', company_id);

    // console.log(sharedUsersAll, "sharedUsersAll");

    const owner = ownerUser?.map((user: any) => {
        return {
          email: user.email,
          fullname: user.fullname as string,
          role: 'Propietario',
          alta: user.created_at ? new Date(user.created_at) : new Date(),
          id: user.id || '',
          img: user.avatar || '',
        };
      });
    // console.log(owner);

    const sharedUsers =
    sharedUsersAll?.map((user) => {
      console.log(user);
      return {
        email: user.profile_id?.email,
        fullname: user.profile_id.fullname,
        role: user?.role,
        alta: user.created_at,
        id: user.id,
        img: user.profile_id.avatar || '',
        customerName: user.customer_id?.name,
      };
    }) || [];
    // console.log(sharedUsers);
    const data = owner?.concat(
        sharedUsers
          ?.filter((user) => user.role !== 'Invitado') // Filtrar usuarios donde el rol no sea "Invitado"
          ?.map((user) => ({
            ...user,
            fullname: user.fullname || '',
          })) || []
      );
      // console.log(data);
      const guestsData =
        sharedUsers
          ?.filter((user) => user.role === 'Invitado') // Filtrar usuarios donde el rol no sea "Invitado"
          ?.map((user) => ({
            ...user,
            fullname: user.fullname || '',
          })) || [];
          // console.log(guestsData);
  
  return (
    <div>
        <Tabs defaultValue="employ" className="w-full">
                <TabsList className="ml-8">
                  <TabsTrigger value="employ">Empleados</TabsTrigger>
                  <TabsTrigger value="guests">Invitados</TabsTrigger>
                </TabsList>
                <TabsContent value="employ">
                  <div className="p-8">
                    <DataTable data={data || []} columns={columns} />
                  </div>
                </TabsContent>
                <TabsContent value="guests">
                  <div className="p-8">
                    <DataTable data={guestsData || []} columns={columnsGuests} />
                  </div>
                </TabsContent>
              </Tabs>
    </div>
  )
}
