import { supabaseServer } from '@/lib/supabase/server';
import { setVehiclesToShow } from '@/lib/utils/utils';
import { TypeOfRepair } from '@/types/types';
import { cookies } from 'next/headers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import RepairNewEntry from './RepairEntry';
import RepairSolicitudes from './RepairSolicitudesTable/RepairSolicitudes';
import { RepairTypeForm } from './RepairTypeForm';

async function RepairTypes({
  type_of_repair_new_entry,
  type_of_repair_new_entry2,
  type_of_repair_new_entry3,
  created_solicitudes,
  type_of_repair,
  defaultValue,
  mechanic,
}: {
  type_of_repair_new_entry?: boolean;
  type_of_repair_new_entry2?: boolean;
  type_of_repair_new_entry3?: boolean;
  created_solicitudes?: boolean;
  type_of_repair?: boolean;
  defaultValue?: string;
  mechanic?: boolean;
}) {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value;
  const { types_of_repairs } = await fetch(`${URL}/api/repairs?actual=${company_id}`).then((res) => res.json());
  const { equipments } = await fetch(`${URL}/api/equipment?actual=${company_id}&user=${user?.id}`).then((e) =>
    e.json()
  );
  const vehiclesFormatted = setVehiclesToShow(equipments);
  return (
    <Tabs defaultValue={defaultValue || 'created_solicitudes'}>
      <TabsList>
        {created_solicitudes && (
          <TabsTrigger value="created_solicitudes">
            {mechanic ? 'Solicitudes activas' : 'Solicitudes de mantenimiento'}
          </TabsTrigger>
        )}
        {type_of_repair_new_entry && (
          <TabsTrigger value="type_of_repair_new_entry">Solicitud de mantenimiento</TabsTrigger>
        )}
        {/* {type_of_repair_new_entry2 && (
          <TabsTrigger value="type_of_repair_new_entry2">Solicitud de mantenimiento preventivo</TabsTrigger>
        )}
        {type_of_repair_new_entry3 && (
          <TabsTrigger value="type_of_repair_new_entry3">Solicitud de mantenimiento correctivo</TabsTrigger>
        )} */}
        {type_of_repair && <TabsTrigger value="type_of_repair">Tipos de reparaciones creados</TabsTrigger>}
      </TabsList>
      <TabsContent value="type_of_repair">
        <RepairTypeForm types_of_repairs={types_of_repairs} />
      </TabsContent>
      <TabsContent value="type_of_repair_new_entry">
        <RepairNewEntry
          user_id={user?.id}
          equipment={vehiclesFormatted}
          tipo_de_mantenimiento={types_of_repairs as TypeOfRepair}
        />
      </TabsContent>
      <TabsContent value="type_of_repair_new_entry2">
        <RepairNewEntry
          tipo_de_mantenimiento={(types_of_repairs as TypeOfRepair).filter(
            (e) => e.type_of_maintenance === 'Preventivo'
          )}
          equipment={vehiclesFormatted}
          limittedEquipment
          user_id={user?.id}
        />
      </TabsContent>
      <TabsContent value="type_of_repair_new_entry3">
        <RepairNewEntry
          user_id={user?.id}
          tipo_de_mantenimiento={(types_of_repairs as TypeOfRepair).filter(
            (e) => e.type_of_maintenance === 'Correctivo'
          )}
          equipment={vehiclesFormatted}
        />
      </TabsContent>
      <TabsContent value="created_solicitudes">
        <RepairSolicitudes mechanic={mechanic} />
      </TabsContent>
    </Tabs>
  );
}

export default RepairTypes;
