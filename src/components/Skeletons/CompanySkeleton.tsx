import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '../ui/card';

export default function CompanySkeleton() {
  return (
    <Card className="mx-6 p-4 space-y-6 max-h-full overflow-hidden">
      <nav className="flex flex-wrap gap-2 pb-2 border-b">
        {[
          'General',
          'Documentacion',
          'Usuarios',
          'Clientes',
          'Contactos',
          'Convenios colectivos de trabajo',
          'Servicios',
        ].map((item, index) => (
          <Skeleton key={crypto.randomUUID()} className="h-8 w-24 md:w-32" />
        ))}
      </nav>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64 sm:w-80" />
            <Skeleton className="h-4 w-48 sm:w-60" />
          </div>
          <Button variant="outline" className="h-9 px-4" disabled>
            Editar Compañía
          </Button>
        </div>

        {[
          'Razón Social',
          'CUIT',
          'Dirección',
          'País',
          'Ciudad',
          'Industria',
          'Teléfono de contacto',
          'Email de contacto',
        ].map((field, index) => (
          <div key={crypto.randomUUID()} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-full sm:w-3/4" />
          </div>
        ))}

        <div className="mt-8 p-4 bg-red-100 rounded-lg space-y-2">
          <Skeleton className="h-6 w-40 bg-red-200" />
          <Skeleton className="h-4 w-full sm:w-3/4 bg-red-200" />
        </div>
      </div>
    </Card>
  );
}
