import { CardContent } from '@/shared/components/ui/card';
import { UrlTabs, UrlTabsContent, UrlTabsList, UrlTabsTrigger } from '@/shared/components/ui/url-tabs';
import { EmployeeDocumentList } from './EmployeeDocumentList';
import type { DataTableSearchParams } from '@/shared/components/data-table';

const VALID_SUBTABS = ['permanentes', 'mensuales', 'baja'] as const;
type SubTab = (typeof VALID_SUBTABS)[number];

/**
 * Sub-tabs de documentos de empleado por URL (paramName="subtab").
 * Solo se renderiza en el servidor el sub-tab activo, en vez de las 3 tablas a la vez:
 * evita 2 fetches extra y ~3x el payload RSC por carga (impacto grande con datos reales).
 */
async function EmployeeDocumentsTabs({
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
          <UrlTabsTrigger value="baja">Documentos de baja</UrlTabsTrigger>
        </UrlTabsList>
      </CardContent>
      <UrlTabsContent value="permanentes">
        {currentSub === 'permanentes' && <EmployeeDocumentList searchParams={searchParams} />}
      </UrlTabsContent>
      <UrlTabsContent value="mensuales">
        {currentSub === 'mensuales' && <EmployeeDocumentList searchParams={searchParams} monthly />}
      </UrlTabsContent>
      <UrlTabsContent value="baja">
        {currentSub === 'baja' && <EmployeeDocumentList searchParams={searchParams} downDocument />}
      </UrlTabsContent>
    </UrlTabs>
  );
}

export default EmployeeDocumentsTabs;
