import EmployesDiagram from '@/modules/employees/features/diagrams/components/EmployesDiagram';
import DocumentNav from '@/shared/components/common/DocumentNav';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { buttonVariants } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { UrlTabs, UrlTabsContent, UrlTabsList, UrlTabsTrigger } from '@/shared/components/ui/url-tabs';
import Link from 'next/link';
import { Suspense } from 'react';
import CovenantTreeFile from '@/modules/company/features/covenants/components/CovenantTreeFile';
import EmployeeDocumentsTabs from '@/modules/documents/features/list/components/EmployeeDocumentsTabs';
import EmployeeListTabs from '@/modules/documents/features/list/components/EmployeeListTabs';
import TypesDocumentsView from '@/modules/documents/features/types/components/TypesDocumentsView';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

const VALID_TABS = ['employees', 'documents', 'diagrams', 'types', 'covenant'] as const;
type EmployeeTab = (typeof VALID_TABS)[number];

export default async function EmployeePage({
  searchParams,
}: {
  searchParams: Promise<DataTableSearchParams & { tab?: string }>;
}) {
  const resolved = await searchParams;
  const currentTab: EmployeeTab = VALID_TABS.includes(resolved.tab as EmployeeTab)
    ? (resolved.tab as EmployeeTab)
    : 'employees';

  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <UrlTabs value={currentTab} paramName="tab" baseUrl="/dashboard/employee">
        <UrlTabsList className="mx-6 mt-4">
          <UrlTabsTrigger value="employees">Empleados</UrlTabsTrigger>
          <UrlTabsTrigger value="documents">Documentos de empleados</UrlTabsTrigger>
          <UrlTabsTrigger value="diagrams">Diagramas</UrlTabsTrigger>
          <UrlTabsTrigger value="types">Tipos de documentos</UrlTabsTrigger>
          <UrlTabsTrigger value="covenant">Convenios colectivos de trabajo</UrlTabsTrigger>
        </UrlTabsList>

        <UrlTabsContent value="employees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Empleados</CardTitle>
                <CardDescription>Aquí encontrarás todos empleados</CardDescription>
              </div>
              <Link
                href="/dashboard/employee/action?action=new"
                className={buttonVariants({ variant: 'default' })}
              >
                Agregar nuevo empleado
              </Link>
            </CardHeader>
            <CardContent>
              <EmployeeListTabs actives inactives searchParams={resolved} />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documentos cargados</CardTitle>
                <CardDescription>Aquí encontrarás todos los documentos de tus empleados</CardDescription>
              </div>
              <DocumentNav onlyEmployees />
            </CardHeader>
            <CardContent>
              <EmployeeDocumentsTabs searchParams={resolved} />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="diagrams">
          <Card>
            <CardHeader>
              <CardTitle>Diagramas de personal</CardTitle>
              <CardDescription>Carga de novedades de trabajo del personal</CardDescription>
            </CardHeader>
            <CardContent>
              <EmployesDiagram />
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
              <TypesDocumentsView personas searchParams={resolved} />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="covenant">
          <Card>
            <CardHeader>
              <CardTitle>Convenios colectivos de trabajo</CardTitle>
              <CardDescription>Lista de Convenios colectivos de trabajo</CardDescription>
            </CardHeader>
            <CardContent>
              <CovenantTreeFile />
            </CardContent>
          </Card>
        </UrlTabsContent>
      </UrlTabs>
    </Suspense>
  );
}
