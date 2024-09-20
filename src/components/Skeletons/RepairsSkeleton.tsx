import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '../ui/card';

export default function RepairsSkeleton() {
  return (
    <div className="pb-4 h-full">
      <Card className="p-4 space-y-6  mx-7 h-full">
        <Skeleton className="h-8 w-64 mb-4" />

        <div className="space-y-2">
          <Skeleton className="h-8 w-72 sm:w-96" />
          <Skeleton className="h-4 w-full sm:w-3/4 max-w-2xl" />
        </div>

        <div className="flex flex-wrap gap-2 border-b pb-2">
          <Skeleton className="h-10 w-32 sm:w-40" />
          <Skeleton className="h-10 w-32 sm:w-40" />
          <Skeleton className="h-10 w-32 sm:w-40" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Input className="w-full sm:w-64" placeholder="Buscar tarea por título..." disabled />
          <div className="flex gap-2">
            <Button variant="outline" className="h-10" disabled>
              Estado
            </Button>
            <Button variant="outline" className="h-10" disabled>
              Criticidad
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Título</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Criticidad</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={crypto.randomUUID()}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-9 w-28 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
