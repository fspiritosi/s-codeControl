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
import { Plus, Lock } from 'lucide-react';
import { openSession, closeSession } from '../actions.server';
import { createCashMovement } from '../../cash-movements/actions.server';
import {
  CASH_MOVEMENT_TYPE_LABELS,
  SESSION_STATUS_LABELS,
} from '../../../shared/validators';

interface MovementRow {
  id: string;
  type: string;
  amount: number;
  description: string;
  reference: string | null;
  date: string;
  created_at: string;
}

interface ActiveSessionInfo {
  id: string;
  session_number: number;
  status: 'OPEN' | 'CLOSED';
  opening_balance: number;
  expected_balance: number;
  opened_at: string;
}

interface Props {
  cashRegisterId: string;
  cashRegisterStatus: 'ACTIVE' | 'INACTIVE';
  activeSession: ActiveSessionInfo | null;
  movements: MovementRow[];
}

export function ActiveSessionPanel({
  cashRegisterId,
  cashRegisterStatus,
  activeSession,
  movements,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [openDialog, setOpenDialog] = useState(false);
  const [openForm, setOpenForm] = useState({ opening_balance: '', opening_notes: '' });

  const [closeDialog, setCloseDialog] = useState(false);
  const [closeForm, setCloseForm] = useState({ actual_balance: '', closing_notes: '' });

  const [mvDialog, setMvDialog] = useState(false);
  const [mvForm, setMvForm] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE' | 'ADJUSTMENT',
    amount: '',
    description: '',
    reference: '',
  });

  const currentBalance = movements.reduce((acc, m) => {
    if (m.type === 'OPENING') return acc + m.amount;
    if (m.type === 'INCOME') return acc + m.amount;
    if (m.type === 'EXPENSE') return acc - m.amount;
    if (m.type === 'ADJUSTMENT') return acc + m.amount;
    return acc;
  }, 0);

  const handleOpen = async () => {
    startTransition(async () => {
      const result = await openSession({
        cash_register_id: cashRegisterId,
        opening_balance: openForm.opening_balance.trim(),
        opening_notes: openForm.opening_notes.trim() || null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Sesión abierta');
      setOpenDialog(false);
      setOpenForm({ opening_balance: '', opening_notes: '' });
      router.refresh();
    });
  };

  const handleClose = async () => {
    if (!activeSession) return;
    startTransition(async () => {
      const result = await closeSession({
        session_id: activeSession.id,
        actual_balance: closeForm.actual_balance.trim(),
        closing_notes: closeForm.closing_notes.trim() || null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Sesión cerrada');
      setCloseDialog(false);
      setCloseForm({ actual_balance: '', closing_notes: '' });
      router.refresh();
    });
  };

  const handleNewMovement = async () => {
    if (!activeSession) return;
    startTransition(async () => {
      const result = await createCashMovement({
        session_id: activeSession.id,
        cash_register_id: cashRegisterId,
        type: mvForm.type,
        amount: mvForm.amount.trim(),
        description: mvForm.description.trim(),
        reference: mvForm.reference.trim() || null,
        purchase_invoice_id: null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Movimiento registrado');
      setMvDialog(false);
      setMvForm({ type: 'INCOME', amount: '', description: '', reference: '' });
      router.refresh();
    });
  };

  if (!activeSession) {
    return (
      <>
        <Button
          onClick={() => setOpenDialog(true)}
          disabled={cashRegisterStatus !== 'ACTIVE'}
        >
          <Plus className="size-4 mr-1" />
          Abrir sesión
        </Button>
        {cashRegisterStatus !== 'ACTIVE' && (
          <p className="text-sm text-muted-foreground mt-2">
            La caja está inactiva. Activala para poder abrir sesiones.
          </p>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir sesión de caja</DialogTitle>
              <DialogDescription>
                Ingresá el saldo inicial con el que arranca la caja.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Saldo inicial</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={openForm.opening_balance}
                  onChange={(e) =>
                    setOpenForm((f) => ({ ...f, opening_balance: e.target.value }))
                  }
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={openForm.opening_notes}
                  onChange={(e) =>
                    setOpenForm((f) => ({ ...f, opening_notes: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button onClick={handleOpen} disabled={isPending}>
                {isPending ? 'Abriendo...' : 'Abrir sesión'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Sesión #</p>
          <p className="font-semibold">{activeSession.session_number}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estado</p>
          <Badge>{SESSION_STATUS_LABELS[activeSession.status]}</Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Abierta</p>
          <p className="font-medium text-sm">
            {format(new Date(activeSession.opened_at), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Saldo esperado</p>
          <p className="font-semibold">${currentBalance.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => setMvDialog(true)}>
          <Plus className="size-4 mr-1" />
          Nuevo movimiento
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            setCloseForm({
              actual_balance: currentBalance.toFixed(2),
              closing_notes: '',
            });
            setCloseDialog(true);
          }}
        >
          <Lock className="size-4 mr-1" />
          Cerrar sesión
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead className="w-[140px]">Fecha</TableHead>
              <TableHead className="w-[120px] text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Sin movimientos
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m) => {
                const sign = m.type === 'EXPENSE' ? '-' : '+';
                const color =
                  m.type === 'EXPENSE'
                    ? 'text-red-600'
                    : m.type === 'INCOME'
                      ? 'text-green-600'
                      : 'text-muted-foreground';
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {CASH_MOVEMENT_TYPE_LABELS[m.type as keyof typeof CASH_MOVEMENT_TYPE_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell>{m.description}</TableCell>
                    <TableCell className="text-muted-foreground">{m.reference ?? '-'}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(m.date), 'dd/MM HH:mm')}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${color}`}>
                      {sign}${m.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={mvDialog} onOpenChange={setMvDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo movimiento</DialogTitle>
            <DialogDescription>Registrá un ingreso, egreso o ajuste de caja.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={mvForm.type}
                onValueChange={(v) =>
                  setMvForm((f) => ({ ...f, type: v as typeof mvForm.type }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Ingreso</SelectItem>
                  <SelectItem value="EXPENSE">Egreso</SelectItem>
                  <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                value={mvForm.amount}
                onChange={(e) => setMvForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                value={mvForm.description}
                onChange={(e) => setMvForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Referencia (opcional)</Label>
              <Input
                value={mvForm.reference}
                onChange={(e) => setMvForm((f) => ({ ...f, reference: e.target.value }))}
                placeholder="Ticket, factura, etc"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMvDialog(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleNewMovement} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar sesión de caja</DialogTitle>
            <DialogDescription>
              Ingresá el saldo real contado en caja. Si hay diferencia con el esperado, quedará
              registrada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo esperado</span>
                <span className="font-mono font-semibold">${currentBalance.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Saldo real</Label>
              <Input
                type="number"
                step="0.01"
                value={closeForm.actual_balance}
                onChange={(e) =>
                  setCloseForm((f) => ({ ...f, actual_balance: e.target.value }))
                }
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={closeForm.closing_notes}
                onChange={(e) =>
                  setCloseForm((f) => ({ ...f, closing_notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleClose} disabled={isPending}>
              {isPending ? 'Cerrando...' : 'Cerrar sesión'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
