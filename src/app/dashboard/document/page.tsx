import DocumentNav from '@/shared/components/common/DocumentNav';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import Viewcomponent from '@/shared/components/common/ViewComponent';
import { prisma } from '@/shared/lib/prisma';
// TODO: Phase 8 — migrate auth to NextAuth
import { supabaseServer } from '@/shared/lib/supabase/server';
import { CompanyDocumentsType } from '@/shared/store/loggedUser';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import CompanyTabs from '@/modules/documents/features/list/components/CompanyTabs';
import EmployeeDocumentsTabs from '@/modules/documents/features/list/components/EmployeeDocumentsTabs';
import EquipmentTabs from '@/modules/documents/features/list/components/EquipmentTabs';
import TypesDocumentAction from '@/modules/documents/features/types/components/TypesDocumentAction';
import TypesDocumentsView from '@/modules/documents/features/types/components/TypesDocumentsView';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

export default async function page({ searchParams }: { searchParams: Promise<DataTableSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const supabase = await supabaseServer();
  const user = await supabase.auth.getUser();
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const cookiesStore = await cookies();
  const userId = user?.data?.user?.id;
  const userShared = userId
    ? await prisma.share_company_users.findMany({
        where: { profile_id: userId },
      })
    : [];
  const role: string | null = userShared?.[0]?.role || null;
  const actualCompany = cookiesStore.get('actualComp')?.value;

  const documents_company_raw = await prisma.documents_company.findMany({
    where: { applies: actualCompany || '' },
    include: { document_type: true, user: true },
  });
  // Reshape to match Supabase shape expected by template
  const documents_company = documents_company_raw.map((doc) => ({
    ...doc,
    id_document_types: doc.document_type,
    user_id: doc.user,
  }));

  const typedDataCompany: CompanyDocumentsType[] | null = documents_company as unknown as CompanyDocumentsType[] | null;

  const companyData =
    role === 'Invitado' ? typedDataCompany?.filter((e) => !e.id_document_types.private) : typedDataCompany;

  const viewData = {
    defaultValue: 'Documentos de empleados',
    tabsValues: [
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
              <DocumentNav onlyEmployees onlyEquipment />
            </div>
          ),
          component: <EmployeeDocumentsTabs searchParams={resolvedSearchParams} />,
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
            <DocumentNav onlyEmployees onlyEquipment />
          </div>
          ),
          component: <EquipmentTabs searchParams={resolvedSearchParams} />,
        },
      },
      {
        value: 'Documentos de empresa',
        name: 'Documentos de empresa',
        restricted: [''],
        content: {
          title: 'Documentos cargados',
          description: 'Aquí encontrarás todos los documentos de tus empresa',
          buttonActioRestricted: [''],
          buttonAction: (
            <div className="flex gap-4 flex-wrap pl-6">
              <DocumentNav onlyEmployees onlyEquipment />
            </div>
          ),
          component: <CompanyTabs companyData={companyData as any} />,
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
          buttonAction: <TypesDocumentAction optionChildrenProp="all" />,
          component: <TypesDocumentsView equipos empresa personas />,
        },
      },
      // {
      //   value: 'forms',
      //   name: 'Formularios',
      //   restricted: [],
      //   content: {
      //     title: 'Formularios',
      //     description: 'Formularios de documentos',
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
