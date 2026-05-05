'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  createPaymentOrder,
  updatePaymentOrder,
  getPendingPurchaseInvoices,
  getSupplierPaymentMethodsForPaymentOrder,
} from '../actions.server';
import { PAYMENT_METHOD_LABELS } from '../../../shared/validators';

interface Supplier {
  id: string;
  code: string;
  business_name: string;
  tax_id: string;
}

interface CashRegisterOpt {
  id: string;
  code: string;
  name: string;
}

interface BankAccountOpt {
  id: string;
  bank_name: string;
  account_number: string;
}

interface InvoiceOption {
  id: string;
  full_number: string;
  issue_date: Date | string;
  due_date: Date | string | null;
  total: number;
  already_paid: number;
  remaining: number;
}

type PaymentMethod = keyof typeof PAYMENT_METHOD_LABELS;

interface ItemDraft {
  invoice_id: string | null;
  invoice_label: string | null;
  amount: string;
}

interface PaymentDraft {
  payment_method: PaymentMethod;
  amount: string;
  cash_register_id: string | null;
  bank_account_id: string | null;
  supplier_payment_method_id: string | null;
  check_number: string;
  card_last4: string;
  reference: string;
}

interface SupplierPaymentMethodOpt {
  id: string;
  type: 'CHECK' | 'ACCOUNT' | string;
  bank_name: string | null;
  account_holder: string | null;
  account_type: string | null;
  cbu: string | null;
  alias: string | null;
  currency: string | null;
  is_default: boolean;
}

const ACCOUNT_TYPE_SHORT: Record<string, string> = {
  CHECKING: 'CC',
  SAVINGS: 'CA',
};

function describeSupplierMethod(m: SupplierPaymentMethodOpt): string {
  if (m.type === 'CHECK') return 'Acepta cheques';
  const accType = m.account_type ? ACCOUNT_TYPE_SHORT[m.account_type] ?? m.account_type : '';
  const parts = [m.bank_name ?? 'Cuenta bancaria', accType, m.currency].filter(Boolean);
  const tail = m.cbu
    ? `CBU ${m.cbu.slice(-4).padStart(m.cbu.length, '•')}`
    : m.alias
      ? `Alias ${m.alias}`
      : '';
  return tail ? `${parts.join(' · ')} · ${tail}` : parts.join(' · ');
}

function pickDefaultMethodForPaymentMethod(
  methods: SupplierPaymentMethodOpt[],
  pm: PaymentMethod
): string | null {
  const filtered = filterMethodsByPaymentMethod(methods, pm);
  const def = filtered.find((m) => m.is_default);
  return def?.id ?? null;
}

function filterMethodsByPaymentMethod(
  methods: SupplierPaymentMethodOpt[],
  pm: PaymentMethod
): SupplierPaymentMethodOpt[] {
  if (pm === 'TRANSFER') return methods.filter((m) => m.type === 'ACCOUNT');
  if (pm === 'CHECK') return methods.filter((m) => m.type === 'CHECK');
  return [];
}

export interface PaymentOrderEditData {
  id: string;
  supplier_id: string | null;
  date: string;
  scheduled_payment_date: string | null;
  notes: string | null;
  full_number: string;
  items: Array<{
    invoice_id: string | null;
    invoice_label: string | null;
    amount: string;
  }>;
  payments: Array<{
    payment_method: PaymentMethod;
    amount: string;
    cash_register_id: string | null;
    bank_account_id: string | null;
    supplier_payment_method_id: string | null;
    check_number: string;
    card_last4: string;
    reference: string;
  }>;
}

interface Props {
  suppliers: Supplier[];
  cashRegisters: CashRegisterOpt[];
  bankAccounts: BankAccountOpt[];
  initialData?: PaymentOrderEditData;
}

const today = () => new Date().toISOString().slice(0, 10);

