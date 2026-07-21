'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { buttonVariants } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import {
  getCustomerAccountStatement,
  type AccountMovement,
} from '@/modules/sales/features/account-statement/actions.server';

const currency = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0);

const MOVEMENT_LABELS: Record<string, string> = {
  INVOICE: 'Factura',
  CREDIT_NOTE: 'Nota de Crédito',
  DEBIT_NOTE: 'Nota de Débito',
  RECEIPT: 'Recibo',
};

type Statement = {
  movements: AccountMovement[];
  summary: { totalDebit: number; totalCredit: number; balance: number };
} | null;

export default function CustomerAccountSummary({ customerId }: { customerId: string }) {
  const [data, setData] = useState<Statement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerAccountStatement(customerId)
      .then((res) => setData(res as Statement))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <p className="text-sm text-muted-foreground">Cargando cuenta corriente…</p>;
  if (!data) return <p className="text-sm text-muted-foreground">No hay datos de cuenta corriente.</p>;

  const recent = [...data.movements].reverse().slice(0, 8);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cuenta corriente</CardTitle>
        <Link
          href={`/dashboard/sales/account-statement/${customerId}`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          Ver detalle completo
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label="Total facturado (Debe)" value={currency(data.summary.totalDebit)} />
          <StatTile label="Total cobrado (Haber)" value={currency(data.summary.totalCredit)} />
          <StatTile
            label="Saldo"
            value={currency(data.summary.balance)}
            emphasis={data.summary.balance > 0 ? 'debt' : data.summary.balance < 0 ? 'credit' : 'none'}
          />
        </div>

        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin movimientos.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Comprobante</TableHead>
                <TableHead className="text-right">Debe</TableHead>
                <TableHead className="text-right">Haber</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">{new Date(m.date).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell className="text-sm">
                    {MOVEMENT_LABELS[m.type] ?? m.type} {m.full_number ?? ''}
                  </TableCell>
                  <TableCell className="text-right text-sm">{m.debit ? currency(m.debit) : '—'}</TableCell>
                  <TableCell className="text-right text-sm">{m.credit ? currency(m.credit) : '—'}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{currency(m.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function StatTile({
  label,
  value,
  emphasis = 'none',
}: {
  label: string;
  value: string;
  emphasis?: 'debt' | 'credit' | 'none';
}) {
  const color = emphasis === 'debt' ? 'text-red-600' : emphasis === 'credit' ? 'text-green-600' : 'text-foreground';
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}
