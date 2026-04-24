'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Eye, Pencil, Plus } from 'lucide-react';
import {
  createBankAccount,
  setBankAccountStatus,
  updateBankAccount,
} from '../actions.server';
import {
  BANK_ACCOUNT_STATUS_LABELS,
  BANK_ACCOUNT_TYPE_LABELS,
} from '../../../shared/validators';

interface BankAccountRow {
  id: string;
  bank_name: string;
  account_number: string;
  account_type: keyof typeof BANK_ACCOUNT_TYPE_LABELS;
  cbu: string | null;
  alias: string | null;
  currency: string;
  balance: number;
  status: keyof typeof BANK_ACCOUNT_STATUS_LABELS;
}

export function BankAccountsTable({ items }: { items: BankAccountRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccountRow | null>(null);
  const [form, setForm] = useState({
    bank_name: '',
    account_number: '',
    account_type: 'CHECKING' as BankAccountRow['account_type'],
    cbu: '',
    alias: '',
    currency: 'ARS',
    balance: '0',
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      bank_name: '',
      account_number: '',
      account_type: 'CHECKING',
      cbu: '',
      alias: '',
      currency: 'ARS',
      balance: '0',
    });
    setDialogOpen(true);
  };

  const openEdit = (item: BankAccountRow) => {
    setEditing(item);
    setForm({
      bank_name: item.bank_name,
      account_number: item.account_number,
      account_type: item.account_type,
      cbu: item.cbu ?? '',
      alias: item.alias ?? '',
      currency: item.currency,
      balance: item.balance.toFixed(2),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      const payload = {
        bank_name: form.bank_name.trim(),
        account_number: form.account_number.trim(),
        account_type: form.account_type,
        cbu: form.cbu.trim() || null,
        alias: form.alias.trim() || null,
        currency: form.currency.trim().toUpperCase(),
        balance: form.balance.trim(),
      };
      const result = editing
        ? await updateBankAccount(editing.id, payload)
        : await createBankAccount(payload);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? 'Cuenta actualizada' : 'Cuenta creada');
      setDialogOpen(false);
      router.refresh();
    });
  };

  const handleStatusChange = async (id: string, status: BankAccountRow['status']) => {
    startTransition(async () => {
      const result = await setBankAccountStatus(id, status);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Estado actualizado');
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cuentas bancarias</h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4 mr-1" /> Nueva cuenta
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Banco</TableHead>
              <TableHead>Nº cuenta</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>CBU / Alias</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="w-[130px]">Estado</TableHead>
              <TableHead className="w-[120px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  Sin cuentas bancarias. Creá la primera con &quot;Nueva cuenta&quot;.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className={item.status !== 'ACTIVE' ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">{item.bank_name}</TableCell>
                  <TableCell className="font-mono">{item.account_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{BANK_ACCOUNT_TYPE_LABELS[item.account_type]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.cbu ?? item.alias ?? '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {item.currency} {item.balance.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(v) =>
                        handleStatusChange(item.id, v as BankAccountRow['status'])
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Activa</SelectItem>
                        <SelectItem value="INACTIVE">Inactiva</SelectItem>
                        <SelectItem value="CLOSED">Cerrada</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" asChild title="Ver detalle">
                        <Link href={`/dashboard/treasury/bank-accounts/${item.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(item)}
                        title="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar cuenta' : 'Nueva cuenta'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Modificá los datos de la cuenta.' : 'Creá una nueva cuenta bancaria.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Banco</Label>
              <Input
                value={form.bank_name}
                onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
                placeholder="Banco Galicia"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nº de cuenta</Label>
              <Input
                value={form.account_number}
                onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
                placeholder="1234567890"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.account_type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, account_type: v as BankAccountRow['account_type'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BANK_ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>CBU (opcional)</Label>
              <Input
                value={form.cbu}
                onChange={(e) => setForm((f) => ({ ...f, cbu: e.target.value }))}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Alias (opcional)</Label>
              <Input
                value={form.alias}
                onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
                className="uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{editing ? 'Saldo (solo lectura)' : 'Saldo inicial'}</Label>
              <Input
                type="number"
                step="0.01"
                value={form.balance}
                disabled={!!editing}
                onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
