import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { fetchAllEquipment } from '@/app/server/GET/actions';
import { EquipmentColums } from '../columns';
import { EquipmentTable } from '../data-equipment';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase/server';
import { getActualRole } from '@/lib/utils';

async function EquipmentListTabs({ inactives, actives }: { inactives?: boolean; actives?: boolean }) {
  const equipments = await fetchAllEquipment();
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const company_id = cookiesStore.get('actualComp')?.value;
  const role = await getActualRole(
    company_id as string,
    user?.id as string
  );

  const onlyVehicles = equipments?.filter((v) => v.types_of_vehicles.id == '1');
  const onlyNoVehicles = equipments?.filter((v) => v.types_of_vehicles.id == '2');
  // const data = setVehiclesToShow(equipments);

  return (
    <div className="overflow-x-auto max-w-full">
      <Tabs defaultValue="all">
        <CardContent>
          <TabsList>
            <TabsTrigger value="all">Todos los equipos</TabsTrigger>
            <TabsTrigger value="vehicles">Solo vehículos</TabsTrigger>
            <TabsTrigger value="others">Otros</TabsTrigger>
          </TabsList>
        </CardContent>
        <TabsContent value="all">
          <EquipmentTable role={role} columns={EquipmentColums || []} data={equipments || []} />
        </TabsContent>
        <TabsContent value="vehicles">
          <EquipmentTable role={role} columns={EquipmentColums || []} data={onlyVehicles || []} />
        </TabsContent>
        <TabsContent value="others">
          <EquipmentTable role={role} columns={EquipmentColums || []} data={onlyNoVehicles || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EquipmentListTabs;
