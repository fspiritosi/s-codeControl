import { CardContent } from '@/shared/components/ui/card';
import { UrlTabs, UrlTabsContent, UrlTabsList, UrlTabsTrigger } from '@/shared/components/ui/url-tabs';
import { getRole } from '@/shared/lib/utils/getRole';
import { EquipmentList } from './EquipmentList';
import type { DataTableSearchParams } from '@/shared/components/data-table';

/**
 * Sub-tabs activos/inactivos por URL (paramName="subtab").
 * Renderiza en el servidor solo la lista activa en vez de ambas: evita 1 fetch extra
 * y ~2x el payload RSC por carga (escala con el volumen de equipos).
 */
async function EquipmentListTabs({
  searchParams = {},
}: {
  searchParams?: DataTableSearchParams & { subtab?: string };
}) {
  const role = await getRole();
  const currentSub = searchParams.subtab === 'inactive' ? 'inactive' : 'active';

  return (
    <UrlTabs value={currentSub} paramName="subtab" resetParams={['page']}>
      <CardContent>
        <UrlTabsList>
          <UrlTabsTrigger value="active">Equipos activos</UrlTabsTrigger>
          {role !== 'Invitado' && <UrlTabsTrigger value="inactive">Equipos inactivos</UrlTabsTrigger>}
        </UrlTabsList>
      </CardContent>
      <UrlTabsContent value="active">
        {currentSub === 'active' && <EquipmentList searchParams={searchParams} />}
      </UrlTabsContent>
      <UrlTabsContent value="inactive">
        {currentSub === 'inactive' && <EquipmentList searchParams={searchParams} showInactive />}
      </UrlTabsContent>
    </UrlTabs>
  );
}

export default EquipmentListTabs;
