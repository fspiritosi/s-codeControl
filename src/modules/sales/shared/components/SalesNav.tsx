'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';

const LINKS = [
  { href: '/dashboard/sales/invoices', label: 'Facturas' },
  { href: '/dashboard/sales/receipts', label: 'Recibos' },
  { href: '/dashboard/sales/account-statement', label: 'Cuenta corriente' },
  { href: '/dashboard/sales/points-of-sale', label: 'Puntos de venta' },
];

/** Sub-navegación del módulo de Ventas (se muestra en todas las páginas /dashboard/sales/*). */
export function SalesNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b">
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + '/');
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