function emptyPayment(): PaymentDraft {
  return {
    payment_method: 'CASH',
    amount: '',
    cash_register_id: null,
    bank_account_id: null,
    supplier_payment_method_id: null,
    check_number: '',
    card_last4: '',
    reference: '',
  };
}

export function NewPaymentOrderForm({
  suppliers,
  cashRegisters,
  bankAccounts,
  initialData,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!initialData;

  const [supplierId, setSupplierId] = useState<string>(initialData?.supplier_id ?? '');
  const [date, setDate] = useState(initialData?.date ?? today());
  const [scheduledDate, setScheduledDate] = useState<string>(
    initialData?.scheduled_payment_date ?? ''
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [pendingInvoices, setPendingInvoices] = useState<InvoiceOption[] | null>(null);
  const [supplierPaymentMethods, setSupplierPaymentMethods] = useState<
    SupplierPaymentMethodOpt[]
  >([]);
  const isLoadingInvoices = !!supplierId && pendingInvoices === null;

  const [items, setItems] = useState<ItemDraft[]>(initialData?.items ?? []);
  const [payments, setPayments] = useState<PaymentDraft[]>(
    initialData?.payments ?? [emptyPayment()]
  );

  useEffect(() => {
    if (!supplierId) {
      setSupplierPaymentMethods([]);
      return;
    }
    let cancelled = false;
    Promise.all([
      getPendingPurchaseInvoices(supplierId),
      getSupplierPaymentMethodsForPaymentOrder(supplierId),
    ])
      .then(([invoices, methods]) => {
        if (cancelled) return;
        setPendingInvoices(invoices);
        const opts = methods as SupplierPaymentMethodOpt[];
        setSupplierPaymentMethods(opts);
        // Auto-asignar default por línea según método (sin pisar selección existente)
        setPayments((prev) =>
          prev.map((p) => ({
            ...p,
            supplier_payment_method_id:
              p.supplier_payment_method_id ??
              pickDefaultMethodForPaymentMethod(opts, p.payment_method),
          }))
        );
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [supplierId]);

  const handleSupplierChange = (newId: string) => {
    if (newId !== supplierId) {
      setPendingInvoices(null);
      setSupplierPaymentMethods([]);
      setPayments((prev) =>
        prev.map((p) => ({ ...p, supplier_payment_method_id: null }))
      );
    }
    setSupplierId(newId);
  };

  const itemsTotal = useMemo(
    () => items.reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0),
    [items]
  );
  const paymentsTotal = useMemo(
    () => payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0),
    [payments]
  );
  const diff = Math.round((itemsTotal - paymentsTotal) * 100) / 100;

  const addInvoiceItem = (invoice: InvoiceOption) => {
    if (items.some((i) => i.invoice_id === invoice.id)) {
      toast.info('Esa factura ya está agregada');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        invoice_id: invoice.id,
        invoice_label: invoice.full_number,
        amount: invoice.remaining.toFixed(2),
      },
    ]);
  };

  const addFreeItem = () => {
    setItems((prev) => [...prev, { invoice_id: null, invoice_label: null, amount: '' }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemAmount = (index: number, amount: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, amount } : item)));
  };

  const selectedRemainingTotal = useMemo(() => {
    if (!pendingInvoices) return 0;
    const map = new Map(pendingInvoices.map((inv) => [inv.id, inv.remaining]));
    return items.reduce((acc, it) => {
      if (!it.invoice_id) return acc;
      const remaining = map.get(it.invoice_id);
      return remaining && remaining > 0 ? acc + remaining : acc;
    }, 0);
  }, [items, pendingInvoices]);

  const canLoadPendingBalance = selectedRemainingTotal > 0;

  const handleLoadPendingBalance = () => {
    const total = Math.round(selectedRemainingTotal * 100) / 100;
    if (total <= 0) return;
    const totalStr = total.toFixed(2);
    setPayments((prev) => {
      if (prev.length === 0) {
        return [{ ...emptyPayment(), amount: totalStr }];
      }
      return prev.map((p, i) => (i === 0 ? { ...p, amount: totalStr } : { ...p, amount: '' }));
    });
    toast.success(`Cargado $${totalStr} como monto a pagar.`);
  };

  const addPayment = () => setPayments((prev) => [...prev, emptyPayment()]);
  const removePayment = (index: number) =>
    setPayments((prev) => prev.filter((_, i) => i !== index));
  const updatePayment = (index: number, patch: Partial<PaymentDraft>) =>
    setPayments((prev) =>
      prev.map((p, i) => (i === index ? ({ ...p, ...patch } as PaymentDraft) : p))
    );

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Agregá al menos un ítem');
      return;
    }
    if (payments.length === 0) {
      toast.error('Agregá al menos un pago');
      return;
    }
    if (Math.abs(diff) >= 0.01) {
      toast.error('El total de ítems no coincide con el total de pagos');
      return;
    }

    startTransition(async () => {
      const payload = {
        supplier_id: supplierId || null,
        date,
        scheduled_payment_date: scheduledDate || null,
        notes: notes.trim() || null,
        items: items.map((i) => ({
          invoice_id: i.invoice_id,
          amount: i.amount.trim(),
        })),
        payments: payments.map((p) => ({
          payment_method: p.payment_method,
          amount: p.amount.trim(),
          cash_register_id: p.cash_register_id,
          bank_account_id: p.bank_account_id,
          supplier_payment_method_id: p.supplier_payment_method_id,
          check_number: p.check_number.trim() || null,
          card_last4: p.card_last4.trim() || null,
          reference: p.reference.trim() || null,
        })),
      };

      const result = isEdit && initialData
        ? await updatePaymentOrder(initialData.id, payload)
        : await createPaymentOrder(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? 'Orden de pago actualizada' : 'Orden de pago creada');
      const targetId = isEdit ? initialData!.id : result.data?.id ?? '';
      router.push(`/dashboard/treasury/payment-orders/${targetId}`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/treasury?tab=payment-orders">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? `Editar orden ${initialData?.full_number ?? ''}` : 'Nueva orden de pago'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Proveedor</Label>
            <Select value={supplierId} onValueChange={handleSupplierChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code} — {s.business_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha de pago programada (opcional)</Label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
          <div className="md:col-span-3 space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      {supplierId && (
        <Card>
          <CardHeader>
            <CardTitle>Facturas pendientes del proveedor</CardTitle>
            <CardDescription>Clic en &quot;Agregar&quot; para imputar una factura a esta orden.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingInvoices ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : !pendingInvoices || pendingInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin facturas pendientes.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factura</TableHead>
                      <TableHead>Emisión</TableHead>
                      <TableHead>Vto</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Ya pagado</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvoices.map((inv) => {
                      const added = items.some((i) => i.invoice_id === inv.id);
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono">{inv.full_number}</TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(inv.issue_date), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="text-sm">
                            {inv.due_date ? format(new Date(inv.due_date), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            ${inv.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            ${inv.already_paid.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            ${inv.remaining.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={added ? 'secondary' : 'default'}
                              onClick={() => addInvoiceItem(inv)}
                              disabled={added}
                            >
                              {added ? 'Agregada' : 'Agregar'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Ítems ({items.length})</CardTitle>
            <CardDescription>Importes a pagar — total: ${itemsTotal.toFixed(2)}</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={addFreeItem}>
            <Plus className="size-4 mr-1" />
            Ítem sin factura
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Agregá facturas del listado de arriba o un ítem libre.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura</TableHead>
                    <TableHead className="text-right w-[180px]">Monto</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono">
                        {item.invoice_label ?? (
                          <Badge variant="outline">Sin factura</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updateItemAmount(idx, e.target.value)}
                          className="text-right font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pagos ({payments.length})</CardTitle>
            <CardDescription>Métodos de pago — total: ${paymentsTotal.toFixed(2)}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {canLoadPendingBalance && (
              <Button size="sm" variant="outline" onClick={handleLoadPendingBalance}>
                Cargar saldo pendiente (${selectedRemainingTotal.toFixed(2)})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={addPayment}>
              <Plus className="size-4 mr-1" />
              Agregar pago
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {payments.map((p, idx) => (
            <div key={idx} className="rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pago #{idx + 1}</span>
                {payments.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => removePayment(idx)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Método</Label>
                  <Select
                    value={p.payment_method}
                    onValueChange={(v) => {
                      const newMethod = v as PaymentMethod;
                      updatePayment(idx, {
                        payment_method: newMethod,
                        cash_register_id: null,
                        bank_account_id: null,
                        supplier_payment_method_id: pickDefaultMethodForPaymentMethod(
                          supplierPaymentMethods,
                          newMethod
                        ),
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
                    value={p.amount}
                    onChange={(e) => updatePayment(idx, { amount: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Referencia (opcional)</Label>
                  <Input
                    value={p.reference}
                    onChange={(e) => updatePayment(idx, { reference: e.target.value })}
                  />
                </div>

                {p.payment_method === 'CASH' && (
                  <div className="md:col-span-3 space-y-1.5">
                    <Label>Caja</Label>
                    <Select
                      value={p.cash_register_id ?? ''}
                      onValueChange={(v) => updatePayment(idx, { cash_register_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar caja" />
                      </SelectTrigger>
                      <SelectContent>
                        {cashRegisters.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code} — {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {['TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD'].includes(p.payment_method) && (
                  <div className="md:col-span-3 space-y-1.5">
                    <Label>Cuenta bancaria</Label>
                    <Select
                      value={p.bank_account_id ?? ''}
                      onValueChange={(v) => updatePayment(idx, { bank_account_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.bank_name} — {a.account_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {p.payment_method === 'CHECK' && (
                  <div className="md:col-span-3 space-y-1.5">
                    <Label>Nº de cheque</Label>
                    <Input
                      value={p.check_number}
                      onChange={(e) => updatePayment(idx, { check_number: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                )}

                {(p.payment_method === 'DEBIT_CARD' || p.payment_method === 'CREDIT_CARD') && (
                  <div className="md:col-span-3 space-y-1.5">
                    <Label>Últimos 4 dígitos (opcional)</Label>
                    <Input
                      value={p.card_last4}
                      maxLength={4}
                      onChange={(e) => updatePayment(idx, { card_last4: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                )}

                {(() => {
                  if (supplierPaymentMethods.length === 0) return null;
                  if (
                    p.payment_method !== 'TRANSFER' &&
                    p.payment_method !== 'CHECK'
                  )
                    return null;
                  const filtered = filterMethodsByPaymentMethod(
                    supplierPaymentMethods,
                    p.payment_method
                  );
                  if (filtered.length === 0) return null;
                  return (
                    <div className="md:col-span-3 space-y-1.5">
                      <Label>Destino del proveedor (opcional)</Label>
                      <Select
                        value={p.supplier_payment_method_id ?? '__none__'}
                        onValueChange={(v) =>
                          updatePayment(idx, {
                            supplier_payment_method_id: v === '__none__' ? null : v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Sin destino —</SelectItem>
                          {filtered.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {describeSupplierMethod(m)}
                              {m.is_default ? ' (Predeterminado)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="text-sm">
            <div className="flex gap-6">
              <div>
                <span className="text-muted-foreground">Total ítems:</span>{' '}
                <span className="font-mono font-semibold">${itemsTotal.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total pagos:</span>{' '}
                <span className="font-mono font-semibold">${paymentsTotal.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Diferencia:</span>{' '}
                <span
                  className={`font-mono font-semibold ${
                    Math.abs(diff) < 0.01 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ${diff.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isPending || Math.abs(diff) >= 0.01}>
            {isPending
              ? isEdit
                ? 'Guardando...'
                : 'Creando...'
              : isEdit
                ? 'Guardar cambios'
                : 'Crear orden'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
