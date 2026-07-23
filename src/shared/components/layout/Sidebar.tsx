'use client';

import { useUnreadSupportTicketsCount } from '@/modules/ayuda/hooks/useUnreadSupportTicketsCount';
import { cn } from '@/shared/lib/utils';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { CardTitle } from '@/shared/components/ui/card';
import { CompanySwitcher } from '@/shared/components/layout/CompanySwitcher';

// Link individual (hoja). Puede ser un item plano o un subitem indentado.
function LeafLink({
  link,
  active,
  isCollapsed,
  indented,
  ayudaUnreadCount,
}: {
  link: any;
  active: boolean;
  isCollapsed: boolean;
  indented?: boolean;
  ayudaUnreadCount: number;
}) {
  const showUnread = link.href === '/dashboard/help' && ayudaUnreadCount > 0;
  return (
    <Link
      key={link.name}
      href={link.href}
      // Sin prefetch en viewport: las rutas del sidebar son dinámicas y cada
      // prefetch dispara un render RSC completo en el server. Next igual prefetchea
      // al hacer hover, así que la navegación sigue siendo instantánea.
      prefetch={false}
      className={cn(
        'flex items-center p-4 cursor-pointer transition-all duration-500 rounded-s-full lisidebar relative',
        active
          ? 'bg-muted activesidebar before:shadow-custom-white after:shadow-custom-white-inverted'
          : 'hover:bg-muted/80',
        isCollapsed ? 'ml-0' : indented ? 'ml-8' : 'ml-4'
      )}
    >
      <div className={cn('flex items-center overflow-hidden min-w-0', active ? 'text-primary' : 'text-foreground')}>
        <span className="relative shrink-0">
          {link.icon}
          {showUnread && (
            <span aria-hidden className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </span>
        <span className="ml-3 relative block text-sm truncate">{link.name}</span>
      </div>
      {showUnread &&
        (isCollapsed ? (
          <span className="sr-only">{ayudaUnreadCount} tickets sin leer</span>
        ) : (
          <Badge variant="destructive" className="ml-auto min-w-5 shrink-0 justify-center px-1.5 py-0">
            {ayudaUnreadCount}
            <span className="sr-only"> tickets sin leer</span>
          </Badge>
        ))}
    </Link>
  );
}

// Grupo colapsable: parent con subitems anidados.
function CollapsibleGroup({
  link,
  activeLink,
  isCollapsed,
  ayudaUnreadCount,
}: {
  link: any;
  activeLink: string | null;
  isCollapsed: boolean;
  ayudaUnreadCount: number;
}) {
  const children: any[] = link.children ?? [];
  const someChildActive = children.some((c) => c.name === activeLink);
  const parentActive = link.name === activeLink || someChildActive;
  const [open, setOpen] = useState(someChildActive);

  // Colapsado (o sin children visibles): mostrar solo el parent como link a su href.
  if (isCollapsed || children.length === 0) {
    return <LeafLink link={link} active={parentActive} isCollapsed={isCollapsed} ayudaUnreadCount={ayudaUnreadCount} />;
  }

  return (
    <li className="list-none">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center p-4 cursor-pointer transition-all duration-500 rounded-s-full lisidebar relative ml-4',
          parentActive
            ? 'bg-muted activesidebar before:shadow-custom-white after:shadow-custom-white-inverted'
            : 'hover:bg-muted/80'
        )}
      >
        <div className={cn('flex items-center overflow-hidden min-w-0', parentActive ? 'text-primary' : 'text-foreground')}>
          <span className="relative shrink-0">{link.icon}</span>
          <span className="ml-3 relative block text-sm truncate">{link.name}</span>
        </div>
        <span className="ml-auto shrink-0 text-muted-foreground">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>
      {open && (
        <ul className="mt-1">
          {children.map((child) => (
            <LeafLink
              key={child.name}
              link={child}
              active={child.name === activeLink}
              isCollapsed={false}
              indented
              ayudaUnreadCount={ayudaUnreadCount}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function SideBar({ Allinks, role }: { Allinks: any; role: string }) {
  const isAuditor = role === 'Auditor';
  if (isAuditor) return null;

  const isActive = useLoggedUserStore((state) => state.active_sidebar);
  const pathName = usePathname();
  const ayudaUnreadCount = useUnreadSupportTicketsCount();

  // Solo las hojas participan del match por href: las secciones no tienen ruta
  // propia (su href = 1er hijo) y robarían el estado activo al hijo real.
  const flatLinks = Allinks.flatMap((link: any) =>
    link.children && link.children.length > 0 ? link.children : [link]
  );

  // Find the most specific matching link for active state
  const activeLink = flatLinks.reduce(
    (best: any, link: any) => {
      if (link.href === '/dashboard') {
        // Dashboard only matches exact path
        const isExact = pathName === '/dashboard' || pathName === '/dashboard/';
        return isExact && 0 > best.matchLength ? { name: link.name, matchLength: 1 } : best;
      }
      if (pathName.startsWith(link.href)) {
        const len = link.href.length;
        return len > best.matchLength ? { name: link.name, matchLength: len } : best;
      }
      return best;
    },
    { name: null, matchLength: 0 }
  )?.name;

  return (
    <div
      key={role}
      className={`relative top-0 left-0 flex flex-col bg-white dark:bg-muted/50 border-r border-border/50 transition-width duration-500 ease-out ${isActive ? 'w-16' : 'w-56'} sticky top-0 h-screen`}
    >
      <div className="pt-3 pb-2">
        <CompanySwitcher collapsed={isActive} />
      </div>

      <ul className="flex-1 overflow-y-auto mt-2">
        {Allinks.map((link: any) =>
          link.children && link.children.length > 0 ? (
            <CollapsibleGroup
              key={link.name}
              link={link}
              activeLink={activeLink}
              isCollapsed={isActive}
              ayudaUnreadCount={ayudaUnreadCount}
            />
          ) : (
            <LeafLink
              key={link.name}
              link={link}
              active={link.name === activeLink}
              isCollapsed={isActive}
              ayudaUnreadCount={ayudaUnreadCount}
            />
          )
        )}
      </ul>

      <div className={cn('flex items-center p-3 border-t', isActive ? 'justify-center' : 'justify-center gap-2')}>
        <img src="/logo-azul.png" alt="codeControl logo" className="size-8" />
        {!isActive && <CardTitle className="text-foreground text-sm">CodeControl</CardTitle>}
      </div>
    </div>
  );
}
