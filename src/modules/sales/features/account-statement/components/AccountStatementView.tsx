'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { VOUCHER_TYPE_LABELS, CUSTOMER_TAX_CONDITION_LABELS } from '@/modules/sales/shared/types';
import type { AccountMovement } from '../actions.server';
import { formatCurrency } from './CustomersBalanceList';

const MOVEMENT_TYPE_LABELS: Record<AccountMovement['type'], string> = {
  INVOICE: 'Factura',
  CREDIT_NOTE: 'Nota de Crédito',
  DEBIT_NOTE: 'Nota de Débito',
  RECEIPT: 'Recibo',
};

interface AccountStatementCustomer {
  id: string;
  name: string;
  tax_id: string | null;
  cuit: string | number | bigint | null;
  tax_condition: string | null;
}

interface AccountStatementViewProps {
  customer: AccountStatementCustomer;
  movements: AccountMovement[];
  summary: {
    totalDebit: number;
    totalCredit: number;
    balance: number;
  };
}

function movementLabel(m: AccountMovement): string {
  if (m.voucher_type && VOUCHER_TYPE_LABELS[m.voucher_type]) {
    return VOUCHER_TYPE_LABELS[m.voucher_type];
  }
  return MOVEMENT_TYPE_LABELS[m.type];
}

export function AccountStatementView({ customer, movements, summary }: AccountStatementViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/sales/account-statement">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a cuentas corrientes
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{customer.name}</CardTitle>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>
              CUIT / Nº fiscal:{' '}
              <span className="font-mono">
                {customer.tax_id ?? (customer.cuit != null ? String(customer.cuit) : '—')}
              </span>
            </span>
            {customer.tax_condition && (
              <span>
                Condición IVA:{' '}
                {CUSTOMER_TAX_CONDITION_LABELS[customer.tax_condition] ?? customer.tax_condition}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Debe</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(summary.totalDebit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Haber</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(summary.totalCredit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold ${
                summary.balance > 0
                  ? 'text-destructive'
                  : summary.balance < 0
                    ? 'text-green-600'
                    : ''
              }`}
            >
              {formatCurrency(summary.balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Fecha</TableHead>
              <TableHead>Comprobante</TableHead>
              <TableHead className="w-[160px]">Número</TableHead>
              <TableHead className="w-[160px] text-right">Debe</TableHead>
              <TableHead className="w-[160px] text-right">Haber</TableHead>
              <TableHead className="w-[160px] text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Este cliente no tiene movimientos registrados.
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m) => (
                <TableRow key={`${m.type}-${m.id}`}>
                  <TableCell>{format(new Date(m.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={m.type === 'RECEIPT' || m.type === 'CREDIT_NOTE' ? 'secondary' : 'default'}>
                      {movementLabel(m)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{m.full_number ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    {m.debit ? formatCurrency(m.debit) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {m.credit ? formatCurrency(m.credit) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(m.balance)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {movements.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Totales
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(summary.totalDebit)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(summary.totalCredit)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(summary.balance)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
