import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { unreadNotificationsCountForCurrentUser } from '@/shared/services/notifications';
import { getSession } from '@/shared/lib/session';

/**
 * Banner discreto que aparece cuando hay notificaciones sin leer del usuario
 * en la empresa activa. Server component: cuenta vive del lado server, no
 * agrega tráfico al cliente.
 */
export default async function NotificationsAlert() {
  const session = await getSession();
  if (!session.user || !session.company) return null;

  const count = await unreadNotificationsCountForCurrentUser(session.company.id);
  if (count === 0) return null;

  return (
    <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
      <CardContent className="flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-5 text-amber-600 shrink-0" />
          <p className="text-sm">
            Tenés <strong>{count}</strong> notificación{count === 1 ? '' : 'es'} sin leer.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/notifications">Ver todas</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
