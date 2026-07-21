'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Separator } from '@/shared/components/ui/separator';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { receiptSchema } from '@/modules/sales/shared/validators';
import {
  PAYMENT_METHOD_LABELS,
  WITHHOLDING_TAX_TYPE_LABELS,
  VOUCHER_TYPE_LABELS,
} from '@/modules/sales/shared/types';
import { formatCurrencyARS, formatDateUTC } from '@/shared/lib/utils/formatters';
import { fetchCustomers } from '@/modules/commercial/features/customers/actions.server';
import {
  createReceipt,
  updateReceipt,
  getReceiptById,
  getPendingInvoicesForCustomer,
} from '../actions.server';

type PaymentMethod = 'CASH' | 'CHECK' | 'ECHEQ' | 'TRANSFER' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'OTHER';
type WithholdingType = 'IVA' | 'GANANCIAS' | 'IIBB' | 'SUSS' | 'OTHER';

interface ItemForm {
  invoice_id: string;
  amount: string;
}
interface PaymentForm {
  payment_method: PaymentMethod;
  amount: string;
  reference: string;
  check_number: string;
  check_bank: string;
  check_due_date: string;
  notes: string;
}
interface WithholdingForm {
  tax_type: WithholdingType;
  rate: string;
  amount: string;
  certificate_number: string;
}
interface FormValues {
  customer_id: string;
  date: string;
  notes: string;
  items: ItemForm[];
  payments: PaymentForm[];
  withholdings: WithholdingForm[];
}

interface PendingInvoice {
  id: string;
  full_number: string | null;
  voucher_type: string;
  total: number;
  issue_date: string | Date | null;
  due_date: string | Date | null;
  outstanding: number;
}

interface CustomerOption {
  value: string;
  label: string;
}

interface CreateReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el modal edita ese recibo (solo borradores); si no, crea uno nuevo. */
  receiptId?: string | null;
  onSuccess?: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function toISODate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const emptyDefaults: FormValues = {
  customer_id: '',
  date: todayISO(),
  notes: '',
  items: [],
  payments: [],
  withholdings: [],
};

