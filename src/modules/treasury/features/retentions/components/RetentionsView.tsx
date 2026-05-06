import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  getRetentionsPaginated,
  getRetentionsSummary,
  getRetentionTypeOptions,
} from '../actions.server';
import { RetentionsDataTable } from './_RetentionsDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';

interface Props {
  searchParams: DataTableSearchParams;
}

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export default async function RetentionsView({ searchParams }: Props) {
  const [{ data, total }, summary, taxTypeOptions] = await Promise.all([
    getRetentionsPaginated(searchParams),
    getRetentionsSummary(),
    getRetentionTypeOptions(),
  ]);

  return (
    <div className="space-y-4">
      {summary.byTaxType.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total retenido</CardDescription>
              <CardTitle className="text-xl font-mono text-amber-600">
                {fmt(summary.totalAmount)}
              </CardTitle>
            </CardHeader>
          </Card>
          {summary.byTaxType.slice(0, 3).map((g) => (
            <Card key={g.taxTypeId}>
              <CardHeader className="pb-2">
                <CardDescription>{g.name}</CardDescription>
                <CardTitle className="text-xl font-mono">{fmt(g.total)}</CardTitle>
                <Badge variant="outline" className="w-fit mt-1">
                  {g.count} comprobante{g.count === 1 ? '' : 's'}
                </Badge>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Retenciones aplicadas</CardTitle>
          <CardDescription>
            Lista de retenciones en órdenes de pago. Cada línea genera un comprobante
            numerado al confirmar la OP. Click en el N° de certificado descarga el PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RetentionsDataTable
            data={data}
            totalRows={total}
            searchParams={searchParams as any}
            taxTypeOptions={taxTypeOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
