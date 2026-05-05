import { NotificationsListView } from '@/modules/notifications/features/list/components/NotificationsListView';
import { listNotificationsForCurrentUser } from '@/shared/services/notifications';
import { getSession } from '@/shared/lib/session';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const session = await getSession();
  const companyId = session.company?.id;
  const items = await listNotificationsForCurrentUser({ companyId, limit: 200 });

  // Serialize Date instances para pasar al client.
  const safeItems = items.map((i) => ({
    ...i,
    created_at: i.created_at ?? null,
    read_at: i.read_at ?? null,
    dismissed_at: i.dismissed_at ?? null,
  }));

  return <NotificationsListView items={safeItems} companyId={companyId} />;
}
