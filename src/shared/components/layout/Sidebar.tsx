'use client';

import { cn } from '@/shared/lib/utils';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CardTitle } from '@/shared/components/ui/card';
import { CompanySwitcher } from '@/shared/components/layout/CompanySwitcher';

export default function SideBar({ Allinks, role }: { Allinks: any; role: string }) {
  const isAuditor = role === 'Auditor';
  if (isAuditor) return null;

  const isActive = useLoggedUserStore((state) => state.active_sidebar);
  const pathName = usePathname();

  // Find the most specific matching link for active state
  const activeLink = Allinks.reduce(
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
        {Allinks.map((link: any) => (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              'flex items-center p-4 cursor-pointer transition-all duration-500 rounded-s-full lisidebar relative',
              link.name === activeLink
                ? 'bg-muted activesidebar before:shadow-custom-white after:shadow-custom-white-inverted'
                : 'hover:bg-muted/80',
              isActive ? 'ml-0' : 'ml-4'
            )}
          >
            <div className={cn('flex items-center overflow-hidden', link.name === activeLink ? 'text-primary' : 'text-foreground')}>
              <span className="relative">{link.icon}</span>
              <span className="ml-6 relative block">{link.name}</span>
            </div>
          </Link>
        ))}
      </ul>

      <div className={cn('flex items-center p-3 border-t', isActive ? 'justify-center' : 'justify-center gap-2')}>
        <img src="/logo-azul.png" alt="codeControl logo" className="size-8" />
        {!isActive && <CardTitle className="text-foreground text-sm">CodeControl</CardTitle>}
      </div>
    </div>
  );
}
