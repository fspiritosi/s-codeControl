import DocumentNav from '@/components/DocumentNav';
import Viewcomponent from '@/components/ViewComponent';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import EmployeeDocumentsTabs from '../document/documentComponents/EmployeeDocumentsTabs';
import EmployeeListTabs from '../document/documentComponents/EmployeeListTabs';
import TypesDocumentAction from '../document/documentComponents/TypesDocumentAction';
import TypesDocumentsView from '../document/documentComponents/TypesDocumentsView';
import EmployesDiagram from '@/components/EmployesDiagram';


const EmployeePage = async () => {
  const viewData = {
    defaultValue: 'employees',
    tabsValues: [
      {
        value: 'employees',
        name: 'Empleados',
        restricted: [''],
        content: {
          title: 'Empleados',
          description: 'Aquí encontrarás todos empleados',
          buttonActioRestricted: [''],
          buttonAction: (
            <div className="flex gap-4 flex-wrap pl-6">
              <Link
                href="/dashboard/employee/action?action=new"
                className={[
                  
                  buttonVariants({ variant: 'default' }),
                ].join(' ')}
              >
                Agregar nuevo empleado
              </Link>
            </div>
          ),
          component: <EmployeeListTabs actives inactives />,
        },
      },
      {
        value: 'Documentos de empleados',
        name: 'Documentos de empleados',
        restricted: [''],
        content: {
          title: 'Documentos cargados',
          description: 'Aquí encontrarás todos los documentos de tus empleados',
          buttonActioRestricted: [''],
          buttonAction: (
            <div className="flex gap-4 flex-wrap pl-6">
              <DocumentNav />
            </div>
          ),
          component: <EmployeeDocumentsTabs />,
        },
      },
      {
        value: 'diagrams',
        name: 'Diagramas',
        restricted: ['Invitado'],
        content: {
          title: 'Diagramas de personal',
          description: 'Carga de novedades de trabajo del persoanl',
          buttonActioRestricted: [''],
          buttonAction: <TypesDocumentAction optionChildrenProp="Personas" />,
          component: <EmployesDiagram/>,
        },
      },
      {
        value: 'Tipos de documentos',
        name: 'Tipos de documentos',
        restricted: ['Invitado'],
        content: {
          title: 'Tipos de documentos',
          description: 'Tipos de documentos auditables',
          buttonActioRestricted: [''],
          buttonAction: <TypesDocumentAction optionChildrenProp="Personas" />,
          component: <TypesDocumentsView personas />,
        },
      },
    ],
  };

  return <Viewcomponent viewData={viewData} />;
};

export default EmployeePage;
