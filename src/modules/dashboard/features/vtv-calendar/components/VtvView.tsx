import {
  UrlTabs,
  UrlTabsContent,
  UrlTabsList,
  UrlTabsTrigger,
} from '@/shared/components/ui/url-tabs';
import { getSessionPermissions } from '@/shared/lib/permissions';
import {
  ensureVtvAppointments,
  getVehiclesWithVtv,
  getVtvAppointments,
  getVtvList,
  getVtvMetrics,
} from '../actions.server';
import { VtvCalendarClient } from './VtvCalendarClient';
import { VtvListClient } from './VtvListClient';
import { VtvMetricsCards } from './VtvMetricsCards';

interface Props {
  tab?: string;
}

const VALID_TABS = ['listado', 'calendario'] as const;
type VtvTab = (typeof VALID_TABS)[number];

export async function VtvView({ tab }: Props) {
  const perms = await getSessionPermissions();

  if (!perms.has('equipos.view')) {
    return (
      <section className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No tenés permisos para ver el calendario de VTV. Si creés que necesitás
        acceso, solicitalo a tu administrador.
      </section>
    );
  }

  const currentTab: VtvTab = VALID_TABS.includes(tab as VtvTab)
    ? (tab as VtvTab)
    : 'listado';

  // Autogenera los turnos faltantes de VTV por vencer antes de leer.
  await ensureVtvAppointments();

  const [metrics, list, appointments, vehicles] = await Promise.all([
    getVtvMetrics(),
    getVtvList(),
    getVtvAppointments(),
    getVehiclesWithVtv(),
  ]);

  return (
    <section className="min-w-0 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">VTV de la flota</h2>
        <p className="text-sm text-muted-foreground">
          Vencimientos y turnos de la Verificación Técnica Vehicular de tu flota.
        </p>
      </div>

      <VtvMetricsCards metrics={metrics} />

      <UrlTabs value={currentTab} paramName="tab" baseUrl="/dashboard/vtv">
        <UrlTabsList>
          <UrlTabsTrigger value="listado">Listado</UrlTabsTrigger>
          <UrlTabsTrigger value="calendario">Calendario</UrlTabsTrigger>
        </UrlTabsList>

        <UrlTabsContent value="listado">
          <VtvListClient items={list} vehicles={vehicles} />
        </UrlTabsContent>

        <UrlTabsContent value="calendario">
          <VtvCalendarClient items={appointments} />
        </UrlTabsContent>
      </UrlTabs>
    </section>
  );
}
