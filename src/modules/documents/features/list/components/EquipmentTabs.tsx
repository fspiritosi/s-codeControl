import { CardContent } from '@/shared/components/ui/card';
import { UrlTabs, UrlTabsContent, UrlTabsList, UrlTabsTrigger } from '@/shared/components/ui/url-tabs';
import { EquipmentDocumentList } from './EquipmentDocumentList';
import type { DataTableSearchParams } from '@/shared/components/data-table';

const VALID_SUBTABS = ['permanentes', 'mensuales'] as const;
type SubTab = (typeof VALID_SUBTABS)[number];

/**
 * Sub-tabs de documentos de equipo por URL (paramName="subtab").
 * Renderiza en el servidor solo el sub-tab activo en vez de las 2 tablas a la vez:
 * evita 1 fetch extra y ~2x el payload RSC por carga (escala con datos reales).
 */
async function EquipmentTabs({
  searchParams = {},
}: {
  searchParams?: DataTableSearchParams & { subtab?: string };
}) {
  const currentSub: SubTab = VALID_SUBTABS.includes(searchParams.subtab as SubTab)
    ? (searchParams.subtab as SubTab)
    : 'permanentes';

  return (
    <UrlTabs value={currentSub} paramName="subtab" resetParams={['page']}>
      <CardContent>
        <UrlTabsList>
          <UrlTabsTrigger value="permanentes">Documentos permanentes</UrlTabsTrigger>
          <UrlTabsTrigger value="mensuales">Documentos mensuales</UrlTabsTrigger>
        </UrlTabsList>
      </CardContent>
      <UrlTabsContent value="permanentes">
        {currentSub === 'permanentes' && <EquipmentDocumentList searchParams={searchParams} />}
      </UrlTabsContent>
      <UrlTabsContent value="mensuales">
        {currentSub === 'mensuales' && <EquipmentDocumentList searchParams={searchParams} monthly />}
      </UrlTabsContent>
    </UrlTabs>
  );
}

export default EquipmentTabs;
