import RepairTypes from '@/components/Tipos_de_reparaciones/RepairTypes';
import Viewcomponent from '@/components/ViewComponent';
function MantenimientoPage() {
  const viewData = {
    defaultValue: 'type_of_repairs',
    tabsValues: [
      {
        value: 'type_of_repairs',
        name: 'Tipos de reparaciones',
        restricted: [],
        content: {
          title: 'Tipos de reparaciones',
          description: 'Crea y edita los tipos de reparaciones de tus equipos',
          buttonActioRestricted: [''],
          component: <RepairTypes type_of_repair type_of_repair_new_entry type_of_repair_new_entry2 type_of_repair_new_entry3  />,
        },
      },
    ],
  };

  return (
    <div className="h-full">
      <Viewcomponent viewData={viewData} />
    </div>
  );
}

export default MantenimientoPage;
