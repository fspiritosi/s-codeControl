'use client';

import { useMemo, useState, useTransition } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Plus, RefreshCw } from 'lucide-react';
import { createCheck, changeCheckStatus } from '../actions.server';
import {
  CHECK_STATUS_LABELS,
  CHECK_TYPE_LABELS,
} from '../../../shared/validators';
import {
  getNextStatuses,
  type CheckStatusValue,
  type CheckTypeValue,
} from '../../../shared/check-validators';

interface CheckRow {
  id: string;
  type: CheckTypeValue;
  status: CheckStatusValue;
  check_number: string;
  bank_name: string;
  branch: string | null;
  account_number: string | null;
  amount: number;
  issue_date: string;
  due_date: string;
  drawer_name: string;
  drawer_tax_id: string | null;
  payee_name: string | null;
  customer_id: string | null;
  supplier_id: string | null;
  customer_name: string | null;
  supplier_name: string | null;
  notes: string | null;
}

interface BankAccountOption {
  id: string;
  bank_name: string;
  account_number: string;
}

interface Props {
  checks: CheckRow[];
  bankAccounts: BankAccountOption[];
}

const today = () => new Date().toISOString().slice(0, 10);

function statusVariant(status: CheckStatusValue): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'CLEARED' || status === 'CASHED') return 'default';
  if (status === 'REJECTED' || status === 'VOIDED') return 'destructive';
  if (status === 'ENDORSED' || status === 'DELIVERED' || status === 'DEPOSITED') return 'secondary';
  return 'outline';
}

