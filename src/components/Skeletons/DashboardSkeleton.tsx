import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export default function DashboardSkeleton() {
  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-1/3 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4 mt-2" />
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <div className="relative w-48 h-48">
              <Skeleton className="absolute inset-0 rounded-full" />
              <div className="absolute inset-4 flex items-center justify-center">
                <Skeleton className="h-12 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-8 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-8 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-2/3 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-3 w-2/3 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
              <div className="hidden sm:grid grid-cols-4 gap-4">
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Skeleton className="h-4" />
                  <Skeleton className="h-4" />
                  <Skeleton className="h-4 hidden sm:block" />
                  <Skeleton className="h-4 hidden sm:block" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
