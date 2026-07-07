import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatCurrencyARS, formatPercentage } from '@/shared/lib/utils/formatters';
import type { ComposicionDetalle } from '@/modules/costos/shared/types/composicion.types';

export function ResumenMargenes({ detalle }: { detalle: ComposicionDetalle }) {
  const m = detalle.margenes;
  const filas = [
    { label: 'Débitos y créditos', margen: m.debcred },
    { label: 'Ingresos brutos', margen: m.iibb },
    { label: 'Estructura', margen: m.estructura },
    { label: 'Margen de ganancia', margen: m.ganancia },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Costo de la venta (márgenes)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {filas.map((f) => (
          <div key={f.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {f.label} <span className="text-xs">({formatPercentage(f.margen.pct)})</span>
            </span>
            <span className="font-mono">{formatCurrencyARS(f.margen.monto)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-1.5 mt-1.5 font-medium">
          <span>Total con márgenes</span>
          <span className="font-mono">{formatCurrencyARS(detalle.total_con_margenes)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Licencia comercial <span className="text-xs">({formatPercentage(detalle.licencia_ordenanza.pct)})</span>
          </span>
          <span className="font-mono">{formatCurrencyARS(detalle.licencia_ordenanza.monto)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
