'use client';

import { useMemo, useState, useTransition } from 'react';
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
import {
  applyCreditNoteToInvoices,
  reverseCreditNoteApplication,
} from '@/shared/actions/credit-notes';

/**
 * Saldo a favor del proveedor, unificado (TKT-586).
 *
 * La plata a favor viene de dos lados —pagos a cuenta y notas de crédito— y se
 * guarda en dos tablas distintas, pero para administración es una sola bolsa:
 * partirla en dos paneles obliga a sumar de cabeza. Acá se muestra junta, con
 * el origen como columna, y cada acción despacha al circuito que corresponde.
 */

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

interface CreditNote {
  id: string;
  full_number: string;
  issue_date: Date | string;
  total: number;
  applied: number;
  available: number;
  original_invoice_full_number: string | null;
}

interface CreditNoteApplication {
  id: string;
  credit_note_id: string;
  credit_note_full_number: string;
  target_type: 'INVOICE' | 'PAYMENT_ORDER';
  target_id: string;
  target_full_number: string;
  amount: number;
  applied_at: Date | string;
  reversed_at: Date | string | null;
  notes: string | null;
}

/** Fila de la tabla unificada: una imputación, venga de donde venga. */
interface UnifiedRow {
  id: string;
  origin: 'ON_ACCOUNT' | 'CREDIT_NOTE';
  originLabel: string;
  targetLabel: string;
  /** Una imputación usada en una OP se libera anulando la orden, no desde acá. */
  lockedByPaymentOrder: boolean;
  amount: number;
  applied_at: Date | string;
  reversed_at: Date | string | null;
}

const ON_ACCOUNT = 'ON_ACCOUNT';

