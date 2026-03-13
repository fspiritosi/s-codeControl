import RepairsSkeleton from '@/shared/components/common/Skeletons/RepairsSkeleton';
import RepairTypes from '@/modules/maintenance/features/repairs/components/RepairTypes';
import Viewcomponent from '@/shared/components/common/ViewComponent';
import { Suspense } from 'react';
function MantenimientoPage() {
  const viewData = {
    defaultValue: 'type_of_repairs',
    tabsValues: [
      {
        value: 'type_of_repairs',
        name: 'Solicitudes de mantenimiento',
        restricted: [],
        content: {
          title: 'Mantenimiento de unidades',
          description: 'Genera solicitudes de mantenimiento para tus equipos',
          buttonActioRestricted: [''],
          component: (
            <RepairTypes
              created_solicitudes
              type_of_repair
              type_of_repair_new_entry
              type_of_repair_new_entry2
              type_of_repair_new_entry3
              mechanic
            />
          ),
        },
      },
    ],
  };

  return (
    <Suspense fallback={<RepairsSkeleton />}>
      <div className="h-full">
        <Viewcomponent viewData={viewData} />
      </div>
    </Suspense>
  );
}

export default MantenimientoPage;
