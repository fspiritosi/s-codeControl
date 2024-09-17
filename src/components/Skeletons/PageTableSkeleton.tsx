import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '../ui/card';

export default function PageTableSkeleton() {
  return (
    <div className='mx-7'>

    <Card className="w-full p-4 sm:p-6 space-y-4 sm:space-y-6 px-7">
      <div className="space-y-2">
        <Skeleton className="h-6 sm:h-8 w-3/4 sm:w-1/2 md:w-1/3" />
        <Skeleton className="h-4 w-full sm:w-3/4 md:w-1/2" />
      </div>
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <Skeleton className="h-10 w-full sm:w-auto sm:flex-1" />
        <Skeleton className="h-10 w-full sm:w-auto sm:flex-1" />
        <Skeleton className="h-10 w-full sm:w-auto sm:flex-1" />
        <Skeleton className="h-10 w-full sm:w-auto sm:flex-1" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/2 sm:w-1/4" />
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Skeleton className="h-10 w-full sm:w-1/3 md:w-1/6" />
          <Skeleton className="h-10 w-full sm:w-1/3 md:w-1/6" />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <Skeleton className="h-10 w-full sm:w-1/3" />
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-24" />
          <Skeleton className="h-10 w-full sm:w-24" />
          <Skeleton className="h-10 w-full sm:w-24" />
          <Skeleton className="h-10 w-full sm:w-32" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Skeleton className="h-6" />
          <Skeleton className="h-6" />
          <Skeleton className="h-6 hidden md:block" />
          <Skeleton className="h-6 hidden md:block" />
          <Skeleton className="h-6 hidden lg:block" />
          <Skeleton className="h-6 hidden lg:block" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6 hidden md:block" />
            <Skeleton className="h-6 hidden md:block" />
            <Skeleton className="h-6 hidden lg:block" />
            <Skeleton className="h-8 col-span-2 sm:col-span-1" />
          </div>
        ))}
      </div>
    </Card>
    </div>

  );
}
