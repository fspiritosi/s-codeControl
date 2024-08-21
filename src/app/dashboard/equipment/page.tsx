import DocumentNav from '@/components/DocumentNav';
import Viewcomponent from '@/components/ViewComponent';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import EquipmentTabs from '../document/documentComponents/EquipmentTabs';
import TypesDocumentAction from '../document/documentComponents/TypesDocumentAction';
import TypesDocumentsView from '../document/documentComponents/TypesDocumentsView';
import CreatedForm from '../maintenance/components/CreatedForm';
import EquipmentListTabs from './equipmentComponentes/EquipmentListTabs';
export default async function Equipment() {
  const viewData = {
    defaultValue: 'equipos',
    tabsValues: [
      {
        value: 'equipos',
        name: 'Equipos',
        restricted: [],
        content: {
          title: 'Equipos totales',
          description: 'Todos los equipos',
          buttonActioRestricted: [''],
          buttonAction: (
            <div className="flex gap-4 flex-wrap pl-6">
              <Link
                href="/dashboard/equipment/action?action=new"
                className={[' py-2 px-4 rounded', buttonVariants({ variant: 'default' })].join(' ')}
              >
                Agregar nuevo equipo
              </Link>
            </div>
          ),
          component: <EquipmentListTabs />,
        },
      },
      {
        value: 'Documentos de equipos',
        name: 'Documentos de equipos',
        restricted: [''],
        content: {
          title: 'Documentos cargados',
          description: 'Aquí encontrarás todos los documentos de tus equipos',
          buttonActioRestricted: [''],
          buttonAction: (
            <div className="flex gap-4 flex-wrap pl-6">
              <DocumentNav equipment />
            </div>
          ),
          component: <EquipmentTabs />,
        },
      },
      {
        value: 'Tipos de documentos',
        name: 'Tipos de documentos',
        restricted: ['Invitado'],
        content: {
          title: 'Tipos de documentos',
          buttonActioRestricted: [''],
          description: 'Tipos de documentos auditables',
          buttonAction: <TypesDocumentAction optionChildrenProp="Equipos" />,
          component: <TypesDocumentsView equipos />,
        },
      },
      // {
      //   value: 'forms',
      //   name: 'Formularios',
      //   restricted: [],
      //   content: {
      //     title: 'Formularios',
      //     description: 'Formularios de equipos',
      //     buttonActioRestricted: [''],
      //     // buttonAction: <TypesDocumentAction optionChildrenProp="Personas" />,
      //     component: <CreatedForm />,
      //   },
      // },
    ],
  };

  return <Viewcomponent viewData={viewData} />;
}
