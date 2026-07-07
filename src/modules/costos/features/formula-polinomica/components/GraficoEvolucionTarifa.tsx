'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { formatPeriodoLabel } from '@/modules/costos/shared/utils/periodo';
import type { PeriodoConValores } from '@/modules/costos/shared/types/formula-polinomica.types';

export function GraficoEvolucionTarifa({ periodos }: { periodos: PeriodoConValores[] }) {
  if (periodos.length === 0) return null;

  const data = periodos.map((p) => ({
    periodo: formatPeriodoLabel(p.periodo),
    valor_ajustado: p.valor_ajustado,
    importe_certificado: p.importe_certificado ?? null,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Evolución de la tarifa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="periodo" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} width={48} />
              <Tooltip formatter={(v: number) => formatCurrencyARS(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="valor_ajustado" name="Valor ajustado" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="importe_certificado" name="Certificado" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
