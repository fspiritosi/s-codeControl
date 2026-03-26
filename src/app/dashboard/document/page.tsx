import DocumentNav from '@/shared/components/common/DocumentNav';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { prisma } from '@/shared/lib/prisma';
import { supabaseServer } from '@/shared/lib/supabase/server';
import { CompanyDocumentsType } from '@/shared/store/loggedUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { UrlTabs, UrlTabsContent, UrlTabsList, UrlTabsTrigger } from '@/shared/components/ui/url-tabs';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import CompanyTabs from '@/modules/documents/features/list/components/CompanyTabs';
import EmployeeDocumentsTabs from '@/modules/documents/features/list/components/EmployeeDocumentsTabs';
import EquipmentTabs from '@/modules/documents/features/list/components/EquipmentTabs';
import TypesDocumentsView from '@/modules/documents/features/types/components/TypesDocumentsView';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

const VALID_TABS = ['employees', 'equipment', 'company', 'types'] as const;
type DocumentTab = (typeof VALID_TABS)[number];

export default async function DocumentPage({
  searchParams,
}: {
  searchParams: Promise<DataTableSearchParams & { tab?: string }>;
}) {
  const resolved = await searchParams;
  const currentTab: DocumentTab = VALID_TABS.includes(resolved.tab as DocumentTab)
    ? (resolved.tab as DocumentTab)
    : 'employees';

  const supabase = await supabaseServer();
  const user = await supabase.auth.getUser();
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
  const documents_company = documents_company_raw.map((doc) => ({
    ...doc,
    id_document_types: doc.document_type,
    user_id: doc.user,
  }));

  const typedDataCompany: CompanyDocumentsType[] | null = documents_company as unknown as CompanyDocumentsType[] | null;
  const companyData =
    role === 'Invitado' ? typedDataCompany?.filter((e) => !e.id_document_types.private) : typedDataCompany;

  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <UrlTabs value={currentTab} paramName="tab" baseUrl="/dashboard/document">
        <UrlTabsList className="mx-6 mt-4">
          <UrlTabsTrigger value="employees">Documentos de empleados</UrlTabsTrigger>
          <UrlTabsTrigger value="equipment">Documentos de equipos</UrlTabsTrigger>
          <UrlTabsTrigger value="company">Documentos de empresa</UrlTabsTrigger>
          <UrlTabsTrigger value="types">Tipos de documentos</UrlTabsTrigger>
        </UrlTabsList>

        <UrlTabsContent value="employees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documentos cargados</CardTitle>
                <CardDescription>Aquí encontrarás todos los documentos de tus empleados</CardDescription>
              </div>
              <DocumentNav onlyEmployees onlyEquipment />
            </CardHeader>
            <CardContent>
              <EmployeeDocumentsTabs searchParams={resolved} />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="equipment">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documentos cargados</CardTitle>
                <CardDescription>Aquí encontrarás todos los documentos de tus equipos</CardDescription>
              </div>
              <DocumentNav onlyEmployees onlyEquipment />
            </CardHeader>
            <CardContent>
              <EquipmentTabs searchParams={resolved} />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="company">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documentos cargados</CardTitle>
                <CardDescription>Aquí encontrarás todos los documentos de tu empresa</CardDescription>
              </div>
              <DocumentNav onlyEmployees onlyEquipment />
            </CardHeader>
            <CardContent>
              <CompanyTabs companyData={companyData as any} />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de documentos</CardTitle>
              <CardDescription>Tipos de documentos auditables</CardDescription>
            </CardHeader>
            <CardContent>
              <TypesDocumentsView equipos empresa personas searchParams={resolved} />
            </CardContent>
          </Card>
        </UrlTabsContent>
      </UrlTabs>
    </Suspense>
  );
}
