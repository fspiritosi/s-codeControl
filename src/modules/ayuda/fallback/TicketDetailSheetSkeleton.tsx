import { Skeleton } from '@/shared/components/ui/skeleton';

export function TicketDetailSheetSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
