import EmployesDiagram from '@/modules/employees/features/diagrams/components/EmployesDiagram';
import DocumentNav from '@/shared/components/common/DocumentNav';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import Viewcomponent from '@/shared/components/common/ViewComponent';
import { buttonVariants } from '@/shared/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';
import CovenantTreeFile from '@/modules/company/features/covenants/components/CovenantTreeFile';
import EmployeeDocumentsTabs from '@/modules/documents/features/list/components/EmployeeDocumentsTabs';
import EmployeeListTabs from '@/modules/documents/features/list/components/EmployeeListTabs';
import TypesDocumentsView from '@/modules/documents/features/types/components/TypesDocumentsView';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

const EmployeePage = async ({ searchParams }: { searchParams: Promise<DataTableSearchParams> }) => {
  const resolvedSearchParams = await searchParams;
  const viewData = {
    defaultValue: 'employees',
    tabsValues: [
      {
        value: 'employees',
        name: 'Empleados',
        restricted: [],
        content: {
          title: 'Empleados',
          description: 'Aquí encontrarás todos empleados',
          buttonActioRestricted: ['Invitado'],
          buttonAction: (
            <div className="flex gap-4 flex-wrap pl-6">
              <Link
                href="/dashboard/employee/action?action=new"
                className={['py-2 px-4 rounded', buttonVariants({ variant: 'default' })].join(' ')}
              >
                Agregar nuevo empleado
              </Link>
            </div>
          ),
          component: <EmployeeListTabs actives inactives searchParams={resolvedSearchParams} />,
        },
      },
      {
        value: 'Documentos de empleados',
        name: 'Documentos de empleados',
        restricted: ['Invitado'],
        content: {
          title: 'Documentos cargados',
          description: 'Aquí encontrarás todos los documentos de tus empleados',
          buttonActioRestricted: ['Invitado'],
          buttonAction: (
            <div className="flex gap-4 flex-wrap pl-6">
              <DocumentNav onlyEmployees />
            </div>
          ),
          component: <EmployeeDocumentsTabs searchParams={resolvedSearchParams} />,
        },
      },
      {
        value: 'diagrams',
        name: 'Diagramas',
        restricted: ['Invitado'],
        content: {
          title: 'Diagramas de personal',
          description: 'Carga de novedades de trabajo del personal',
          buttonActioRestricted: [''],
          component: <EmployesDiagram />,
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
          component: <TypesDocumentsView personas searchParams={resolvedSearchParams} />,
        },
      },
      {
        value: 'covenant',
        name: 'Convenios colectivos de trabajo',
        restricted: ['Invitado'],
        content: {
          title: 'Convenios colectivos de trabajo',
          description: 'Lista de Convenios colectivos de trabajo',
          buttonActioRestricted: [''],
          component: <CovenantTreeFile />,
        },
      },
      // {
      //   value: 'forms',
      //   name: 'Formularios',
      //   restricted: [],
      //   content: {
      //     title: 'Formularios',
      //     description: 'Formularios de empleados',
      //     buttonActioRestricted: [''],
      //     component: <CreatedForm />,
      //   },
      // },
    ],
  };

  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <Viewcomponent viewData={viewData} />
    </Suspense>
  );
};

export default EmployeePage;
