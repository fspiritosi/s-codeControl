'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
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
import { Plus } from 'lucide-react';
import { createBankMovement, toggleMovementReconciled } from '../actions.server';
import { isIncomingMovement } from '../../../shared/bank-validators';
import { BANK_MOVEMENT_TYPE_LABELS } from '../../../shared/validators';

interface MovementRow {
  id: string;
  type: keyof typeof BANK_MOVEMENT_TYPE_LABELS;
  amount: number;
  date: string;
  description: string;
  reference: string | null;
  statement_number: string | null;
  reconciled: boolean;
  reconciled_at: string | null;
  created_at: string;
}

interface Props {
  bankAccountId: string;
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  currency: string;
  movements: MovementRow[];
}

export function BankMovementsPanel({
  bankAccountId,
  accountStatus,
  currency,
  movements,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [dialog, setDialog] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    type: 'DEPOSIT' as MovementRow['type'],
    amount: '',
    date: today,
    description: '',
    reference: '',
    statement_number: '',
  });

  const handleCreate = async () => {
    startTransition(async () => {
      const result = await createBankMovement({
        bank_account_id: bankAccountId,
        type: form.type,
        amount: form.amount.trim(),
        date: form.date,
        description: form.description.trim(),
        reference: form.reference.trim() || null,
        statement_number: form.statement_number.trim() || null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Movimiento registrado');
      setDialog(false);
      setForm({
        type: 'DEPOSIT',
        amount: '',
        date: today,
        description: '',
        reference: '',
        statement_number: '',
      });
      router.refresh();
    });
  };

  const handleToggleReconciled = async (movementId: string) => {
    startTransition(async () => {
      const result = await toggleMovementReconciled(movementId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <Button size="sm" onClick={() => setDialog(true)} disabled={accountStatus === 'CLOSED'}>
        <Plus className="size-4 mr-1" /> Nuevo movimiento
      </Button>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Fecha</TableHead>
              <TableHead className="w-[170px]">Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="w-[110px] text-center">Conciliado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Sin movimientos
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m) => {
                const isIncoming = isIncomingMovement(m.type);
                const color = isIncoming ? 'text-green-600' : 'text-red-600';
                const sign = isIncoming ? '+' : '-';
                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm font-mono">
                      {format(new Date(m.date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{BANK_MOVEMENT_TYPE_LABELS[m.type]}</Badge>
                    </TableCell>
                    <TableCell>{m.description}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {m.reference ?? m.statement_number ?? '-'}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${color}`}>
                      {sign}
                      {currency} {m.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={m.reconciled}
                        onCheckedChange={() => handleToggleReconciled(m.id)}
                        disabled={isPending}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo movimiento bancario</DialogTitle>
            <DialogDescription>
              Registrá manualmente un movimiento. Actualiza el saldo de la cuenta automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as MovementRow['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BANK_MOVEMENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label} {isIncomingMovement(value) ? '(+)' : '(-)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Referencia (opcional)</Label>
              <Input
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nº extracto (opcional)</Label>
              <Input
                value={form.statement_number}
                onChange={(e) => setForm((f) => ({ ...f, statement_number: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
