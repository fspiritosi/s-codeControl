import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { formatPeriodoLabel } from '@/modules/costos/shared/utils/periodo';
import type { PeriodoConValores } from '@/modules/costos/shared/types/formula-polinomica.types';

export function ResumenRetroactivos({ periodos }: { periodos: PeriodoConValores[] }) {
  // Retroactivo del período = valor_ajustado − certificado (cuando certificado < ajustado).
  const pendientes = periodos
    .filter((p) => p.importe_certificado != null && p.valor_ajustado - (p.importe_certificado ?? 0) > 0.01)
    .map((p) => ({ periodo: p.periodo, monto: p.valor_ajustado - (p.importe_certificado ?? 0) }));

  const total = pendientes.reduce((s, p) => s + p.monto, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Retroactivos pendientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {pendientes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Sin retroactivos pendientes.</p>
        ) : (
          <>
            {pendientes.map((p) => (
              <div key={p.periodo} className="flex justify-between text-sm">
                <span className="text-muted-foreground capitalize">{formatPeriodoLabel(p.periodo)}</span>
                <span className="font-mono">{formatCurrencyARS(p.monto)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-1.5 mt-1.5 font-medium">
              <span>Total</span>
              <span className="font-mono text-primary">{formatCurrencyARS(total)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
