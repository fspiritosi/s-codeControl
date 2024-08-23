import { supabaseServer } from '@/lib/supabase/server';
import { setVehiclesToShow } from '@/lib/utils/utils';
import { TypeOfRepair } from '@/types/types';
import { cookies } from 'next/headers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import RepairNewEntry from './RepairEntry';
import { RepairTypeForm } from './RepairTypeForm';

async function RepairTypes() {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value;
  const { types_of_repairs } = await fetch(`${URL}/api/repairs?actual=${company_id}`).then((res) => res.json());
  const { vehicles: equipment } = await fetch(`${URL}/api/equipment?actual=${company_id}&user=${user?.id}`).then((e) =>
    e.json()
  );
  const vehiclesFormatted = setVehiclesToShow(equipment);
  return (
    <Tabs defaultValue="type_of_repair">
      <TabsList>
        <TabsTrigger value="type_of_repair">Tipos de reparaciones creados</TabsTrigger>
        <TabsTrigger value="type_of_repair_new_entry">Solicitud de mantenimiento</TabsTrigger>
        <TabsTrigger value="type_of_repair_new_entry2">Solicitud de mantenimiento preventivo</TabsTrigger>
        <TabsTrigger value="type_of_repair_new_entry3">Solicitud de mantenimiento correctivo</TabsTrigger>
      </TabsList>
      <TabsContent value="type_of_repair">
        <RepairTypeForm types_of_repairs={types_of_repairs} />
      </TabsContent>
      <TabsContent value="type_of_repair_new_entry">
        <RepairNewEntry equipment={vehiclesFormatted} tipo_de_mantenimiento={types_of_repairs as TypeOfRepair} />
      </TabsContent>
      <TabsContent value="type_of_repair_new_entry2">
        <RepairNewEntry
          tipo_de_mantenimiento={(types_of_repairs as TypeOfRepair).filter(
            (e) => e.type_of_maintenance === 'Preventivo'
          )}
          equipment={vehiclesFormatted}
        />
      </TabsContent>
      <TabsContent value="type_of_repair_new_entry3">
        <RepairNewEntry
          tipo_de_mantenimiento={(types_of_repairs as TypeOfRepair).filter(
            (e) => e.type_of_maintenance === 'Correctivo'
          )}
          equipment={vehiclesFormatted}
        />
      </TabsContent>
    </Tabs>
  );
}

export default RepairTypes;
