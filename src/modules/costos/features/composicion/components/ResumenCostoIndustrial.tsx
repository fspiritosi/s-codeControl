import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import type { ComposicionDetalle } from '@/modules/costos/shared/types/composicion.types';

const FILAS = [
  { key: 'mod', label: 'Mano de obra directa' },
  { key: 'ocp', label: 'Otros costos de personal' },
  { key: 'equipos', label: 'Equipos' },
  { key: 'combustible', label: 'Combustible' },
] as const;

export function ResumenCostoIndustrial({ detalle }: { detalle: ComposicionDetalle }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Costo industrial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {FILAS.map((f) => (
          <div key={f.key} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{f.label}</span>
            <span className="font-mono">{formatCurrencyARS(detalle.subtotales[f.key])}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-1.5 mt-1.5 font-medium">
          <span>Total costo directo</span>
          <span className="font-mono text-primary">{formatCurrencyARS(detalle.total_costo_directo)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
