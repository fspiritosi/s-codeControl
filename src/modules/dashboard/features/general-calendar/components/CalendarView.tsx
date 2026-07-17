import { getSessionPermissions } from '@/shared/lib/permissions';
import { getExpirationEvents } from '../actions.server';
import { GeneralCalendarClient } from './GeneralCalendarClient';

export async function CalendarView() {
  const perms = await getSessionPermissions();
  if (!perms.has('documentacion.view')) {
    return (
      <section className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No tenés permisos para ver el calendario de vencimientos.
      </section>
    );
  }

  const events = await getExpirationEvents();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Calendario de vencimientos</h2>
        <p className="text-sm text-muted-foreground">
          Vencimientos de documentación (empleados y equipos) y mantenimientos programados.
        </p>
      </div>
      <GeneralCalendarClient events={events} />
    </div>
  );
}
