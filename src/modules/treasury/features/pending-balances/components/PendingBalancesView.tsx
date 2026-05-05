'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import type { PendingInvoiceRow } from '../actions.server';

interface SupplierOpt {
  id: string;
  code: string;
  business_name: string;
}

interface Props {
  rows: PendingInvoiceRow[];
  total: number;
  summary: { totalPending: number; countSinOP: number; countScheduled: number };
  suppliers: SupplierOpt[];
  page: number;
  pageSize: number;
  initialFilters: {
    supplier_id?: string;
    op_status?: string;
    search?: string;
  };
}

const ALL = '__all__';

function formatARS(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}

export function PendingBalancesView({
  rows,
  total,
  summary,
  suppliers,
  page,
  pageSize,
  initialFilters,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [supplierFilter, setSupplierFilter] = useState<string>(
    initialFilters.supplier_id ?? ALL
  );
  const [opStatusFilter, setOpStatusFilter] = useState<string>(
    initialFilters.op_status ?? ALL
  );
  const [searchInput, setSearchInput] = useState<string>(initialFilters.search ?? '');

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const r of rows) init[r.invoice_id] = r.pending_amount.toFixed(2);
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const updateUrl = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    }
    params.delete('page');
    startTransition(() => {
      router.push(`/dashboard/treasury/pending-balances?${params.toString()}`);
    });
  };

  const onApplyFilters = () => {
    updateUrl({
      supplier: supplierFilter === ALL ? null : supplierFilter,
      op_status: opStatusFilter === ALL ? null : opStatusFilter,
      search: searchInput.trim() || null,
    });
  };

  const onClearFilters = () => {
    setSupplierFilter(ALL);
    setOpStatusFilter(ALL);
    setSearchInput('');
    startTransition(() => {
      router.push('/dashboard/treasury/pending-balances');
    });
  };

  const onAmountChange = (row: PendingInvoiceRow, value: string) => {
    setAmounts((prev) => ({ ...prev, [row.invoice_id]: value }));
    const parsed = parseFloat(value);
    let err: string | null = null;
    if (Number.isNaN(parsed) || parsed <= 0) {
      err = 'Monto inválido';
    } else if (parsed > row.pending_amount + 0.001) {
      err = `Máximo ${formatARS(row.pending_amount)}`;
    }
    setErrors((prev) => ({ ...prev, [row.invoice_id]: err }));
  };

  const toggleSelected = (id: string, value: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: value }));
  };

  const selectedRows = useMemo(
    () => rows.filter((r) => selected[r.invoice_id]),
    [rows, selected]
  );

  const selectedTotal = useMemo(() => {
    return selectedRows.reduce((acc, r) => {
      const v = parseFloat(amounts[r.invoice_id] ?? '0');
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
  }, [selectedRows, amounts]);

  const handleCreatePaymentOrder = () => {
    if (selectedRows.length === 0) {
      toast.error('Seleccioná al menos una factura.');
      return;
    }
    const supplierIds = new Set(selectedRows.map((r) => r.supplier_id));
    if (supplierIds.size > 1) {
      toast.error('Solo podés crear una OP de un único proveedor a la vez.');
      return;
    }
    for (const r of selectedRows) {
      const v = parseFloat(amounts[r.invoice_id] ?? '');
      if (!Number.isFinite(v) || v <= 0) {
        toast.error(`Monto inválido en factura ${r.full_number}`);
        return;
      }
      if (v > r.pending_amount + 0.001) {
        toast.error(`El monto en ${r.full_number} excede el pendiente`);
        return;
      }
    }

    const supplierId = selectedRows[0].supplier_id;
    const draft = {
      supplierId,
      items: selectedRows.map((r) => ({
        invoiceId: r.invoice_id,
        amount: parseFloat(amounts[r.invoice_id] ?? '0'),
      })),
    };

    try {
      sessionStorage.setItem('pending-balances-draft', JSON.stringify(draft));
    } catch {
      toast.error('No se pudo guardar la selección.');
      return;
    }
    router.push('/dashboard/treasury/payment-orders/new');
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    startTransition(() => {
      router.push(`/dashboard/treasury/pending-balances?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saldos Pendientes</h1>
          <p className="text-sm text-muted-foreground">
            Facturas de compra con saldo a pagar. Seleccioná items del mismo proveedor para crear una orden de pago.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold">{formatARS(summary.totalPending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Sin Orden de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.countSinOP}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.countScheduled}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Proveedor</label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} — {s.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Estado de OP</label>
              <Select value={opStatusFilter} onValueChange={setOpStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  <SelectItem value="NONE">Sin Orden de Pago</SelectItem>
                  <SelectItem value="SCHEDULED">Programada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Buscar Nº factura</label>
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onApplyFilters();
                }}
                placeholder="Ej: 0001-00001234"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={onApplyFilters} className="w-full">
                Aplicar
              </Button>
              <Button variant="outline" onClick={onClearFilters} className="w-full">
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Nº factura</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Pendiente</TableHead>
                  <TableHead>Estado OP</TableHead>
                  <TableHead className="text-right w-[200px]">Monto a pagar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-10">
                      No hay facturas con saldo pendiente.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const isSelected = !!selected[row.invoice_id];
                    const err = errors[row.invoice_id];
                    return (
                      <TableRow key={row.invoice_id} data-state={isSelected ? 'selected' : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(v) => toggleSelected(row.invoice_id, !!v)}
                          />
                        </TableCell>
                        <TableCell className="font-mono">
                          <Link
                            href={`/dashboard/purchasing/invoices/${row.invoice_id}`}
                            className="hover:underline"
                          >
                            {row.full_number}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(row.issue_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="text-muted-foreground">{row.supplier_code}</span>
                          {' — '}
                          {row.supplier_business_name}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatARS(row.total)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {formatARS(row.paid_amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatARS(row.pending_amount)}
                        </TableCell>
                        <TableCell>
                          {row.op_status === 'SCHEDULED' ? (
                            <div className="flex flex-col gap-0.5">
                              <Link
                                href={`/dashboard/treasury/payment-orders/${row.latest_op_id}`}
                                className="hover:underline"
                              >
                                <Badge variant="secondary">
                                  Programada · {row.latest_op_full_number}
                                </Badge>
                              </Link>
                              {row.latest_op_scheduled_date && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(row.latest_op_scheduled_date), 'dd/MM/yyyy')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline">Sin OP</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={row.pending_amount}
                            value={amounts[row.invoice_id] ?? ''}
                            onChange={(e) => onAmountChange(row, e.target.value)}
                            className={`text-right font-mono ${err ? 'border-red-500' : ''}`}
                            disabled={!isSelected}
                          />
                          {err && isSelected && (
                            <div className="text-xs text-red-600 mt-0.5">{err}</div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t">
              <div className="text-sm text-muted-foreground">
                Página {page} de {totalPages} · {total} facturas
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRows.length > 0 && (
        <div className="sticky bottom-4 z-10">
          <Card className="shadow-lg border-2 border-primary">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-semibold">{selectedRows.length}</span> items seleccionados
                {' · '}
                Total a pagar:{' '}
                <span className="font-mono font-bold">{formatARS(selectedTotal)}</span>
              </div>
              <Button onClick={handleCreatePaymentOrder}>Crear orden de pago</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
