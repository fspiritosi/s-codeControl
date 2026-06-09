'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { getAvailableChecksForPaymentOrder } from '../actions.server';
import { createCheck } from '@/modules/treasury/features/checks/actions.server';

type CheckKind = 'OWN' | 'THIRD_PARTY';

interface AvailableCheck {
  id: string;
  check_number: string;
  bank_name: string;
  amount: number;
  issue_date: Date | string;
  due_date: Date | string;
  drawer_name: string;
}

interface Props {
  checkKind: CheckKind | null;
  checkId: string | null;
  currentOrderId?: string;
  onChange: (patch: { check_kind?: CheckKind | null; check_id?: string | null; check_number?: string }) => void;
}

const fmtDate = (d: Date | string) => format(new Date(d), 'dd/MM/yyyy');

function describeCheck(c: AvailableCheck) {
  return `N° ${c.check_number} · ${c.bank_name} · ${formatCurrencyARS(c.amount)} · vto ${fmtDate(c.due_date)}`;
}

const emptyNewCheck = {
  check_number: '',
  bank_name: '',
  amount: '',
  issue_date: '',
  due_date: '',
  drawer_name: '',
  branch: '',
  account_number: '',
};

export function CheckPaymentField({ checkKind, checkId, currentOrderId, onChange }: Props) {
  const [checks, setChecks] = useState<AvailableCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCheck, setNewCheck] = useState({ ...emptyNewCheck });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChecks = useCallback(
    async (kind: CheckKind) => {
      setLoading(true);
      try {
        const data = (await getAvailableChecksForPaymentOrder(kind, currentOrderId)) as AvailableCheck[];
        setChecks(data);
      } catch (e) {
        console.error(e);
        setChecks([]);
      } finally {
        setLoading(false);
      }
    },
    [currentOrderId]
  );

  useEffect(() => {
    if (checkKind) loadChecks(checkKind);
    else setChecks([]);
  }, [checkKind, loadChecks]);

  const handleKindChange = (value: CheckKind) => {
    // Cambiar tipo limpia el cheque seleccionado.
    onChange({ check_kind: value, check_id: null, check_number: '' });
  };

  const handleSelectCheck = (id: string) => {
    const chk = checks.find((c) => c.id === id);
    onChange({ check_id: id, check_number: chk?.check_number ?? '' });
  };

  const handleCreateOwnCheck = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await createCheck({
        type: 'OWN',
        check_number: newCheck.check_number,
        bank_name: newCheck.bank_name,
        branch: newCheck.branch || null,
        account_number: newCheck.account_number || null,
        amount: newCheck.amount,
        issue_date: newCheck.issue_date,
        due_date: newCheck.due_date,
        drawer_name: newCheck.drawer_name,
        drawer_tax_id: null,
        payee_name: null,
        customer_id: null,
        supplier_id: null,
        notes: null,
      });
      if (res.error || !res.data) {
        setError(res.error ?? 'No se pudo crear el cheque');
        return;
      }
      await loadChecks('OWN');
      onChange({ check_id: res.data.id, check_number: res.data.check_number });
      setDialogOpen(false);
      setNewCheck({ ...emptyNewCheck });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="md:col-span-3 space-y-3 rounded-md border p-3 bg-muted/30">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipo de cheque</Label>
          <Select value={checkKind ?? undefined} onValueChange={(v) => handleKindChange(v as CheckKind)}>
            <SelectTrigger>
              <SelectValue placeholder="Propio o de tercero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OWN">Propio</SelectItem>
              <SelectItem value="THIRD_PARTY">De tercero</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {checkKind && (
          <div className="space-y-1.5">
            <Label>Cheque {checkKind === 'THIRD_PARTY' ? 'de cartera' : 'propio'}</Label>
            <Select value={checkId ?? undefined} onValueChange={handleSelectCheck} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? 'Cargando…' : 'Seleccioná un cheque'} />
              </SelectTrigger>
              <SelectContent>
                {checks.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No hay cheques disponibles en cartera
                  </div>
                )}
                {checks.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {describeCheck(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {checkKind === 'OWN' && (
        <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Cargar nuevo cheque propio
        </Button>
      )}
      {checkKind === 'THIRD_PARTY' && checks.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground">
          Los cheques de tercero se cargan al recibirlos desde el módulo de Cheques.
        </p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cargar cheque propio</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>N° de cheque *</Label>
              <Input
                value={newCheck.check_number}
                onChange={(e) => setNewCheck((s) => ({ ...s, check_number: e.target.value }))}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Banco *</Label>
              <Input
                value={newCheck.bank_name}
                onChange={(e) => setNewCheck((s) => ({ ...s, bank_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Importe *</Label>
              <Input
                inputMode="decimal"
                value={newCheck.amount}
                onChange={(e) => setNewCheck((s) => ({ ...s, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Librador *</Label>
              <Input
                value={newCheck.drawer_name}
                onChange={(e) => setNewCheck((s) => ({ ...s, drawer_name: e.target.value }))}
                placeholder="Titular de la cuenta"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Emisión *</Label>
              <Input
                type="date"
                value={newCheck.issue_date}
                onChange={(e) => setNewCheck((s) => ({ ...s, issue_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vencimiento *</Label>
              <Input
                type="date"
                value={newCheck.due_date}
                onChange={(e) => setNewCheck((s) => ({ ...s, due_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sucursal</Label>
              <Input
                value={newCheck.branch}
                onChange={(e) => setNewCheck((s) => ({ ...s, branch: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>N° de cuenta</Label>
              <Input
                value={newCheck.account_number}
                onChange={(e) => setNewCheck((s) => ({ ...s, account_number: e.target.value }))}
              />
            </div>
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateOwnCheck} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cheque'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
