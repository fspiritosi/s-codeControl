//'use client';
import { columns } from '@/modules/company/features/detail/components/columns';
import { columnsGuests } from '@/modules/company/features/detail/components/columnsGuests';
import { DataTable } from '@/shared/components/data-table';
import { getAllUsers, getOwnerUser } from '@/modules/company/features/users/actions.server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

//import cookies from 'js-cookie';
//import { cookies } from 'next/headers';
//import { useLoggedUserStore } from '@/shared/store/loggedUser';
export default async function UsersTabComponent() {
  // const URL = process.env.NEXT_PUBLIC_BASE_URL;

  // const coockiesStore = await cookies();
  // const company_id = coockiesStore.get('actualComp')?.value;

  //const { data: company } = await fetch(`${URL}/api/company/?actual=${company_id}`).then((res) => res.json());
  //const { data: ownerUser } = await fetch(`${URL}/api/profile/?user=${company[0]?.owner_id}`).then((res) => res.json());
  //const { company_users } = await fetch(`${URL}/api/company/users/?actual=${company_id}`).then((res) => res.json());
  const ownerUser = await getOwnerUser();
  const company_users = await getAllUsers();
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
        email: user.profile?.email,
        fullname: user.profile?.fullname,
        role: user?.role,
        alta: user.created_at,
        id: user.id,
        img: user.profile?.avatar || '',
        customerName: user.customer?.name,
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
            <DataTable data={data || []} columns={columns} searchColumn="fullname" searchPlaceholder="Filtrar Nombre" showSearch />
          </div>
        </TabsContent>
        <TabsContent value="guests">
          <div className="p-8">
            <DataTable data={guestsData || []} columns={columnsGuests} searchColumn="fullname" searchPlaceholder="Filtrar Nombre" showSearch />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
