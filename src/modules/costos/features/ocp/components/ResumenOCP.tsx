import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { GRUPO_OCP_LABELS, type ResumenOCP as ResumenOCPType } from '@/modules/costos/shared/types/ocp.types';

export function ResumenOCP({ resumen }: { resumen: ResumenOCPType }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Resumen OCP (provisión mensual)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {resumen.por_grupo.map((g) => (
          <div key={g.grupo} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{GRUPO_OCP_LABELS[g.grupo] ?? g.grupo}</span>
            <span className="font-mono">{formatCurrencyARS(g.provision_mensual)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-1.5 mt-1.5 font-medium">
          <span>Total mensual</span>
          <span className="font-mono text-primary">{formatCurrencyARS(resumen.total_ocp)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
