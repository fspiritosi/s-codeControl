import { CalendarView } from '@/modules/dashboard/features/general-calendar';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Suspense } from 'react';

export default function CalendarioPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[520px] w-full rounded-lg" />}>
      <CalendarView />
    </Suspense>
  );
}
