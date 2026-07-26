'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatDateUTC } from '@/shared/lib/utils/formatters';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { PaginatedTable, StatBlock, SummaryGrid } from './SectionShell';
import {
  applySupplierCredit,
  reverseSupplierCreditApplication,
} from '../../../credit/actions.server';

interface Application {
  id: string;
  invoice_id: string;
  invoice_full_number: string;
  amount: number;
  applied_at: Date | string;
  reversed_at: Date | string | null;
  notes: string | null;
}

interface ApplicableInvoice {
  id: string;
  full_number: string;
  issue_date: Date | string;
  total: number;
  outstanding: number;
}

interface Balance {
  onAccountPaid: number;
  creditApplied: number;
  available: number;
  applications: Application[];
}

const fmt = (n: number) =>
  `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CreditSection({
  supplierId,
  balance,
  applicableInvoices,
}: {
  supplierId: string;
  balance: Balance;
  applicableInvoices: ApplicableInvoice[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = applicableInvoices.find((i) => i.id === invoiceId);
  // No se puede imputar más que el crédito disponible ni más que lo que debe la
  // factura: el tope es el menor de los dos.
  const maxAmount = selected ? Math.min(balance.available, selected.outstanding) : 0;

  function openDialog() {
    setInvoiceId('');
    setAmount('');
    setError(null);
    setOpen(true);
  }

  function selectInvoice(id: string) {
    setInvoiceId(id);
    setError(null);
    const inv = applicableInvoices.find((i) => i.id === id);
    if (inv) setAmount(Math.min(balance.available, inv.outstanding).toFixed(2));
  }

  function submit() {
    const parsed = Number(amount);
    if (!invoiceId) return setError('Seleccioná una factura');
    if (!Number.isFinite(parsed) || parsed <= 0) return setError('El monto debe ser mayor a 0');
    if (parsed > maxAmount + 0.001) return setError(`El máximo imputable es ${fmt(maxAmount)}`);

    setError(null);
    startTransition(async () => {
      const res = await applySupplierCredit({ supplierId, invoiceId, amount: parsed });
      if (!res.ok) {
        setError(res.error ?? 'No se pudo aplicar el crédito');
        return;
      }
      toast.success('Crédito aplicado');
      setOpen(false);
      router.refresh();
    });
  }

  function reverse(id: string) {
    startTransition(async () => {
      const res = await reverseSupplierCreditApplication(id);
      if (!res.ok) {
        toast.error(res.error ?? 'No se pudo revertir');
        return;
      }
      toast.success('Imputación revertida');
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 pt-2">
      <SummaryGrid>
        <StatBlock
          label="Crédito disponible"
          value={fmt(balance.available)}
          hint="Para imputar a facturas"
        />
        <StatBlock
          label="Pagado a cuenta"
          value={fmt(balance.onAccountPaid)}
          hint="En órdenes de pago pagadas"
        />
        <StatBlock label="Ya imputado" value={fmt(balance.creditApplied)} />
        <StatBlock label="Imputaciones" value={balance.applications.length} />
      </SummaryGrid>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={openDialog}
          disabled={balance.available <= 0 || applicableInvoices.length === 0}
        >
          Aplicar crédito
        </Button>
        {balance.available > 0 && applicableInvoices.length === 0 && (
          <span className="text-sm text-muted-foreground">
            No hay facturas con saldo para imputar
          </span>
        )}
        {balance.available <= 0 && (
          <span className="text-sm text-muted-foreground">
            No hay crédito disponible. Se genera con un ítem &quot;a cuenta&quot; en una orden de
            pago.
          </span>
        )}
      </div>

      <PaginatedTable
        rows={balance.applications}
        page={page}
        onPageChange={setPage}
        emptyMessage="Todavía no se imputó crédito a ninguna factura"
        columns={[
          {
            header: 'Factura',
            cell: (r) => <span className="font-mono font-medium">{r.invoice_full_number}</span>,
          },
          {
            header: 'Fecha',
            cell: (r) => <span className="text-sm">{formatDateUTC(r.applied_at)}</span>,
          },
          {
            header: 'Monto',
            cell: (r) => <span className="font-medium">{fmt(r.amount)}</span>,
            className: 'text-right',
          },
          {
            header: 'Estado',
            cell: (r) =>
              r.reversed_at ? (
                <Badge variant="destructive">Revertida</Badge>
              ) : (
                <Badge variant="success">Vigente</Badge>
              ),
          },
          {
            header: '',
            cell: (r) =>
              r.reversed_at ? null : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => reverse(r.id)}
                >
                  Revertir
                </Button>
              ),
            className: 'text-right',
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar crédito a una factura</DialogTitle>
            <DialogDescription>
              Disponible: {fmt(balance.available)}. Imputar no mueve dinero: la plata ya salió
              con la orden de pago.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Factura</Label>
              <Select value={invoiceId} onValueChange={selectInvoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná la factura a imputar" />
                </SelectTrigger>
                <SelectContent>
                  {applicableInvoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.full_number} — debe {fmt(inv.outstanding)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monto a imputar</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                disabled={!invoiceId}
              />
              {selected && (
                <p className="text-xs text-muted-foreground">Máximo imputable: {fmt(maxAmount)}</p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={isPending || !invoiceId}>
              {isPending ? 'Aplicando…' : 'Aplicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