export function CreateReceiptModal({
  open,
  onOpenChange,
  receiptId = null,
  onSuccess,
}: CreateReceiptModalProps) {
  const isEditMode = Boolean(receiptId);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    // El schema coacciona strings->number; casteamos el resolver para conservar
    // los tipos de formulario (strings en los inputs).
    resolver: zodResolver(receiptSchema) as never,
    defaultValues: emptyDefaults,
  });

  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment,
  } = useFieldArray({ control: form.control, name: 'payments' });

  const {
    fields: withholdingFields,
    append: appendWithholding,
    remove: removeWithholding,
  } = useFieldArray({ control: form.control, name: 'withholdings' });

  const items = form.watch('items');
  const selectedCustomerId = form.watch('customer_id');

  // Carga de clientes al abrir.
  useEffect(() => {
    if (!open) return;
    fetchCustomers()
      .then((data) =>
        setCustomers(
          (data ?? []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))
        )
      )
      .catch((e) => console.error('Error cargando clientes:', e));
  }, [open]);

  // Reset / carga inicial al abrir.
  useEffect(() => {
    if (!open) return;

    if (!receiptId) {
      form.reset(emptyDefaults);
      setPendingInvoices([]);
      return;
    }

    setLoadingReceipt(true);
    getReceiptById(receiptId)
      .then(async (receipt) => {
        if (!receipt) {
          toast.error('No se pudo cargar el recibo');
          onOpenChange(false);
          return;
        }
        const loadedItems: ItemForm[] = receipt.items.map((it) => ({
          invoice_id: it.invoice_id,
          amount: String(it.amount),
        }));
        form.reset({
          customer_id: receipt.customer_id,
          date: toISODate(receipt.date),
          notes: receipt.notes ?? '',
          items: loadedItems,
          payments: receipt.payments.map((p) => ({
            payment_method: p.payment_method as PaymentMethod,
            amount: String(p.amount),
            reference: p.reference ?? '',
            check_number: p.check_number ?? '',
            check_bank: p.check_bank ?? '',
            check_due_date: toISODate(p.check_due_date),
            notes: p.notes ?? '',
          })),
          withholdings: receipt.withholdings.map((w) => ({
            tax_type: w.tax_type as WithholdingType,
            rate: w.rate != null ? String(w.rate) : '',
            amount: String(w.amount),
            certificate_number: w.certificate_number ?? '',
          })),
        });

        // Facturas pendientes + las ya aplicadas por el recibo (aunque ya no figuren pendientes).
        const pending = await loadPendingInvoices(receipt.customer_id);
        const missing: PendingInvoice[] = receipt.items
          .filter((it) => it.invoice && !pending.some((p) => p.id === it.invoice_id))
          .map((it) => ({
            id: it.invoice_id,
            full_number: it.invoice?.full_number ?? null,
            voucher_type: it.invoice?.voucher_type ?? '',
            total: it.invoice?.total ?? 0,
            issue_date: null,
            due_date: null,
            outstanding: Math.max(it.invoice?.total ?? 0, Number(it.amount)),
          }));
        setPendingInvoices([...pending, ...missing]);
      })
      .catch((e) => {
        console.error('Error cargando recibo:', e);
        toast.error('No se pudo cargar el recibo');
      })
      .finally(() => setLoadingReceipt(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, receiptId]);

  async function loadPendingInvoices(customerId: string): Promise<PendingInvoice[]> {
    setLoadingInvoices(true);
    try {
      const data = (await getPendingInvoicesForCustomer(customerId)) as PendingInvoice[];
      setPendingInvoices(data);
      return data;
    } catch (e) {
      console.error('Error cargando facturas pendientes:', e);
      setPendingInvoices([]);
      return [];
    } finally {
      setLoadingInvoices(false);
    }
  }

  const handleCustomerChange = (customerId: string) => {
    form.setValue('customer_id', customerId);
    form.setValue('items', []);
    if (customerId) {
      loadPendingInvoices(customerId);
    } else {
      setPendingInvoices([]);
    }
  };

  const isInvoiceChecked = (invoiceId: string) => items.some((it) => it.invoice_id === invoiceId);
  const itemIndex = (invoiceId: string) => items.findIndex((it) => it.invoice_id === invoiceId);

  const toggleInvoice = (invoice: PendingInvoice, checked: boolean) => {
    const current = form.getValues('items');
    if (checked) {
      if (current.some((it) => it.invoice_id === invoice.id)) return;
      form.setValue('items', [
        ...current,
        { invoice_id: invoice.id, amount: invoice.outstanding.toFixed(2) },
      ]);
    } else {
      form.setValue(
        'items',
        current.filter((it) => it.invoice_id !== invoice.id)
      );
    }
  };

  const handleAmountChange = (invoice: PendingInvoice, raw: string) => {
    const idx = itemIndex(invoice.id);
    if (idx === -1) return;
    let value = raw;
    const num = Number(raw);
    if (!Number.isNaN(num) && num > invoice.outstanding) {
      value = invoice.outstanding.toFixed(2);
    }
    form.setValue(`items.${idx}.amount`, value, { shouldValidate: true });
  };

  const totalReceipt = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0),
    [items]
  );

  const addPayment = () =>
    appendPayment({
      payment_method: 'CASH',
      amount: '',
      reference: '',
      check_number: '',
      check_bank: '',
      check_due_date: '',
      notes: '',
    });

  const addWithholding = () =>
    appendWithholding({ tax_type: 'IVA', rate: '', amount: '', certificate_number: '' });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        customer_id: values.customer_id,
        date: values.date,
        notes: values.notes || undefined,
        items: values.items.map((it) => ({
          invoice_id: it.invoice_id,
          amount: Number(it.amount),
        })),
        payments: values.payments.map((p) => ({
          payment_method: p.payment_method,
          amount: Number(p.amount),
          reference: p.reference || undefined,
          check_number: p.check_number || undefined,
          check_bank: p.check_bank || undefined,
          check_due_date: p.check_due_date || undefined,
          notes: p.notes || undefined,
        })),
        withholdings: values.withholdings.map((w) => ({
          tax_type: w.tax_type,
          rate: w.rate !== '' ? Number(w.rate) : null,
          amount: Number(w.amount),
          certificate_number: w.certificate_number || undefined,
        })),
      };

      const result = isEditMode
        ? await updateReceipt(receiptId as string, payload)
        : await createReceipt(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEditMode ? 'Recibo actualizado' : 'Recibo creado');
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar el recibo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto md:min-w-[820px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar recibo de cobro' : 'Nuevo recibo de cobro'}</DialogTitle>
        </DialogHeader>

        {loadingReceipt ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Datos básicos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Datos básicos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente *</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={customers}
                            value={field.value}
                            onValueChange={handleCustomerChange}
                            placeholder="Seleccionar cliente"
                            searchPlaceholder="Buscar cliente..."
                            emptyMessage="No hay clientes disponibles"
                            disabled={isEditMode}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Observaciones opcionales" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Facturas a cobrar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Facturas a cobrar</CardTitle>
                  <CardDescription>
                    Tildá las facturas pendientes y ajustá el importe aplicado a cada una.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!selectedCustomerId && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Seleccioná un cliente para ver sus facturas pendientes.
                      </AlertDescription>
                    </Alert>
                  )}

                  {selectedCustomerId && loadingInvoices && <Skeleton className="h-20 w-full" />}

                  {selectedCustomerId && !loadingInvoices && pendingInvoices.length === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        El cliente no tiene facturas pendientes de cobro.
                      </AlertDescription>
                    </Alert>
                  )}

                  {pendingInvoices.map((invoice) => {
                    const checked = isInvoiceChecked(invoice.id);
                    const idx = itemIndex(invoice.id);
                    return (
                      <div
                        key={invoice.id}
                        className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => toggleInvoice(invoice, Boolean(v))}
                            className="mt-1"
                          />
                          <div>
                            <div className="text-sm font-medium">
                              {invoice.full_number}{' '}
                              <span className="text-xs text-muted-foreground">
                                ({VOUCHER_TYPE_LABELS[invoice.voucher_type] ?? invoice.voucher_type})
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {invoice.issue_date ? `Emisión: ${formatDateUTC(invoice.issue_date)} · ` : ''}
                              Saldo: {formatCurrencyARS(invoice.outstanding)}
                            </div>
                          </div>
                        </div>

                        {checked && idx !== -1 && (
                          <div className="w-full sm:w-48">
                            <label className="text-xs text-muted-foreground">Importe aplicado</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max={invoice.outstanding}
                              value={items[idx]?.amount ?? ''}
                              onChange={(e) => handleAmountChange(invoice, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {form.formState.errors.items && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.items.message as string}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Medios de pago (informativos) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Medios de pago</CardTitle>
                      <CardDescription>
                        Informativos: no impactan en caja ni banco.
                      </CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addPayment}>
                      <Plus className="mr-2 h-4 w-4" /> Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentFields.length === 0 && (
                    <p className="py-2 text-center text-sm text-muted-foreground">
                      Sin medios de pago cargados.
                    </p>
                  )}

                  {paymentFields.map((field, index) => {
                    const method = form.watch(`payments.${index}.payment_method`);
                    const isCheck = method === 'CHECK' || method === 'ECHEQ';
                    return (
                      <div key={field.id} className="space-y-3 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Pago {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePayment(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`payments.${index}.payment_method`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Medio *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`payments.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Importe *</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {isCheck && (
                          <div className="grid gap-4 rounded-md border bg-muted/30 p-3 sm:grid-cols-3">
                            <FormField
                              control={form.control}
                              name={`payments.${index}.check_number`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Número</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123456" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`payments.${index}.check_bank`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Banco</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Banco Nación" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`payments.${index}.check_due_date`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vencimiento</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}

                        <FormField
                          control={form.control}
                          name={`payments.${index}.reference`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Referencia</FormLabel>
                              <FormControl>
                                <Input placeholder="Opcional" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Retenciones */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Retenciones</CardTitle>
                      <CardDescription>Retenciones sufridas informadas por el cliente.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addWithholding}>
                      <Plus className="mr-2 h-4 w-4" /> Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {withholdingFields.length === 0 && (
                    <p className="py-2 text-center text-sm text-muted-foreground">
                      Sin retenciones cargadas.
                    </p>
                  )}

                  {withholdingFields.map((field, index) => (
                    <div key={field.id} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Retención {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeWithholding(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4">
                        <FormField
                          control={form.control}
                          name={`withholdings.${index}.tax_type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(WITHHOLDING_TAX_TYPE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`withholdings.${index}.rate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Alícuota %</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`withholdings.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Importe *</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`withholdings.${index}.certificate_number`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>N° certificado</FormLabel>
                              <FormControl>
                                <Input placeholder="Opcional" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Total */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
                <span className="text-sm font-medium">Total del recibo</span>
                <span className="text-lg font-bold">{formatCurrencyARS(totalReceipt)}</span>
              </div>

              <Separator />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear recibo'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
