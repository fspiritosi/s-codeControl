import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import type { ComposicionDetalle } from '@/modules/costos/shared/types/composicion.types';

export function ResumenPrecios({ detalle }: { detalle: ComposicionDetalle }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Precio del servicio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Valor mensual</p>
          <p className="text-3xl font-bold font-mono">{formatCurrencyARS(detalle.precio_mensual)}</p>
        </div>

        {detalle.outputs.length > 0 && (
          <div className="border-t pt-2 space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Valores derivados</p>
            {detalle.outputs.map((o) => (
              <div key={o.tipo_output_id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{o.nombre}</span>
                <span className="font-mono">{formatCurrencyARS(o.valor)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
