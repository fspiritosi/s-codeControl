'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb';
import { Fragment } from 'react';

const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  company: 'Empresa',
  employee: 'Empleados',
  equipment: 'Equipos',
  document: 'Documentación',
  products: 'Productos',
  operations: 'Operaciones',
  maintenance: 'Mantenimiento',
  forms: 'Formularios',
  hse: 'HSE',
  help: 'Ayuda',
  new: 'Nuevo',
  action: 'Acción',
  actualCompany: 'Detalle',
};

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = '/' + segments.slice(0, index + 1).join('/');
          const label = labelMap[segment] ?? decodeURIComponent(segment);
          const isLast = index === segments.length - 1;

          return (
            <Fragment key={href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
