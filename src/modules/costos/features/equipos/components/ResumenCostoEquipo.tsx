import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';

interface Props {
  amortizacion_mensual: number;
  mantenimiento_mensual: number;
  costo_mensual: number;
}

/** Card resumen con amortización + mantenimiento + costo mensual total del equipo. */
export function ResumenCostoEquipo({ amortizacion_mensual, mantenimiento_mensual, costo_mensual }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Amortización mensual</CardDescription>
          <CardTitle className="text-xl">{formatCurrencyARS(amortizacion_mensual)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Mantenimiento mensual</CardDescription>
          <CardTitle className="text-xl">{formatCurrencyARS(mantenimiento_mensual)}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-primary/40">
        <CardHeader className="pb-2">
          <CardDescription>Costo mensual total</CardDescription>
          <CardTitle className="text-xl text-primary">{formatCurrencyARS(costo_mensual)}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">Afectación 100%</p>
        </CardContent>
      </Card>
    </div>
  );
}
