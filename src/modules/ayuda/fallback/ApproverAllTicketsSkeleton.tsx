import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

/**
 * Mismas dimensiones que ApproverAllTickets: card con header (título +
 * descripción) y filas de la misma altura que las reales (dos líneas + badges).
 */
export function ApproverAllTicketsSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <Skeleton className="mt-1.5 h-4 w-96 max-w-full" />
      </CardHeader>
      <CardContent className="divide-y p-0">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-3 w-2/5" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
