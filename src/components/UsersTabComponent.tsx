//'use client';
import { columns } from '@/app/dashboard/company/actualCompany/components/columns';
import { columnsGuests } from '@/app/dashboard/company/actualCompany/components/columnsGuests';
import { DataTable } from '@/app/dashboard/company/actualCompany/components/data-table';
import { getAllUsers, getOwnerUser } from '@/app/server/GET/actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

//import cookies from 'js-cookie';
//import { cookies } from 'next/headers';
//import { useLoggedUserStore } from '@/store/loggedUser';
export default async function UsersTabComponent() {
  // const URL = process.env.NEXT_PUBLIC_BASE_URL;

  // const coockiesStore = cookies();
  // const company_id = coockiesStore.get('actualComp')?.value;

  //const { data: company } = await fetch(`${URL}/api/company/?actual=${company_id}`).then((res) => res.json());
  //const { data: ownerUser } = await fetch(`${URL}/api/profile/?user=${company[0]?.owner_id}`).then((res) => res.json());
  //const { company_users } = await fetch(`${URL}/api/company/users/?actual=${company_id}`).then((res) => res.json());
  const ownerUser = await getOwnerUser();
  const company_users = await getAllUsers();
  //console.log('usuarios', company_users);
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

  const sharedUsers =
    company_users?.map((user: any) => {
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

  const data = owner?.concat(
    sharedUsers
      ?.filter((user: any) => user.role !== 'Invitado') // Filtrar usuarios donde el rol no sea "Invitado"
      ?.map((user: any) => ({
        ...user,
        fullname: user.fullname || '',
        customerName: user.customerName || '',
      })) || []
  );

  const guestsData =
    sharedUsers
      ?.filter((user: any) => user.role === 'Invitado')
      ?.map((user: any) => ({
        ...user,
        fullname: user.fullname || '',
        customerName: user.customerName || '',
      })) || []; // Filtrar usuarios donde el rol no sea "Invitado"

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
  );
}
