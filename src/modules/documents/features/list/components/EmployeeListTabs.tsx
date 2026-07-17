import { CardContent } from '@/shared/components/ui/card';
import { UrlTabs, UrlTabsContent, UrlTabsList, UrlTabsTrigger } from '@/shared/components/ui/url-tabs';
import { getRole } from '@/shared/lib/utils/getRole';
import { EmployeeList } from '@/modules/employees/features/list/components/EmployeeList';
import type { DataTableSearchParams } from '@/shared/components/data-table';

/**
 * Sub-tabs activos/inactivos por URL (paramName="subtab").
 * Renderiza en el servidor solo la lista activa en vez de ambas: evita 1 fetch extra
 * y ~2x el payload RSC por carga (escala con el volumen de empleados).
 */
async function EmployeeListTabs({
  inactives,
  actives,
  searchParams = {},
}: {
  inactives?: boolean;
  actives?: boolean;
  searchParams?: DataTableSearchParams & { subtab?: string };
}) {
  const role = await getRole();
  const currentSub = searchParams.subtab === 'inactivos' ? 'inactivos' : 'activos';

  return (
    <UrlTabs value={currentSub} paramName="subtab" resetParams={['page']}>
      <CardContent>
        <UrlTabsList>
          {actives && <UrlTabsTrigger value="activos">Empleados activos</UrlTabsTrigger>}
          {inactives && role !== 'Invitado' && <UrlTabsTrigger value="inactivos">Empleados inactivos</UrlTabsTrigger>}
        </UrlTabsList>
      </CardContent>
      <UrlTabsContent value="activos">
        {currentSub === 'activos' && <EmployeeList searchParams={searchParams} />}
      </UrlTabsContent>
      <UrlTabsContent value="inactivos">
        {currentSub === 'inactivos' && <EmployeeList searchParams={searchParams} showInactive />}
      </UrlTabsContent>
    </UrlTabs>
  );
}

export default EmployeeListTabs;
