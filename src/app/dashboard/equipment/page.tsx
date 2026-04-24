import DocumentNav from '@/shared/components/common/DocumentNav';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import RepairTypes from '@/modules/maintenance/features/repairs/components/RepairTypes';
import { buttonVariants } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { UrlTabs, UrlTabsContent, UrlTabsList, UrlTabsTrigger } from '@/shared/components/ui/url-tabs';
import Link from 'next/link';
import { Suspense } from 'react';
import EquipmentTabs from '@/modules/documents/features/list/components/EquipmentTabs';
import TypesDocumentsView from '@/modules/documents/features/types/components/TypesDocumentsView';
import EquipmentListTabs from '@/modules/equipment/features/list/components/EquipmentListTabs';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

const VALID_TABS = ['equipos', 'documents', 'types', 'maintenance'] as const;
type EquipmentTab = (typeof VALID_TABS)[number];

export default async function Equipment({
  searchParams,
}: {
  searchParams: Promise<DataTableSearchParams & { tab?: string }>;
}) {
  const resolved = await searchParams;
  const currentTab: EquipmentTab = VALID_TABS.includes(resolved.tab as EquipmentTab)
    ? (resolved.tab as EquipmentTab)
    : 'equipos';

  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <UrlTabs value={currentTab} paramName="tab" baseUrl="/dashboard/equipment">
        <UrlTabsList>
          <UrlTabsTrigger value="equipos">Equipos</UrlTabsTrigger>
          <UrlTabsTrigger value="documents">Documentos de equipos</UrlTabsTrigger>
          <UrlTabsTrigger value="types">Tipos de documentos</UrlTabsTrigger>
          <UrlTabsTrigger value="maintenance">Mantenimiento</UrlTabsTrigger>
        </UrlTabsList>

        <UrlTabsContent value="equipos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Equipos totales</CardTitle>
                <CardDescription>Todos los equipos</CardDescription>
              </div>
              <Link
                href="/dashboard/equipment/action?action=new"
                className={buttonVariants({ variant: 'default' })}
              >
                Agregar nuevo equipo
              </Link>
            </CardHeader>
            <CardContent>
              <EquipmentListTabs searchParams={resolved} />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documentos cargados</CardTitle>
                <CardDescription>Aquí encontrarás todos los documentos de tus equipos</CardDescription>
              </div>
              <DocumentNav onlyEquipment />
            </CardHeader>
            <CardContent>
              <EquipmentTabs searchParams={resolved} />
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
              <TypesDocumentsView equipos searchParams={resolved} />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Mantenimiento de unidades</CardTitle>
              <CardDescription>Genera solicitudes de mantenimiento para tus equipos</CardDescription>
            </CardHeader>
            <CardContent>
              <RepairTypes
                type_of_repair_new_entry
                created_solicitudes
                defaultValue="created_solicitudes"
                searchParams={resolved}
              />
            </CardContent>
          </Card>
        </UrlTabsContent>
      </UrlTabs>
    </Suspense>
  );
}
