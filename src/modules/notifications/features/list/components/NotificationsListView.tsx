'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, AlertTriangle, Bell, Clock, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import {
  dismiss,
  dismissAll,
  markAllAsRead,
  markAsRead,
} from '@/shared/actions/notifications';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  vencimiento: <Clock className="size-5 text-red-600" />,
  advertencia: <AlertTriangle className="size-5 text-amber-600" />,
  aprobado: <CheckCircle2 className="size-5 text-green-600" />,
  rechazado: <AlertTriangle className="size-5 text-red-600" />,
  noticia: <Mail className="size-5 text-blue-600" />,
};

interface Item {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  link: string | null;
  created_at: Date | null;
  read_at: Date | null;
}

interface Props {
  items: Item[];
  companyId?: string;
}

export function NotificationsListView({ items, companyId }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [, startTransition] = useTransition();

  const filtered = filter === 'unread' ? items.filter((i) => !i.read_at) : items;

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markAsRead(id);
      router.refresh();
    });
  };

  const handleDismiss = (id: string) => {
    startTransition(async () => {
      await dismiss(id);
      router.refresh();
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const r = await markAllAsRead(companyId);
      if (r.error) toast.error(r.error);
      else toast.success('Notificaciones marcadas como leídas');
      router.refresh();
    });
  };

  const handleDismissAll = () => {
    setConfirmClearOpen(false);
    startTransition(async () => {
      const r = await dismissAll(companyId);
      if (r.error) toast.error(r.error);
      else toast.success('Notificaciones limpiadas');
      router.refresh();
    });
  };

  const unreadCount = items.filter((i) => !i.read_at).length;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notificaciones</h2>
          <p className="text-sm text-muted-foreground">
            {items.length} en total · {unreadCount} sin leer
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            Marcar todas como leídas
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmClearOpen(true)}
            disabled={items.length === 0}
          >
            Limpiar todas
          </Button>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="unread">Sin leer ({unreadCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                {filter === 'unread' ? 'No tenés notificaciones sin leer.' : 'No hay notificaciones.'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((n) => {
                const isUnread = !n.read_at;
                const created = n.created_at ? new Date(n.created_at) : null;
                return (
                  <Card
                    key={n.id}
                    className={isUnread ? 'border-amber-300/50 bg-amber-50/40 dark:bg-amber-950/10' : ''}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="mt-1">
                            {CATEGORY_ICONS[n.category ?? ''] ?? <Bell className="size-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base flex items-center gap-2">
                              {n.title}
                              {isUnread && <Badge variant="secondary">nuevo</Badge>}
                            </CardTitle>
                            {n.description && (
                              <CardDescription className="mt-1">{n.description}</CardDescription>
                            )}
                          </div>
                        </div>
                        {created && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDistanceToNow(created, { addSuffix: true, locale: es })}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-end gap-2">
                        {n.link && (
                          <Button asChild size="sm" variant="outline" onClick={() => isUnread && handleMarkRead(n.id)}>
                            <Link href={n.link}>Ir</Link>
                          </Button>
                        )}
                        {isUnread && (
                          <Button size="sm" variant="ghost" onClick={() => handleMarkRead(n.id)}>
                            Marcar como leída
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDismiss(n.id)}>
                          Descartar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpiar notificaciones</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a descartar todas tus notificaciones de la empresa actual. No se pueden recuperar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDismissAll}>Limpiar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
