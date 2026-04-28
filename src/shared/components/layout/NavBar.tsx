'use client';
import { ModeToggle } from '@/shared/components/ui/ToogleDarkButton';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { startNotificationPolling, stopNotificationPolling } from '@/shared/store/uiStore';
import { useEffect } from 'react';
import {
  BellIcon,
  CheckCircledIcon,
  DotFilledIcon,
  EnvelopeOpenIcon,
  ExclamationTriangleIcon,
  HamburgerMenuIcon,
  LapTimerIcon,
} from '@radix-ui/react-icons';
import { formatRelative } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { DashboardBreadcrumbs } from './DashboardBreadcrumbs';
import { NavUser } from './NavUser';

function capitalizeWords(text: string | undefined) {
  if (!text) return '(no disponible)';
  return text
    .split(' ')
    .map((w) => w.charAt(0)?.toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function NotificationMessage({ notification }: { notification: any }) {
  const docName = notification?.document?.documentName || '(no disponible)';
  const resource = capitalizeWords(notification?.document?.resource);
  const isEmployee = notification.reference === 'employee';
  const resourceLabel = isEmployee ? 'empleado' : 'vehiculo con patente';

  const messages: Record<string, string> = {
    aprobado: `El documento ${docName}, del ${resourceLabel} ${resource} ha sido aprobado`,
    rechazado: `El documento ${docName}, del ${resourceLabel} ${resource} ha sido rechazado`,
    vencimiento: `El documento ${docName}, del ${resourceLabel} ${resource} ha vencido`,
  };

  return (
    <p className="text-sm font-medium leading-none first-letter:uppercase">
      {messages[notification?.category] || notification?.description}
    </p>
  );
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  rechazado: <ExclamationTriangleIcon className="text-yellow-800" />,
  aprobado: <CheckCircledIcon className="text-green-800" />,
  vencimiento: <LapTimerIcon className="text-red-800" />,
  noticia: <EnvelopeOpenIcon className="text-blue-800" />,
  advertencia: <ExclamationTriangleIcon className="text-yellow-800" />,
};

export default function NavBar() {
  const actualUser = useLoggedUserStore((state) => state.profile);
  const notifications = useLoggedUserStore((state) => state.notifications);
  const markAllAsRead = useLoggedUserStore((state) => state.markAllAsRead);

  useEffect(() => {
    startNotificationPolling();
    return () => stopNotificationPolling();
  }, []);

  const handleCloseSidebar = () => {
    useLoggedUserStore.getState().toggleSidebar();
  };

  const isAdmin =
    actualUser?.[0]?.role === 'Admin' ||
    actualUser?.[0]?.role === 'Super Admin' ||
    actualUser?.[0]?.role === 'Developer';

  return (
    <nav className="flex flex-shrink items-center justify-end sm:justify-between pr-4 py-4 ">
      <div className="items-center hidden sm:flex gap-6">
        <button onClick={handleCloseSidebar} className="relative w-fit ml-7" aria-label="Abrir/cerrar menú lateral">
          <HamburgerMenuIcon className="size-7 text-foreground" />
        </button>
        <DashboardBreadcrumbs />
      </div>
      <div className="flex gap-4 items-center">
        {isAdmin && (
          <Link href="/admin/panel">
            <Button variant="default">Panel</Button>
          </Link>
        )}

        {/* Notificaciones */}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Notificaciones">
            <div className="relative">
              {notifications?.length > 0 && (
                <DotFilledIcon className="text-blue-600 absolute size-7 top-[-8px] right-[-10px] p-0" />
              )}
              <BellIcon className="text-foreground cursor-pointer size-5" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-[400px] bg-transparent border-none shadow-none">
            <Card className="w-[600px]">
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                {notifications?.length > 0 && (
                  <CardDescription>Tienes {notifications.length} notificaciones pendientes</CardDescription>
                )}
                <DropdownMenuSeparator className="mb-3" />
              </CardHeader>
              <CardContent className="grid gap-6 max-h-[40vh] overflow-auto">
                {notifications?.length > 0 ? (
                  <div>
                    {notifications.map((notification: any) => (
                      <div
                        key={notification.id}
                        className="mb-4 grid grid-cols-[25px_1fr] pb-4 last:mb-0 last:pb-0 items-center gap-2"
                      >
                        {CATEGORY_ICONS[notification?.category]}
                        <div className="space-y-1 flex justify-between items-center gap-2">
                          <div>
                            <NotificationMessage notification={notification} />
                            <CardDescription>
                              {notification?.description?.length > 50
                                ? notification.description.substring(0, 50) + '...'
                                : notification?.description}
                            </CardDescription>
                            <p className="text-sm text-muted-foreground/70">
                              {notification?.created_at &&
                                formatRelative(new Date(notification.created_at), new Date(), { locale: es })}
                            </p>
                          </div>
                          <Link
                            className={[buttonVariants({ variant: 'outline' }), 'w-20'].join(' ')}
                            href={`/dashboard/document/${notification?.document?.id}?resource=${notification?.reference === 'employee' ? 'Persona' : 'Equipos'}`}
                          >
                            Ver
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <CardDescription>No tienes notificaciones pendientes</CardDescription>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={() => markAllAsRead()} className="w-full">
                  <Check className="mr-2 h-4 w-4" /> Marcar todos como leido
                </Button>
              </CardFooter>
            </Card>
          </DropdownMenuContent>
        </DropdownMenu>

        <ModeToggle />
        <NavUser />
      </div>
    </nav>
  );
}
