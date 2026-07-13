import {
  VtvCalendarSkeleton,
  VtvView,
} from '@/modules/dashboard/features/vtv-calendar';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'VTV | CodeControl',
  description: 'Vencimientos y turnos de VTV de la flota',
};

export default async function VtvPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  return (
    <Suspense fallback={<VtvCalendarSkeleton />}>
      <VtvView tab={tab} />
    </Suspense>
  );
}
