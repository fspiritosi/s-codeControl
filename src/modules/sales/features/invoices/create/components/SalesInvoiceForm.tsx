'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { salesInvoiceSchema } from '@/modules/sales/shared/validators';
import { VOUCHER_TYPE_LABELS, isNoteVoucherType } from '@/modules/sales/shared/types';
import {
  createSalesInvoice,
  updateSalesInvoice,
  getCustomerInvoicesForNote,
} from '@/modules/sales/features/invoices/list/actions.server';
import { getCustomerServiceItems } from '@/modules/sales/features/invoices/create/actions.server';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

type FormValues = z.infer<typeof salesInvoiceSchema>;

type LineField = {
  service_item_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  discount_type?: 'PERCENTAGE' | 'FIXED' | null;
  discount_value?: number | null;
};

type ServiceItemOpt = {
  id: string;
  item_name: string;
  item_description: string;
  item_price: number;
  unit: string;
  service_name: string;
};

interface PerceptionTypeOpt {
  id: string;
  code: string;
  name: string;
  default_rate: number;
  calculation_base: 'NET' | 'TOTAL' | 'VAT';
}

export type SalesInvoiceInitialData = {
  id: string;
  customer_id: string;
  point_of_sale_id: string;
  voucher_type: string;
  issue_date: string;
  due_date: string;
  cae: string;
  cae_expiry_date: string;
  currency: string;
  exchange_rate: number;
  notes: string;
  original_invoice_id: string | null;
  global_discount_type: 'PERCENTAGE' | 'FIXED' | null;
  global_discount_value: number | null;
  lines: LineField[];
  perceptions: { tax_type_id: string; base_amount: number; rate: number; amount: number; notes: string }[];
  other_charges: { description: string; amount: number }[];
};

interface Props {
  customers: { id: string; name: string; tax_id?: string | null }[];
  pointsOfSale: { id: string; number: number; name: string }[];
  perceptionTypes: PerceptionTypeOpt[];
  initialData?: SalesInvoiceInitialData;
}

const emptyLine: LineField = {
  service_item_id: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  vat_rate: 21,
  discount_type: null,
  discount_value: null,
};

