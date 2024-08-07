import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseServer } from '@/lib/supabase/server';
import { setEmployeesToShow } from '@/lib/utils/utils';
import { cookies } from 'next/headers';
import { EmployeesListColumns } from '../../employee/columns';

import { EmployeesTable } from '../../employee/data-table';
import { EquipmentColums } from '../columns';
import { EquipmentTable } from '../data-equipment';

async function EquipmentListTabs({ inactives, actives }: { inactives?: boolean; actives?: boolean }) {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value;

  const { data } = await fetch(`${URL}/api/equipment?actual=${company_id}&user=${user?.id}`).then((e) => e.json());
  
  const onlyVehicles = data?.filter((v: { type_of_vehicle: number }) => v.type_of_vehicle === 1);
  const onlyNoVehicles = data?.filter((v: { type_of_vehicle: number }) => v.type_of_vehicle === 2);

 
  return (
    <Tabs defaultValue="all">
      <CardContent>
        <TabsList>
          <TabsTrigger value="all">Todos los equipos</TabsTrigger>
          <TabsTrigger value="vehicles">Solo vehículos</TabsTrigger>
          <TabsTrigger value="others">Otros</TabsTrigger>
        </TabsList>
      </CardContent>
      <TabsContent value="all">
        <EquipmentTable columns={EquipmentColums||[]} data={data || []} />
      </TabsContent>
      <TabsContent value="vehicles">
        <EquipmentTable columns={EquipmentColums||[]} data={onlyVehicles || []} />
      </TabsContent>
      <TabsContent value="others">
        <EquipmentTable columns={EquipmentColums||[]} data={onlyNoVehicles || []} />
      </TabsContent>
    </Tabs>
  );
}

export default EquipmentListTabs;