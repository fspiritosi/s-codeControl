import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import { getRepairSolicitudesPaginated } from '@/modules/maintenance/features/repairs/actions.server';
import { repairSolicitudesColums } from './components/columns';
import { mechanicColums } from './components/mechanicColumns';
import { RepairSolicitudesDataTable } from './_RepairSolicitudesDataTable';

interface Props {
  mechanic?: boolean;
  finalized?: boolean;
  default_equipment_id?: string;
  searchParams?: DataTableSearchParams;
}

export default async function RepairSolicitudes({
  mechanic,
  finalized,
  default_equipment_id,
  searchParams,
}: Props) {
  const params = searchParams ?? {};
  const { data, total } = await getRepairSolicitudesPaginated(params, {
    mechanic,
    finalized,
    defaultEquipmentId: default_equipment_id,
  });

  // En finalizadas usamos las columnas estándar (no las de mecánico con acciones de flujo).
  const columns = (mechanic && !finalized ? mechanicColums : repairSolicitudesColums) as any;
  const tableId = finalized
    ? 'repair-solicitudes-finalized'
    : mechanic
      ? 'repair-solicitudes-mechanic'
      : 'repair-solicitudes';

  return (
    <RepairSolicitudesDataTable
      data={data as any[]}
      totalRows={total}
      searchParams={params}
      columns={columns}
      mechanic={mechanic}
      finalized={finalized}
      defaultEquipmentId={default_equipment_id}
      tableId={tableId}
    />
  );
}