export default function SalesInvoiceForm({ customers, pointsOfSale, perceptionTypes, initialData }: Props) {
  const router = useRouter();
  const isEditMode = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(salesInvoiceSchema),
    defaultValues: initialData
      ? {
          customer_id: initialData.customer_id,
          point_of_sale_id: initialData.point_of_sale_id,
          voucher_type: initialData.voucher_type as any,
          issue_date: initialData.issue_date,
          due_date: initialData.due_date,
          cae: initialData.cae,
          cae_expiry_date: initialData.cae_expiry_date,
          currency: (initialData.currency as 'ARS' | 'USD') ?? 'ARS',
          exchange_rate: initialData.exchange_rate ?? 1,
          notes: initialData.notes,
          original_invoice_id: initialData.original_invoice_id ?? null,
          global_discount_type: initialData.global_discount_type,
          global_discount_value: initialData.global_discount_value,
          lines: initialData.lines.length > 0 ? initialData.lines : [{ ...emptyLine }],
          perceptions: initialData.perceptions,
          other_charges: initialData.other_charges || [],
        }
      : {
          customer_id: '',
          point_of_sale_id: pointsOfSale[0]?.id ?? '',
          voucher_type: 'FACTURA_A',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: '',
          cae: '',
          cae_expiry_date: '',
          currency: 'ARS',
          exchange_rate: 1,
          notes: '',
          original_invoice_id: null,
          global_discount_type: null,
          global_discount_value: null,
          lines: [{ ...emptyLine }],
          perceptions: [],
          other_charges: [],
        },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' });
  const {
    fields: perceptionFields,
    append: appendPerception,
    remove: removePerception,
  } = useFieldArray({ control: form.control, name: 'perceptions' });
  const {
    fields: otherChargeFields,
    append: appendOtherCharge,
    remove: removeOtherCharge,
  } = useFieldArray({ control: form.control, name: 'other_charges' });

  const watchedLines = useWatch({ control: form.control, name: 'lines' });
  const watchedPerceptions = useWatch({ control: form.control, name: 'perceptions' });
  const watchedOtherCharges = useWatch({ control: form.control, name: 'other_charges' });
  const watchedCustomer = useWatch({ control: form.control, name: 'customer_id' });
  const watchedVoucherType = useWatch({ control: form.control, name: 'voucher_type' });
  const globalDiscountType = useWatch({ control: form.control, name: 'global_discount_type' });
  const globalDiscountValue = useWatch({ control: form.control, name: 'global_discount_value' });

  const isNote = isNoteVoucherType(watchedVoucherType as string);
  const [noteInvoices, setNoteInvoices] = useState<
    { id: string; full_number: string | null; voucher_type: string; total: number }[]
  >([]);

  // Cargar facturas confirmadas del cliente para asociar una NC/ND.
  useEffect(() => {
    if (isNote && watchedCustomer) {
      getCustomerInvoicesForNote(watchedCustomer)
        .then((invs) => setNoteInvoices(invs as any))
        .catch(() => setNoteInvoices([]));
    } else {
      setNoteInvoices([]);
    }
  }, [isNote, watchedCustomer]);

  // Ítems de los servicios del cliente elegido, para las líneas de la factura.
  const [serviceItems, setServiceItems] = useState<ServiceItemOpt[]>([]);
  useEffect(() => {
    if (watchedCustomer) {
      getCustomerServiceItems(watchedCustomer)
        .then((items) => setServiceItems(items as ServiceItemOpt[]))
        .catch(() => setServiceItems([]));
    } else {
      setServiceItems([]);
    }
  }, [watchedCustomer]);

  const totals = useMemo(() => {
    const gType = globalDiscountType;
    const gValue = Number(globalDiscountValue) || 0;

    let subtotalBruto = 0;
    let lineDiscounts = 0;
    let vatAmount = 0;

    for (const l of watchedLines || []) {
      const bruto = (l.quantity || 0) * (l.unit_price || 0);
      const dType = l.discount_type;
      const dValue = Number(l.discount_value) || 0;
      const disc = dType === 'PERCENTAGE' ? (bruto * dValue) / 100 : dType === 'FIXED' ? dValue : 0;
      const neto = bruto - disc;
      subtotalBruto += bruto;
      lineDiscounts += disc;
      vatAmount += neto * ((l.vat_rate || 0) / 100);
    }

    const subtotalAfterLines = subtotalBruto - lineDiscounts;
    const globalDiscount =
      gType === 'PERCENTAGE'
        ? (subtotalAfterLines * gValue) / 100
        : gType === 'FIXED'
          ? gValue
          : 0;

    if (globalDiscount > 0 && subtotalAfterLines > 0) {
      vatAmount = 0;
      for (const l of watchedLines || []) {
        const bruto = (l.quantity || 0) * (l.unit_price || 0);
        const dType = l.discount_type;
        const dValue = Number(l.discount_value) || 0;
        const disc = dType === 'PERCENTAGE' ? (bruto * dValue) / 100 : dType === 'FIXED' ? dValue : 0;
        const neto = bruto - disc;
        const proportion = neto / subtotalAfterLines;
        const netAfterGlobal = neto - globalDiscount * proportion;
        vatAmount += netAfterGlobal * ((l.vat_rate || 0) / 100);
      }
    }

    const subtotal = subtotalAfterLines - globalDiscount;
    const otherTaxes = (watchedPerceptions || []).reduce(
      (acc: number, p: any) => acc + (Number(p?.amount) || 0),
      0
    );
    const otherChargesTotal = (watchedOtherCharges || []).reduce(
      (acc: number, oc: any) => acc + (Number(oc?.amount) || 0),
      0
    );

    return {
      subtotalBruto,
      lineDiscounts,
      globalDiscount,
      subtotal,
      vatAmount,
      otherTaxes,
      otherChargesTotal,
      total: subtotal + vatAmount + otherTaxes + otherChargesTotal,
    };
  }, [watchedLines, watchedPerceptions, watchedOtherCharges, globalDiscountType, globalDiscountValue]);

  const handlePerceptionTypeChange = (index: number, taxTypeId: string) => {
    const t = perceptionTypes.find((p) => p.id === taxTypeId);
    if (!t) return;
    const base =
      t.calculation_base === 'NET'
        ? totals.subtotal
        : t.calculation_base === 'VAT'
          ? totals.vatAmount
          : totals.subtotal + totals.vatAmount;
    const amount = Math.round(base * (t.default_rate / 100) * 1000) / 1000;
    form.setValue(`perceptions.${index}.tax_type_id`, taxTypeId);
    form.setValue(`perceptions.${index}.base_amount`, Math.round(base * 1000) / 1000);
    form.setValue(`perceptions.${index}.rate`, t.default_rate);
    form.setValue(`perceptions.${index}.amount`, amount);
  };

  const recalcPerceptionAmount = (index: number) => {
    const p = form.getValues(`perceptions.${index}`);
    const base = Number(p?.base_amount) || 0;
    const rate = Number(p?.rate) || 0;
    const amount = Math.round(base * (rate / 100) * 1000) / 1000;
    form.setValue(`perceptions.${index}.amount`, amount);
  };

  const handleServiceItemSelect = (index: number, serviceItemId: string) => {
    const item = serviceItems.find((s) => s.id === serviceItemId);
    if (item) {
      form.setValue(
        `lines.${index}.description`,
        item.item_description ? `${item.item_name} — ${item.item_description}` : item.item_name
      );
      form.setValue(`lines.${index}.unit_price`, item.item_price);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const sanitizedLines = (values.lines as LineField[]).map((l) => ({
      service_item_id: l.service_item_id || undefined,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
      vat_rate: l.vat_rate,
      discount_type: l.discount_type || undefined,
      discount_value: l.discount_value != null ? l.discount_value : undefined,
    }));
    const sanitizedPerceptions = (values.perceptions || []).map((p) => ({
      tax_type_id: p.tax_type_id,
      base_amount: Number(p.base_amount) || 0,
      rate: Number(p.rate) || 0,
      amount: Number(p.amount) || 0,
      notes: p.notes,
    }));
    const sanitizedOtherCharges = (values.other_charges || []).map((oc) => ({
      description: oc.description,
      amount: Number(oc.amount) || 0,
    }));

    const payload = {
      customer_id: values.customer_id,
      point_of_sale_id: values.point_of_sale_id,
      voucher_type: values.voucher_type,
      issue_date: values.issue_date,
      due_date: values.due_date || undefined,
      cae: values.cae || undefined,
      cae_expiry_date: values.cae_expiry_date || undefined,
      currency: values.currency,
      exchange_rate: values.currency === 'ARS' ? 1 : Number(values.exchange_rate) || 1,
      notes: values.notes || undefined,
      original_invoice_id: isNote ? values.original_invoice_id || null : null,
      global_discount_type: values.global_discount_type || undefined,
      global_discount_value: values.global_discount_value != null ? values.global_discount_value : undefined,
      lines: sanitizedLines,
      perceptions: sanitizedPerceptions,
      other_charges: sanitizedOtherCharges,
    };

    toast.promise(
      async () => {
        if (isEditMode) {
          const result = await updateSalesInvoice(initialData!.id, payload as any);
          if (result.error) throw new Error(result.error);
          router.push(`/dashboard/sales/invoices/${initialData!.id}`);
          router.refresh();
        } else {
          const result = await createSalesInvoice(payload as any);
          if (result.error || !result.data) throw new Error(result.error || 'Error creando la factura');
          router.push(`/dashboard/sales/invoices/${result.data.id}`);
          router.refresh();
        }
      },
      {
        loading: isEditMode ? 'Guardando cambios...' : 'Creando factura...',
        success: isEditMode ? 'Factura actualizada' : 'Factura creada',
        error: (e) => e?.message || 'Error',
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos del comprobante</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel>Cliente *</FormLabel>
                  <SearchableSelect
                    options={customers.map((c) => ({ value: c.id, label: c.name }))}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Seleccionar cliente"
                    searchPlaceholder="Buscar cliente..."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="voucher_type"
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
                      {Object.entries(VOUCHER_TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
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
              name="point_of_sale_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Punto de venta *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pointsOfSale.length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No hay puntos de venta configurados
                        </div>
                      )}
                      {pointsOfSale.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {String(pos.number).padStart(5, '0')} — {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isNote && (
              <FormField
                control={form.control}
                name="original_invoice_id"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Factura asociada *</FormLabel>
                    <Select onValueChange={field.onChange} value={(field.value as string) ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={watchedCustomer ? 'Seleccioná la factura' : 'Elegí primero el cliente'}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {noteInvoices.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No hay facturas confirmadas del cliente
                          </div>
                        )}
                        {noteInvoices.map((inv) => (
                          <SelectItem key={inv.id} value={inv.id}>
                            {(VOUCHER_TYPE_LABELS[inv.voucher_type] ?? inv.voucher_type)} {inv.full_number ?? ''} — $
                            {inv.total.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="issue_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha emisión *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="due_date"
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
            <FormField
              control={form.control}
              name="cae"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CAE</FormLabel>
                  <FormControl>
                    <Input placeholder="CAE" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cae_expiry_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vto. CAE</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      if (v === 'ARS') form.setValue('exchange_rate', 1);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ARS">Peso (ARS)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch('currency') === 'USD' && (
              <FormField
                control={form.control}
                name="exchange_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de cambio (ARS por USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        min="0"
                        placeholder="1200.0000"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Líneas</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyLine })}>
              <Plus className="size-4 mr-1" /> Agregar línea
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Servicio / Ítem</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-[90px]">Cant.</TableHead>
                  <TableHead className="w-[110px]">Precio</TableHead>
                  <TableHead className="w-[70px]">IVA%</TableHead>
                  <TableHead className="w-[70px]">Dto.</TableHead>
                  <TableHead className="w-[90px]">Valor dto.</TableHead>
                  <TableHead className="w-[110px] text-right">Neto</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const bruto =
                    (watchedLines?.[index]?.quantity || 0) * (watchedLines?.[index]?.unit_price || 0);
                  const dType = form.watch(`lines.${index}.discount_type`);
                  const dValue = Number(form.watch(`lines.${index}.discount_value`)) || 0;
                  const descuento =
                    dType === 'PERCENTAGE' ? (bruto * dValue) / 100 : dType === 'FIXED' ? dValue : 0;
                  const lineNeto = bruto - descuento;
                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <SearchableSelect
                          options={serviceItems.map((s) => ({
                            value: s.id,
                            label: s.service_name ? `${s.item_name} (${s.service_name})` : s.item_name,
                          }))}
                          value={form.watch(`lines.${index}.service_item_id`) || ''}
                          onValueChange={(v) => {
                            form.setValue(`lines.${index}.service_item_id`, v);
                            handleServiceItemSelect(index, v);
                          }}
                          placeholder={watchedCustomer ? 'Seleccionar ítem' : 'Elegí un cliente primero'}
                          searchPlaceholder="Buscar ítem de servicio..."
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 text-sm" {...form.register(`lines.${index}.description`)} />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          step="1"
                          min="1"
                          {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          step="0.001"
                          {...form.register(`lines.${index}.unit_price`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          step="0.5"
                          {...form.register(`lines.${index}.vat_rate`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={dType || '_none'}
                          onValueChange={(v) => {
                            const val = v === '_none' ? null : (v as 'PERCENTAGE' | 'FIXED');
                            form.setValue(`lines.${index}.discount_type`, val);
                            if (!val) form.setValue(`lines.${index}.discount_value`, null);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs w-[70px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">-</SelectItem>
                            <SelectItem value="PERCENTAGE">%</SelectItem>
                            <SelectItem value="FIXED">$</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          className={`h-8 text-sm w-[90px] ${!dType ? 'hidden' : ''}`}
                          type="number"
                          step="0.001"
                          {...form.register(`lines.${index}.discount_value`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">${lineNeto.toFixed(2)}</TableCell>
                      <TableCell>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-sm font-medium">Descuento global</span>
              <Select
                value={globalDiscountType || '_none'}
                onValueChange={(v) => {
                  const val = v === '_none' ? null : (v as 'PERCENTAGE' | 'FIXED');
                  form.setValue('global_discount_type', val);
                  if (!val) form.setValue('global_discount_value', null);
                }}
              >
                <SelectTrigger className="h-8 text-xs w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">-</SelectItem>
                  <SelectItem value="PERCENTAGE">%</SelectItem>
                  <SelectItem value="FIXED">$</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className={`h-8 text-sm w-[120px] ${!globalDiscountType ? 'hidden' : ''}`}
                type="number"
                step="0.01"
                {...form.register('global_discount_value', { valueAsNumber: true })}
              />
              {totals.globalDiscount > 0 && (
                <span className="text-sm font-mono text-destructive">-${totals.globalDiscount.toFixed(2)}</span>
              )}
            </div>

            <div className="flex justify-end mt-4 text-sm">
              <div className="text-right space-y-1">
                <p>
                  Subtotal bruto: <span className="font-mono font-medium">${totals.subtotalBruto.toFixed(2)}</span>
                </p>
                {(totals.lineDiscounts > 0 || totals.globalDiscount > 0) && (
                  <p>
                    Descuentos:{' '}
                    <span className="font-mono font-medium text-destructive">
                      -${(totals.lineDiscounts + totals.globalDiscount).toFixed(2)}
                    </span>
                  </p>
                )}
                <p>
                  Subtotal neto: <span className="font-mono font-medium">${totals.subtotal.toFixed(2)}</span>
                </p>
                <p>
                  IVA: <span className="font-mono font-medium">${totals.vatAmount.toFixed(2)}</span>
                </p>
                {totals.otherTaxes > 0 && (
                  <p>
                    Percepciones: <span className="font-mono font-medium">${totals.otherTaxes.toFixed(2)}</span>
                  </p>
                )}
                {totals.otherChargesTotal > 0 && (
                  <p>
                    Otros cargos: <span className="font-mono font-medium">${totals.otherChargesTotal.toFixed(2)}</span>
                  </p>
                )}
                <p className="text-lg font-bold">
                  Total: <span className="font-mono">${totals.total.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Percepciones</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => appendPerception({ tax_type_id: '', base_amount: 0, rate: 0, amount: 0, notes: '' })}
                disabled={perceptionTypes.length === 0}
              >
                <Plus className="size-4 mr-1" /> Agregar percepción
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {perceptionTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay tipos de percepción configurados. Andá a Configuración → Impuestos para crear los que necesites.
              </p>
            ) : perceptionFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Si la factura incluye percepciones (ej. IIBB), agregalas para que el total cuadre.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Tipo</TableHead>
                    <TableHead className="w-[140px]">Base</TableHead>
                    <TableHead className="w-[100px]">Alícuota %</TableHead>
                    <TableHead className="w-[140px] text-right">Monto</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perceptionFields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Select
                          value={form.watch(`perceptions.${index}.tax_type_id`) || ''}
                          onValueChange={(v) => handlePerceptionTypeChange(index, v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {perceptionTypes.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          step="0.001"
                          {...form.register(`perceptions.${index}.base_amount`, { valueAsNumber: true })}
                          onBlur={() => recalcPerceptionAmount(index)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          step="0.0001"
                          {...form.register(`perceptions.${index}.rate`, { valueAsNumber: true })}
                          onBlur={() => recalcPerceptionAmount(index)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm text-right font-mono"
                          type="number"
                          step="0.001"
                          {...form.register(`perceptions.${index}.amount`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 text-sm" {...form.register(`perceptions.${index}.notes`)} />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => removePerception(index)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Otros cargos</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => appendOtherCharge({ description: '', amount: 0 })}
              >
                <Plus className="size-4 mr-1" /> Agregar otro cargo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {otherChargeFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Si la factura incluye cargos adicionales (flete, seguro, etc.) que no forman parte del subtotal ni
                afectan IVA, agregalos acá.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[160px] text-right">Monto</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherChargeFields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          placeholder="Ej: Flete, Seguro..."
                          {...form.register(`other_charges.${index}.description`)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm text-right font-mono"
                          type="number"
                          step="0.001"
                          {...form.register(`other_charges.${index}.amount`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => removeOtherCharge(index)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Observaciones (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? isEditMode
                ? 'Guardando...'
                : 'Creando...'
              : isEditMode
                ? 'Guardar cambios'
                : 'Crear factura'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
