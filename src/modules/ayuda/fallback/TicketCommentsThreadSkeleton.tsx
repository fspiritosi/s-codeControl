import { Skeleton } from '@/shared/components/ui/skeleton';

export function TicketCommentsThreadSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`flex gap-2 ${i % 2 === 1 ? 'justify-end' : ''}`}>
          {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
          <Skeleton className="h-16 w-2/3 rounded-md" />
          {i % 2 === 1 && <Skeleton className="h-8 w-8 rounded-full" />}
        </div>
      ))}
    </div>
  );
}
