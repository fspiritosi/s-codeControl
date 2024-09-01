import { RepairsSolicituds } from '@/types/types';
import { cookies } from 'next/headers';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';

export default async function RepairSolicitudes() {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value;
  const { repair_solicitudes } = await fetch(`${URL}/api/repair_solicitud?actual=${company_id}`).then((res) =>
    res.json()
  );

  console.log('repair_solicitudes', repair_solicitudes);

  const repairsFormatted = (repair_solicitudes as RepairsSolicituds).map((repair) => {
    return {
      id: repair.id,
      title: repair.reparation_type.name,
      state: repair.state,
      label: '',
      priority: repair.reparation_type.criticity,
      created_at: repair.created_at,
      equipment: `${repair.equipment_id.domain} - ${repair.equipment_id.intern_number}`,
      //description
    };
  });

  return <DataTable data={repairsFormatted} columns={columns} />;
}
