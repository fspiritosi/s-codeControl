import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { ExternalLink } from 'lucide-react';

interface Props {
  tipo: { id: string; nombre: string };
  accesorios_total: number;
  mantenimiento_mensual: number;
  items_tipo_count: number;
}

/** Los accesorios y el mantenimiento se editan a nivel tipo, no por unidad. */
export function ItemsHeredadosDelTipo({
  tipo,
  accesorios_total,
  mantenimiento_mensual,
  items_tipo_count,
}: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">
            Accesorios y mantenimiento del tipo «{tipo.nombre}»
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {items_tipo_count === 0
              ? 'Este tipo todavía no tiene ítems cargados.'
              : `${items_tipo_count} ${items_tipo_count === 1 ? 'ítem' : 'ítems'} compartidos por todas las unidades de este tipo.`}
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href={`/dashboard/costos/tipos-equipo/${tipo.id}`}>
            <ExternalLink className="h-3.5 w-3.5" /> Editar en tipos de equipo
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Accesorios (a la base amortizable)</p>
          <p className="text-lg font-mono">{formatCurrencyARS(accesorios_total)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Mantenimiento mensual</p>
          <p className="text-lg font-mono">{formatCurrencyARS(mantenimiento_mensual)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
