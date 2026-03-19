import DocumentNav from '@/shared/components/common/DocumentNav';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import RepairTypes from '@/modules/maintenance/features/repairs/components/RepairTypes';
import Viewcomponent from '@/shared/components/common/ViewComponent';
import { buttonVariants } from '@/shared/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';
import EquipmentTabs from '@/modules/documents/features/list/components/EquipmentTabs';
import TypesDocumentAction from '@/modules/documents/features/types/components/TypesDocumentAction';
import TypesDocumentsView from '@/modules/documents/features/types/components/TypesDocumentsView';
import EquipmentListTabs from '@/modules/equipment/features/list/components/EquipmentListTabs';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

export default async function Equipment({ searchParams }: { searchParams: Promise<DataTableSearchParams> }) {
  const resolvedSearchParams = await searchParams;
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
          buttonActioRestricted: ['Invitado'],
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
        restricted: ['Invitado'],
        content: {
          title: 'Documentos cargados',
          description: 'Aquí encontrarás todos los documentos de tus equipos',
          buttonActioRestricted: [''],
          buttonAction: (
            <div className="flex gap-4 flex-wrap pl-6">
              <DocumentNav onlyEquipment />
            </div>
          ),
          component: <EquipmentTabs searchParams={resolvedSearchParams} />,
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
      {
        value: 'type_of_repairs',
        name: 'Mantenimiento',
        restricted: ['Invitado'],
        content: {
          title: 'Mantenimiento de unidades',
          description: 'Genera solicitudes de mantenimiento para tus equipos',
          buttonActioRestricted: [''],
          component: <RepairTypes type_of_repair_new_entry created_solicitudes defaultValue="created_solicitudes" />,
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

  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <Viewcomponent viewData={viewData} />
    </Suspense>
  );
}