export function ChecksClient({ checks, bankAccounts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<CheckTypeValue>('THIRD_PARTY');

  const [createDialog, setCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: 'THIRD_PARTY' as CheckTypeValue,
    check_number: '',
    bank_name: '',
    branch: '',
    account_number: '',
    amount: '',
    issue_date: today(),
    due_date: today(),
    drawer_name: '',
    drawer_tax_id: '',
    payee_name: '',
    notes: '',
  });

  const [statusDialog, setStatusDialog] = useState(false);
  const [statusTarget, setStatusTarget] = useState<CheckRow | null>(null);
  const [statusForm, setStatusForm] = useState({
    status: '' as CheckStatusValue | '',
    bank_account_id: '',
    endorsed_to_name: '',
    endorsed_to_tax_id: '',
    rejection_reason: '',
  });

  const filtered = useMemo(() => checks.filter((c) => c.type === tab), [checks, tab]);

  const openCreate = (type: CheckTypeValue) => {
    setCreateForm((f) => ({ ...f, type }));
    setCreateDialog(true);
  };

  const handleCreate = async () => {
    startTransition(async () => {
      const result = await createCheck({
        type: createForm.type,
        check_number: createForm.check_number.trim(),
        bank_name: createForm.bank_name.trim(),
        branch: createForm.branch.trim() || null,
        account_number: createForm.account_number.trim() || null,
        amount: createForm.amount.trim(),
        issue_date: createForm.issue_date,
        due_date: createForm.due_date,
        drawer_name: createForm.drawer_name.trim(),
        drawer_tax_id: createForm.drawer_tax_id.trim() || null,
        payee_name: createForm.payee_name.trim() || null,
        customer_id: null,
        supplier_id: null,
        notes: createForm.notes.trim() || null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Cheque creado');
      setCreateDialog(false);
      setCreateForm({
        type: createForm.type,
        check_number: '',
        bank_name: '',
        branch: '',
        account_number: '',
        amount: '',
        issue_date: today(),
        due_date: today(),
        drawer_name: '',
        drawer_tax_id: '',
        payee_name: '',
        notes: '',
      });
      router.refresh();
    });
  };

  const openStatusChange = (check: CheckRow) => {
    setStatusTarget(check);
    setStatusForm({
      status: '' as CheckStatusValue | '',
      bank_account_id: '',
      endorsed_to_name: '',
      endorsed_to_tax_id: '',
      rejection_reason: '',
    });
    setStatusDialog(true);
  };

  const handleStatusChange = async () => {
    if (!statusTarget || !statusForm.status) return;
    startTransition(async () => {
      const result = await changeCheckStatus(statusTarget.id, {
        status: statusForm.status as CheckStatusValue,
        bank_account_id: statusForm.bank_account_id || null,
        endorsed_to_name: statusForm.endorsed_to_name.trim() || null,
        endorsed_to_tax_id: statusForm.endorsed_to_tax_id.trim() || null,
        rejection_reason: statusForm.rejection_reason.trim() || null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Estado actualizado');
      setStatusDialog(false);
      setStatusTarget(null);
      router.refresh();
    });
  };

  const nextStatuses = statusTarget ? getNextStatuses(statusTarget.type, statusTarget.status) : [];
  const needsBankAccount = statusForm.status === 'DEPOSITED';
  const needsEndorse = statusForm.status === 'ENDORSED';
  const needsRejection = statusForm.status === 'REJECTED';

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as CheckTypeValue)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="THIRD_PARTY">{CHECK_TYPE_LABELS.THIRD_PARTY} (recibidos)</TabsTrigger>
            <TabsTrigger value="OWN">{CHECK_TYPE_LABELS.OWN} (emitidos)</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={() => openCreate(tab)}>
            <Plus className="size-4 mr-1" /> Nuevo cheque
          </Button>
        </div>

        <TabsContent value={tab} className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Librador</TableHead>
                  <TableHead>Beneficiario</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Emisión</TableHead>
                  <TableHead>Vto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[60px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                      Sin cheques. Creá el primero con &quot;Nuevo cheque&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => {
                    const canTransition = getNextStatuses(c.type, c.status).length > 0;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono">{c.check_number}</TableCell>
                        <TableCell className="text-sm">{c.bank_name}</TableCell>
                        <TableCell className="text-sm">{c.drawer_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.payee_name ?? '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">${c.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(c.issue_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(c.due_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(c.status)}>
                            {CHECK_STATUS_LABELS[c.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {canTransition && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openStatusChange(c)}
                              title="Cambiar estado"
                            >
                              <RefreshCw className="size-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nuevo cheque {CHECK_TYPE_LABELS[createForm.type].toLowerCase()}</DialogTitle>
            <DialogDescription>
              Registrá un cheque {createForm.type === 'OWN' ? 'propio emitido' : 'recibido de tercero'}. Se crea en estado &quot;En cartera&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Número</Label>
              <Input
                value={createForm.check_number}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, check_number: e.target.value }))
                }
                className="font-mono"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                value={createForm.amount}
                onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Banco</Label>
              <Input
                value={createForm.bank_name}
                onChange={(e) => setCreateForm((f) => ({ ...f, bank_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sucursal (opcional)</Label>
              <Input
                value={createForm.branch}
                onChange={(e) => setCreateForm((f) => ({ ...f, branch: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nº cuenta (opcional)</Label>
              <Input
                value={createForm.account_number}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, account_number: e.target.value }))
                }
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha emisión</Label>
              <Input
                type="date"
                value={createForm.issue_date}
                onChange={(e) => setCreateForm((f) => ({ ...f, issue_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha vto</Label>
              <Input
                type="date"
                value={createForm.due_date}
                onChange={(e) => setCreateForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Librador</Label>
                <Input
                  value={createForm.drawer_name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, drawer_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>CUIT librador (opcional)</Label>
                <Input
                  value={createForm.drawer_tax_id}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, drawer_tax_id: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Beneficiario (opcional)</Label>
              <Input
                value={createForm.payee_name}
                onChange={(e) => setCreateForm((f) => ({ ...f, payee_name: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status change dialog */}
      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar estado del cheque</DialogTitle>
            <DialogDescription>
              {statusTarget
                ? `Cheque ${statusTarget.check_number} — estado actual: ${CHECK_STATUS_LABELS[statusTarget.status]}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nuevo estado</Label>
              <Select
                value={statusForm.status}
                onValueChange={(v) =>
                  setStatusForm((f) => ({ ...f, status: v as CheckStatusValue }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná el nuevo estado" />
                </SelectTrigger>
                <SelectContent>
                  {nextStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CHECK_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsBankAccount && (
              <div className="space-y-1.5">
                <Label>Cuenta bancaria de depósito (opcional)</Label>
                <Select
                  value={statusForm.bank_account_id}
                  onValueChange={(v) => setStatusForm((f) => ({ ...f, bank_account_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.bank_name} - {a.account_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {needsEndorse && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Endosado a</Label>
                  <Input
                    value={statusForm.endorsed_to_name}
                    onChange={(e) =>
                      setStatusForm((f) => ({ ...f, endorsed_to_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CUIT (opcional)</Label>
                  <Input
                    value={statusForm.endorsed_to_tax_id}
                    onChange={(e) =>
                      setStatusForm((f) => ({ ...f, endorsed_to_tax_id: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            {needsRejection && (
              <div className="space-y-1.5">
                <Label>Motivo del rechazo</Label>
                <Textarea
                  value={statusForm.rejection_reason}
                  onChange={(e) =>
                    setStatusForm((f) => ({ ...f, rejection_reason: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={isPending || !statusForm.status}
            >
              {isPending ? 'Actualizando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
