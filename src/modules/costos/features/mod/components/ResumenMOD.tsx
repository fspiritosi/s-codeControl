import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import type { ResumenMOD as ResumenMODType } from '@/modules/costos/shared/types/mod.types';

export function ResumenMOD({ resumen }: { resumen: ResumenMODType }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Resumen MOD ({resumen.periodo})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {resumen.por_chofer.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin asignaciones activas.</p>
        ) : (
          resumen.por_chofer.map((c) => (
            <div key={c.asignacion_id} className="text-sm border-b pb-1.5 last:border-0">
              <div className="flex justify-between">
                <span className="truncate">{c.employee_nombre}</span>
                <span className="font-mono">{formatCurrencyARS(c.total_chofer)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {c.categoria_codigo} · {Math.round(c.afectacion_pct * 100)}% · bruto {formatCurrencyARS(c.bruto_chofer)}
              </div>
            </div>
          ))
        )}
        <div className="flex justify-between border-t pt-1.5 font-medium">
          <span>Total MOD</span>
          <span className="font-mono text-primary">{formatCurrencyARS(resumen.total_mod)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
