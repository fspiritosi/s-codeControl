import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

/**
 * Mismas dimensiones que ApproverInbox (card con borde amarillo, header con
 * título+descripción y una fila con meta + botones de acción).
 */
export function ApproverInboxSkeleton() {
  return (
    <Card className="overflow-hidden border-l-4 border-l-yellow-500/40">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <Skeleton className="mt-1.5 h-4 w-80 max-w-full" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
