import { fetchAllEquipment } from '@/modules/equipment/features/list/actions.server';
import { fetchCustomForms } from '@/modules/forms/features/custom-forms/actions.server';
import ChecklistTable from '@/modules/hse/features/checklist/components/ListOfChecklist';
import Viewcomponent from '@/shared/components/common/ViewComponent';
import { ReportModal } from '@/modules/forms/features/custom-forms/components/ReportModal';
async function MantenimientoPage() {
  const checklists = await fetchCustomForms();
  const vehicles = await fetchAllEquipment();

  const viewData = {
    defaultValue: 'formularios',
    tabsValues: [
      {
        value: 'formularios',
        name: 'Tipos de checklist',
        restricted: [''],

        content: {
          title: 'Tipos de checklist',
          description: 'Aqui encontraras los checkList de mantenimiento',
          buttonActioRestricted: ['Invitado'],
          buttonAction: <ReportModal vehicles={vehicles as unknown as VehicleWithBrand[]} checklists={checklists as unknown as CheckListWithAnswer[]} />,
          component: <ChecklistTable checklists={checklists as unknown as CheckListWithAnswer[]} />,
        },
      },
      // {
      //   value: 'create_new_form',
      //   name: 'Crear nuevo formulario',
      //   restricted: [''],
      //   content: {
      //     title: 'Crear nuevo formulario',
      //     description: 'Aquí podrás crear un nuevo formulario',
      //     buttonActioRestricted: [''],
      //     component: <NewForm />,
      //   },
      // },
      // {
      //   value: 'Cargados',
      //   name: 'Formularios cargados',
      //   restricted: [''],
      //   content: {
      //     title: 'Formularios cargados',
      //     description: 'Aquí encontrarás todos los formularios cargados',
      //     buttonActioRestricted: [''],
      //     component: <FormCustomContainer showAnswers={true} employees={true} company={true}  documents={true} equipment={true} />,
      //   },
      // },
    ],
  };

  return (
    <div className="h-full">
      <Viewcomponent viewData={viewData} />
    </div>
  );
}

export default MantenimientoPage;