const fmt = (n: number) =>
  `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CreditSection({
  supplierId,
  balance,
  applicableInvoices,
  creditNotes = [],
  creditNoteApplications = [],
}: {
  supplierId: string;
  balance: Balance;
  applicableInvoices: ApplicableInvoice[];
  creditNotes?: CreditNote[];
  creditNoteApplications?: CreditNoteApplication[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [source, setSource] = useState<string>(ON_ACCOUNT);
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const notesWithCredit = useMemo(
    () => creditNotes.filter((n) => n.available > 0),
    [creditNotes]
  );
  const creditNotesAvailable = useMemo(
    () => notesWithCredit.reduce((acc, n) => acc + n.available, 0),
    [notesWithCredit]
  );
  const totalAvailable = Math.round((balance.available + creditNotesAvailable) * 100) / 100;

  const selectedNote = notesWithCredit.find((n) => n.id === source);
  const sourceAvailable = selectedNote ? selectedNote.available : balance.available;
  const selectedInvoice = applicableInvoices.find((i) => i.id === invoiceId);
  // No se puede imputar más que el crédito del origen elegido ni más que lo que
  // debe la factura: el tope es el menor de los dos.
  const maxAmount = selectedInvoice
    ? Math.min(sourceAvailable, selectedInvoice.outstanding)
    : 0;

  const rows: UnifiedRow[] = useMemo(() => {
    const fromOnAccount: UnifiedRow[] = balance.applications.map((a) => ({
      id: `oa-${a.id}`,
      origin: 'ON_ACCOUNT',
      originLabel: 'Pago a cuenta',
      targetLabel: a.invoice_full_number,
      lockedByPaymentOrder: false,
      amount: a.amount,
      applied_at: a.applied_at,
      reversed_at: a.reversed_at,
    }));
    const fromNotes: UnifiedRow[] = creditNoteApplications.map((a) => ({
      id: `cn-${a.id}`,
      origin: 'CREDIT_NOTE',
      originLabel: a.credit_note_full_number,
      targetLabel: a.target_full_number,
      lockedByPaymentOrder: a.target_type === 'PAYMENT_ORDER',
      amount: a.amount,
      applied_at: a.applied_at,
      reversed_at: a.reversed_at,
    }));
    return [...fromOnAccount, ...fromNotes].sort(
      (a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
    );
  }, [balance.applications, creditNoteApplications]);

  const totalApplied = Math.round(
    (balance.creditApplied + creditNotes.reduce((acc, n) => acc + n.applied, 0)) * 100
  ) / 100;

  function openDialog() {
    setSource(balance.available > 0 ? ON_ACCOUNT : (notesWithCredit[0]?.id ?? ON_ACCOUNT));
    setInvoiceId('');
    setAmount('');
    setError(null);
    setOpen(true);
  }

  function selectSource(value: string) {
    setSource(value);
    setAmount('');
    setError(null);
  }

  function selectInvoice(id: string) {
    setInvoiceId(id);
    setError(null);
    const inv = applicableInvoices.find((i) => i.id === id);
    if (inv) setAmount(Math.min(sourceAvailable, inv.outstanding).toFixed(2));
  }

  function submit() {
    const parsed = Number(amount);
    if (!invoiceId) return setError('Seleccioná una factura');
    if (!Number.isFinite(parsed) || parsed <= 0) return setError('El monto debe ser mayor a 0');
    if (parsed > maxAmount + 0.001) return setError(`El máximo imputable es ${fmt(maxAmount)}`);

    setError(null);
    startTransition(async () => {
      const res =
        source === ON_ACCOUNT
          ? await applySupplierCredit({ supplierId, invoiceId, amount: parsed })
          : await applyCreditNoteToInvoices({
              creditNoteId: source,
              allocations: [{ invoiceId, amount: parsed }],
            });
      if (!res.ok) {
        setError(res.error ?? 'No se pudo aplicar el crédito');
        return;
      }
      toast.success('Crédito aplicado');
      setOpen(false);
      router.refresh();
    });
  }

  function reverse(row: UnifiedRow) {
    const rawId = row.id.slice(3);
    startTransition(async () => {
      const res =
        row.origin === 'ON_ACCOUNT'
          ? await reverseSupplierCreditApplication(rawId)
          : await reverseCreditNoteApplication(rawId);
      if (!res.ok) {
        toast.error(res.error ?? 'No se pudo revertir');
        return;
      }
      toast.success('Imputación revertida');
      router.refresh();
    });
  }

  const canApply = totalAvailable > 0 && applicableInvoices.length > 0;

  return (
    <div className="space-y-4 pt-2">
      <SummaryGrid>
        <StatBlock
          label="Crédito disponible"
          value={fmt(totalAvailable)}
          hint="Para imputar a facturas"
        />
        <StatBlock
          label="Pagos a cuenta"
          value={fmt(balance.available)}
          hint={`Pagado a cuenta: ${fmt(balance.onAccountPaid)}`}
        />
        <StatBlock
          label="Notas de crédito"
          value={fmt(creditNotesAvailable)}
          hint={`${notesWithCredit.length} con saldo`}
        />
        <StatBlock label="Ya imputado" value={fmt(totalApplied)} />
      </SummaryGrid>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={openDialog} disabled={!canApply}>
          Imputar crédito
        </Button>
        {totalAvailable > 0 && applicableInvoices.length === 0 && (
          <span className="text-sm text-muted-foreground">
            No hay facturas con saldo para imputar
          </span>
        )}
        {totalAvailable <= 0 && (
          <span className="text-sm text-muted-foreground">
            No hay crédito disponible. Se genera con una nota de crédito o con un ítem
            &quot;a cuenta&quot; en una orden de pago.
          </span>
        )}
      </div>

      <PaginatedTable
        rows={rows}
        page={page}
        onPageChange={setPage}
        emptyMessage="Todavía no se imputó crédito"
        columns={[
          {
            header: 'Origen',
            cell: (r: UnifiedRow) =>
              r.origin === 'ON_ACCOUNT' ? (
                <Badge variant="secondary">Pago a cuenta</Badge>
              ) : (
                <span className="font-mono text-sm">{r.originLabel}</span>
              ),
          },
          {
            header: 'Imputado a',
            cell: (r: UnifiedRow) => (
              <span className="font-mono font-medium">{r.targetLabel}</span>
            ),
          },
          {
            header: 'Fecha',
            cell: (r: UnifiedRow) => (
              <span className="text-sm">{formatDateUTC(r.applied_at)}</span>
            ),
          },
          {
            header: 'Monto',
            cell: (r: UnifiedRow) => <span className="font-medium">{fmt(r.amount)}</span>,
            className: 'text-right',
          },
          {
            header: 'Estado',
            cell: (r: UnifiedRow) =>
              r.reversed_at ? (
                <Badge variant="destructive">Revertida</Badge>
              ) : (
                <Badge variant="success">Vigente</Badge>
              ),
          },
          {
            header: '',
            cell: (r: UnifiedRow) =>
              r.reversed_at ? null : r.lockedByPaymentOrder ? (
                <span className="text-xs text-muted-foreground">Se libera anulando la OP</span>
              ) : (
                <Button variant="ghost" size="sm" disabled={isPending} onClick={() => reverse(r)}>
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
            <DialogTitle>Imputar crédito a una factura</DialogTitle>
            <DialogDescription>
              Disponible: {fmt(totalAvailable)}. Imputar no mueve dinero: es un asiento entre
              comprobantes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Origen del crédito</Label>
              <Select value={source} onValueChange={selectSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná de dónde sale el crédito" />
                </SelectTrigger>
                <SelectContent>
                  {balance.available > 0 && (
                    <SelectItem value={ON_ACCOUNT}>
                      Pago a cuenta — {fmt(balance.available)}
                    </SelectItem>
                  )}
                  {notesWithCredit.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.full_number} — {fmt(n.available)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedNote?.original_invoice_full_number && (
                <p className="text-xs text-muted-foreground">
                  Corrige la factura {selectedNote.original_invoice_full_number}. Se puede
                  imputar a cualquier factura con saldo.
                </p>
              )}
            </div>

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
              {selectedInvoice && (
                <p className="text-xs text-muted-foreground">
                  Máximo imputable: {fmt(maxAmount)}. Si sobra crédito, queda disponible para
                  otra factura o para una orden de pago.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={isPending || !invoiceId}>
              {isPending ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
