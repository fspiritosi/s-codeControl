'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ConfigFormulaPolinomica } from './ConfigFormulaPolinomica';
import { TablaComponentes } from './TablaComponentes';
import { TablaIndicesMensuales } from './TablaIndicesMensuales';
import { GraficoEvolucionTarifa } from './GraficoEvolucionTarifa';
import { ResumenRetroactivos } from './ResumenRetroactivos';
import { BotonInicializarPonderaciones } from './BotonInicializarPonderaciones';
import type { FormulaConDetalle, PeriodoConValores } from '@/modules/costos/shared/types/formula-polinomica.types';

interface Props {
  servicioId: string;
  detalle: FormulaConDetalle | null;
  periodos: PeriodoConValores[];
}

export function PantallaFormula({ servicioId, detalle, periodos }: Props) {
  if (!detalle) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sin fórmula configurada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este servicio todavía no tiene fórmula polinómica. Inicializala tomando las ponderaciones de la
            composición más reciente (MOD, equipos, combustible y otros costos sobre el costo directo).
          </p>
          <BotonInicializarPonderaciones servicioId={servicioId} />
        </CardContent>
      </Card>
    );
  }

  const sumaPond = detalle.componentes.reduce((acc, c) => acc + c.ponderacion, 0);
  const ponderacionValida = Math.abs(sumaPond - 1) < 0.0001;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ConfigFormulaPolinomica formula={detalle.formula} />
        <div className="lg:col-span-2">
          <TablaComponentes formulaId={detalle.formula.id} componentes={detalle.componentes} />
        </div>
      </div>

      <TablaIndicesMensuales
        formulaId={detalle.formula.id}
        componentes={detalle.componentes}
        periodos={periodos}
        disabled={!ponderacionValida}
      />

      {periodos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GraficoEvolucionTarifa periodos={periodos} />
          </div>
          <ResumenRetroactivos periodos={periodos} />
        </div>
      )}
    </div>
  );
}
