'use client';
import { ModeToggle } from '@/shared/components/ui/ToogleDarkButton';
import { Button } from '@/shared/components/ui/button';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { DashboardBreadcrumbs } from './DashboardBreadcrumbs';
import { NavUser } from './NavUser';
import { NotificationBell } from './NotificationBell';

export default function NavBar() {
  const actualUser = useLoggedUserStore((state) => state.profile);

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

        <NotificationBell />

        <ModeToggle />
        <NavUser />
      </div>
    </nav>
  );
}
