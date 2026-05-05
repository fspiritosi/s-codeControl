'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BellIcon } from '@radix-ui/react-icons';
import { CheckCircle2, AlertTriangle, Bell, Clock, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  dismiss,
  getMyNotifications,
  getMyUnreadCount,
  markAllAsRead,
  markAsRead,
} from '@/shared/actions/notifications';
import { useCompanyStore } from '@/shared/store/companyStore';

const POLL_INTERVAL_MS = 60_000;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  vencimiento: <Clock className="size-4 text-red-600" />,
  advertencia: <AlertTriangle className="size-4 text-amber-600" />,
  aprobado: <CheckCircle2 className="size-4 text-green-600" />,
  rechazado: <AlertTriangle className="size-4 text-red-600" />,
  noticia: <Mail className="size-4 text-blue-600" />,
};

interface NotificationItem {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  link: string | null;
  created_at: Date | null;
  read_at: Date | null;
}

export function NotificationBell() {
  const router = useRouter();
  const companyId = useCompanyStore((s) => s.actualCompany?.id);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    if (!companyId) return;
    const [list, count] = await Promise.all([
      getMyNotifications(companyId, false),
      getMyUnreadCount(companyId),
    ]);
    setItems(list as NotificationItem[]);
    setUnread(count);
  }, [companyId]);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void refresh();
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read_at) {
      startTransition(async () => {
        await markAsRead(n.id);
        void refresh();
      });
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await dismiss(id);
      void refresh();
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllAsRead(companyId);
      void refresh();
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger aria-label="Notificaciones" className="relative">
        <BellIcon className="text-foreground cursor-pointer size-5" />
        {unread > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-3 size-5 p-0 flex items-center justify-center text-[10px]"
          >
            {unread > 99 ? '99+' : unread}
          </Badge>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[420px] p-0 border-none shadow-none bg-transparent">
        <Card className="w-[420px]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notificaciones</CardTitle>
              {unread > 0 && (
                <Badge variant="secondary">{unread} sin leer</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="max-h-[60vh]">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No tenés notificaciones.
                </div>
              ) : (
                <ul className="divide-y">
                  {items.map((n) => {
                    const isUnread = !n.read_at;
                    const created = n.created_at ? new Date(n.created_at) : null;
                    return (
                      <li
                        key={n.id}
                        onClick={() => handleItemClick(n)}
                        className={`px-4 py-3 cursor-pointer hover:bg-muted/50 ${
                          isUnread ? 'bg-muted/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {CATEGORY_ICONS[n.category ?? ''] ?? <Bell className="size-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${isUnread ? 'font-medium' : ''}`}>
                                {n.title}
                              </p>
                              <button
                                onClick={(e) => handleDismiss(n.id, e)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                                aria-label="Descartar"
                              >
                                ✕
                              </button>
                            </div>
                            {n.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {n.description}
                              </p>
                            )}
                            {created && (
                              <p className="text-[11px] text-muted-foreground/70 mt-1">
                                {formatDistanceToNow(created, { addSuffix: true, locale: es })}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>
          </CardContent>

          <CardFooter className="flex gap-2 p-3 border-t">
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={unread === 0} className="flex-1">
              Marcar todas como leídas
            </Button>
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-sm text-primary hover:underline"
            >
              Ver todas
            </Link>
          </CardFooter>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
