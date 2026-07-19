import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { getSessionPermissions } from '@/shared/lib/permissions';
import { getCriticalAlerts } from '../actions.server';
import { CriticalAlertsPanelClient } from './CriticalAlertsPanelClient';

export default async function CriticalAlertsPanel() {
  const perms = await getSessionPermissions();
  if (!perms.has('documentacion.view')) return null;

  const alerts = await getCriticalAlerts();
  const nothing =
    alerts.documents.length === 0 &&
    alerts.equipmentOutOfService === 0 &&
    alerts.pendingRequests === 0;
  if (nothing) return null;

  return <CriticalAlertsPanelClient alerts={alerts} />;
}

export function CriticalAlertsSkeleton() {
  return (
    <Card className="border-l-4 border-l-red-500">
      <CardContent className="flex items-center gap-2 p-4">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="ml-auto h-5 w-24 rounded-full" />
      </CardContent>
    </Card>
  );
}
