import RepairsSkeleton from '@/shared/components/common/Skeletons/RepairsSkeleton';
import RepairTypes from '@/modules/maintenance/features/repairs/components/RepairTypes';
import RepairSolicitudes from '@/modules/maintenance/features/repairs/components/RepairSolicitudesTable/RepairSolicitudes';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  UrlTabs,
  UrlTabsContent,
  UrlTabsList,
  UrlTabsTrigger,
} from '@/shared/components/ui/url-tabs';
import type { DataTableSearchParams } from '@/shared/components/data-table/types';
import { Suspense } from 'react';

async function MantenimientoPage({
  searchParams,
}: {
  searchParams: Promise<DataTableSearchParams & { tab?: string }>;
}) {
  const resolved = await searchParams;
  const tab = resolved.tab === 'finalizadas' ? 'finalizadas' : 'solicitudes';

  return (
    <Suspense fallback={<RepairsSkeleton />}>
      <div className="flex flex-col gap-6 py-4 px-6 h-full">
        <UrlTabs value={tab} paramName="tab" baseUrl="/dashboard/maintenance">
          <UrlTabsList className="w-fit">
            <UrlTabsTrigger value="solicitudes">Solicitudes de mantenimiento</UrlTabsTrigger>
            <UrlTabsTrigger value="finalizadas">Solicitudes finalizadas</UrlTabsTrigger>
          </UrlTabsList>

          <UrlTabsContent value="solicitudes">
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted dark:bg-muted/50 border-b-2">
                <CardTitle className="text-2xl font-bold tracking-tight">
                  Mantenimiento de unidades
                </CardTitle>
                <CardDescription>
                  Genera solicitudes de mantenimiento para tus equipos
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4 px-4">
                {tab === 'solicitudes' && (
                  <RepairTypes
                    created_solicitudes
                    type_of_repair
                    type_of_repair_new_entry
                    type_of_repair_new_entry2
                    type_of_repair_new_entry3
                    mechanic
                    searchParams={resolved}
                  />
                )}
              </CardContent>
            </Card>
          </UrlTabsContent>

          <UrlTabsContent value="finalizadas">
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted dark:bg-muted/50 border-b-2">
                <CardTitle className="text-2xl font-bold tracking-tight">
                  Solicitudes finalizadas
                </CardTitle>
                <CardDescription>
                  Solicitudes de mantenimiento finalizadas. Se muestran las de los últimos 30 días;
                  ampliá el rango con el filtro de fecha o navegá con la paginación.
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4 px-4">
                {tab === 'finalizadas' && (
                  <RepairSolicitudes finalized searchParams={resolved} />
                )}
              </CardContent>
            </Card>
          </UrlTabsContent>
        </UrlTabs>
      </div>
    </Suspense>
  );
}

export default MantenimientoPage;
