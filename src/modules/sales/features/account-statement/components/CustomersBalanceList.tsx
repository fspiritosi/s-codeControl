'use client';

import Link from 'next/link';
import { Eye } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

export interface CustomerBalanceRow {
  id: string;
  name: string;
  tax_id: string | null;
  balance: number;
}

interface CustomersBalanceListProps {
  data: CustomerBalanceRow[];
}

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value ?? 0);
}

export function CustomersBalanceList({ data }: CustomersBalanceListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead className="w-[180px]">CUIT / Nº fiscal</TableHead>
            <TableHead className="w-[180px] text-right">Saldo</TableHead>
            <TableHead className="w-[140px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No hay clientes con movimientos.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="font-mono">{row.tax_id ?? '—'}</TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    row.balance > 0
                      ? 'text-destructive'
                      : row.balance < 0
                        ? 'text-green-600'
                        : ''
                  }`}
                >
                  {formatCurrency(row.balance)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/sales/account-statement/${row.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Estado de cuenta
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
