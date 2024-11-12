import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { setVehiclesToShow } from '@/lib/utils/utils';

import { fetchAllEquipment } from '@/app/server/GET/actions';
import { EquipmentColums } from '../columns';
import { EquipmentTable } from '../data-equipment';

async function EquipmentListTabs({ inactives, actives }: { inactives?: boolean; actives?: boolean }) {
  const equipments = (await fetchAllEquipment()) as any;
  const onlyVehicles = equipments?.filter((v: any) => v.types_of_vehicles === 1)
  const onlyNoVehicles = equipments?.filter((v: any) => v.types_of_vehicles === 2)
  // const data = setVehiclesToShow(equipments);

  // console.log('data', data);

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
          <EquipmentTable columns={EquipmentColums || []} data={equipments || []} />
        </TabsContent>
        <TabsContent value="vehicles">
          <EquipmentTable columns={EquipmentColums || []} data={onlyVehicles || []} />
        </TabsContent>
        <TabsContent value="others">
          <EquipmentTable columns={EquipmentColums || []} data={onlyNoVehicles || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EquipmentListTabs;
