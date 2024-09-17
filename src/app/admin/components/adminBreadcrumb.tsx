'use client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';

import { usePathname } from 'next/navigation';

export default function AdminBreadcrumb() {
  const path = usePathname();
  const cortePath = path.split('/');
  const pasos = cortePath.slice(2);

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        {pasos.map((paso, index) => (
          <BreadcrumbItem key={crypto.randomUUID()}>
            <BreadcrumbLink asChild>
              <Link href={`/admin/${paso}`}>{paso}</Link>
            </BreadcrumbLink>
            {pasos.length - 1 === index ? null : <BreadcrumbSeparator />}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
