import { RepairsSolicituds } from '@/types/types';
import { cookies } from 'next/headers';
import { repairSolicitudesColums } from './components/columns';
import { DataTable } from './components/data-table';
import { mechanicColums } from './components/mechanicColumns';

export default async function RepairSolicitudes({
  mechanic,
  default_equipment_id,
}: {
  mechanic?: boolean;
  default_equipment_id?: string;
}) {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value;
  const { repair_solicitudes } = await fetch(`${URL}/api/repair_solicitud?actual=${company_id}`).then((res) =>
    res.json()
  );

  const Allrepairs = default_equipment_id
    ? (repair_solicitudes as RepairsSolicituds).filter((repair) => repair.equipment_id.id === default_equipment_id)
    : (repair_solicitudes as RepairsSolicituds);


  const repairsFormatted = Allrepairs.map((repair) => {
    return {
      id: repair.id,
      title: repair.reparation_type.name,
      state: repair.state,
      label: '',
      priority: repair.reparation_type.criticity,
      created_at: repair.created_at,
      equipment: `${repair.equipment_id?.domain} - ${repair.equipment_id?.intern_number}`,
      description: repair.user_description,
      user_description: repair.user_description,
      year: repair.equipment_id.year,
      brand: repair.equipment_id.brand.name,
      model: repair.equipment_id.model.name,
      domain: repair.equipment_id.domain ?? repair.equipment_id.serie,
      engine: repair.equipment_id.engine,
      serie: repair.equipment_id.serie,
      status: repair.equipment_id.status,
      chassis: repair.equipment_id.chassis,
      picture: repair.equipment_id.picture,
      type_of_equipment: repair.equipment_id.type.name,
      solicitud_status: repair.state,
      type_of_maintenance: repair.reparation_type.type_of_maintenance,
      user_images: repair.user_images,
      mechanic_images: repair.mechanic_images,
      repairlogs: repair.repairlogs,
      mechanic_description: repair.mechanic_description,
      vehicle_id: repair.equipment_id.id,
      vehicle_condition: repair.equipment_id.condition,
      intern_number: repair.equipment_id.intern_number,
      kilometer: repair.kilometer,
    };
  });

  return <DataTable data={repairsFormatted} columns={mechanic ? mechanicColums : repairSolicitudesColums} />;
}
