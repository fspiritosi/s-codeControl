'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { formatCurrencyARS, formatDateUTC } from '@/shared/lib/utils/formatters';
import {
  getImputableInvoices,
  getImputableExpenses,
  imputeInvoicesToOrder,
  imputeExpensesToOrder,
  removeInvoiceFromOrder,
  removeExpenseFromOrder,
} from '../actions.server';

type LinkedInvoice = { id: string; full_number: string; status: string; total: number };
type LinkedExpense = { id: string; full_number: string; description: string; amount: number; status: string };
type ImputationSummary = {
  orderTotal: number;
  invoicesTotal: number;
  expensesTotal: number;
  imputedTotal: number;
  over: number;
} | null;

interface Props {
  orderId: string;
  canUpdate: boolean;
  linkedInvoices: LinkedInvoice[];
  linkedExpenses: LinkedExpense[];
  summary: ImputationSummary;
}

type Candidate = { id: string; primary: string; secondary: string; amount: number };

export default function PurchaseOrderImputations({
  orderId,
  canUpdate,
  linkedInvoices,
  linkedExpenses,
  summary,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [dialogKind, setDialogKind] = useState<'invoice' | 'expense' | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const openDialog = async (kind: 'invoice' | 'expense') => {
    setDialogKind(kind);
    setSelected(new Set());
    setLoadingCandidates(true);
    try {
      if (kind === 'invoice') {
        const data = await getImputableInvoices(orderId);
        setCandidates(
          data.map((i) => ({
            id: i.id,
            primary: i.full_number,
            secondary: formatDateUTC(i.issue_date),
            amount: i.total,
          }))
        );
      } else {
        const data = await getImputableExpenses(orderId);
        setCandidates(
          data.map((e) => ({
            id: e.id,
            primary: e.full_number,
            secondary: e.description,
            amount: e.amount,
          }))
        );
      }
    } catch (e) {
      toast.error('No se pudieron cargar los comprobantes disponibles');
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const confirmImpute = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const kind = dialogKind;
    startTransition(async () => {
      const res =
        kind === 'invoice'
          ? await imputeInvoicesToOrder(orderId, ids)
          : await imputeExpensesToOrder(orderId, ids);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.summary && res.summary.over > 0) {
        toast.warning(`El total imputado supera el de la OC en ${formatCurrencyARS(res.summary.over)}`);
      } else {
        toast.success('Comprobantes imputados');
      }
      setDialogKind(null);
      router.refresh();
    });
  };

  const removeItem = (kind: 'invoice' | 'expense', id: string) => {
    startTransition(async () => {
      const res =
        kind === 'invoice'
          ? await removeInvoiceFromOrder(orderId, id)
          : await removeExpenseFromOrder(orderId, id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success('Comprobante desimputado');
      router.refresh();
    });
  };

  return (
    <>
      {summary && summary.over > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            El total imputado ({formatCurrencyARS(summary.imputedTotal)}) supera el total de la OC (
            {formatCurrencyARS(summary.orderTotal)}) en{' '}
            <strong>{formatCurrencyARS(summary.over)}</strong>.
          </span>
        </div>
      )}

      {/* Facturas vinculadas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Facturas vinculadas</CardTitle>
          {canUpdate && (
            <Button size="sm" variant="outline" onClick={() => openDialog('invoice')} disabled={pending}>
              <Plus className="size-4 mr-1" /> Imputar factura
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {linkedInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay facturas vinculadas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {canUpdate && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono">{inv.full_number}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'CONFIRMED' ? 'default' : 'secondary'}>{inv.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrencyARS(Number(inv.total))}</TableCell>
                    {canUpdate && (
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem('invoice', inv.id)}
                          disabled={pending}
                          title="Desimputar"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Gastos vinculados */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gastos vinculados</CardTitle>
          {canUpdate && (
            <Button size="sm" variant="outline" onClick={() => openDialog('expense')} disabled={pending}>
              <Plus className="size-4 mr-1" /> Imputar gasto
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {linkedExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay gastos vinculados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  {canUpdate && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedExpenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="font-mono">{exp.full_number}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{exp.description}</TableCell>
                    <TableCell className="text-right">{formatCurrencyARS(Number(exp.amount))}</TableCell>
                    {canUpdate && (
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem('expense', exp.id)}
                          disabled={pending}
                          title="Desimputar"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de selección */}
      <Dialog open={dialogKind !== null} onOpenChange={(open) => !open && setDialogKind(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogKind === 'invoice' ? 'Imputar facturas a la OC' : 'Imputar gastos a la OC'}
            </DialogTitle>
          </DialogHeader>

          {loadingCandidates ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>
          ) : candidates.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay comprobantes disponibles del proveedor de esta OC.
            </p>
          ) : (
            <ScrollArea className="max-h-72 pr-3">
              <div className="space-y-1">
                {candidates.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 rounded-md border p-2 cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm">{c.primary}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.secondary}</p>
                    </div>
                    <span className="font-mono text-sm">{formatCurrencyARS(c.amount)}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogKind(null)} disabled={pending}>
              Cancelar
            </Button>
            <Button onClick={confirmImpute} disabled={pending || selected.size === 0}>
              {pending ? 'Imputando…' : `Imputar (${selected.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
