'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { purchaseInvoiceSchema } from '@/modules/purchasing/shared/validators';
import { VOUCHER_TYPE_LABELS } from '@/modules/purchasing/shared/types';
import { createPurchaseInvoice } from '@/modules/purchasing/features/invoices/list/actions.server';
import {
  getOrdersForInvoicing,
  getPurchaseOrderLinesForInvoicingBulk,
} from '@/modules/purchasing/features/purchase-orders/list/actions.server';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { MultiSelectCombobox } from '@/shared/components/ui/multi-select-combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, LinkIcon } from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';

type FormValues = z.infer<typeof purchaseInvoiceSchema>;

type LineField = {
  product_id?: string;
  description: string;
  quantity: number;
  unit_cost: number;
  vat_rate: number;
  purchase_order_line_id?: string;
  order_id?: string;
  order_full_number?: string;
};

interface Props {
  suppliers: { id: string; code: string; business_name: string }[];
  products: { id: string; code: string; name: string; cost_price: number; vat_rate: number }[];
}

export default function PurchaseInvoiceForm({ suppliers, products }: Props) {
  const router = useRouter();
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(purchaseInvoiceSchema),
    defaultValues: {
      supplier_id: '', voucher_type: 'FACTURA_A', point_of_sale: '0001', number: '',
      issue_date: new Date().toISOString().split('T')[0], due_date: '', cae: '', notes: '',
      purchase_order_id: '',
      purchase_order_ids: [],
      lines: [{ product_id: '', description: '', quantity: 1, unit_cost: 0, vat_rate: 21 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: 'lines' });
  const watchedLines = useWatch({ control: form.control, name: 'lines' });
  const watchedSupplier = useWatch({ control: form.control, name: 'supplier_id' });
  const watchedOrderIds = (useWatch({ control: form.control, name: 'purchase_order_ids' }) as string[]) || [];

  // Índice line_id → order_id para poder filtrar al deseleccionar OCs
  const poLineToOrderRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (watchedSupplier) {
      getOrdersForInvoicing(watchedSupplier)
        .then((orders) => setAvailableOrders(orders.map((o: any) => ({ ...o, total: Number(o.total) }))));
    } else {
      setAvailableOrders([]);
    }
    // Reset de OCs + remoción de líneas que venían de OC (preservar manuales)
    form.setValue('purchase_order_ids', []);
    poLineToOrderRef.current.clear();
    const currentLines = form.getValues('lines') as LineField[];
    const manualOnly = currentLines.filter((l) => !l.purchase_order_line_id);
    replace(manualOnly.length > 0 ? manualOnly : [
      { product_id: '', description: '', quantity: 1, unit_cost: 0, vat_rate: 21 },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedSupplier]);

  const handleOrdersChange = async (newIds: string[]) => {
    const oldIds = (form.getValues('purchase_order_ids') as string[]) || [];
    const addedIds = newIds.filter((id) => !oldIds.includes(id));
    const removedIds = oldIds.filter((id) => !newIds.includes(id));

    // 1) Remover líneas de OCs deseleccionadas (preservar manuales y de otras OCs)
    if (removedIds.length > 0) {
      const currentLines = form.getValues('lines') as LineField[];
      const keep = currentLines.filter((l) => {
        if (!l.purchase_order_line_id) return true; // manual
        const ord = l.order_id ?? poLineToOrderRef.current.get(l.purchase_order_line_id);
        return ord ? !removedIds.includes(ord) : true;
      });
      replace(keep.length > 0 ? keep : [
        { product_id: '', description: '', quantity: 1, unit_cost: 0, vat_rate: 21 },
      ]);
      for (const [lineId, ord] of Array.from(poLineToOrderRef.current.entries())) {
        if (removedIds.includes(ord)) poLineToOrderRef.current.delete(lineId);
      }
    }

    // 2) Agregar líneas de OCs nuevas (append, no replace)
    if (addedIds.length > 0) {
      const bulkLines = await getPurchaseOrderLinesForInvoicingBulk(addedIds);
      const currentLines = form.getValues('lines') as LineField[];
      const hasOnlyPlaceholder =
        currentLines.length === 1 &&
        !currentLines[0].purchase_order_line_id &&
        !currentLines[0].product_id &&
        !currentLines[0].description;
      if (hasOnlyPlaceholder) replace([]);

      for (const l of bulkLines) {
        poLineToOrderRef.current.set(l.id, l.order_id);
        append({
          product_id: l.product?.id || '',
          description: l.description,
          quantity: l.pending_qty,
          unit_cost: l.unit_cost,
          vat_rate: l.vat_rate,
          purchase_order_line_id: l.id,
          order_id: l.order_id,
          order_full_number: l.order_full_number,
        } as LineField);
      }
    }

    form.setValue('purchase_order_ids', newIds, { shouldDirty: true });
  };

  const totals = useMemo(() => {
    let subtotal = 0, vatAmount = 0;
    (watchedLines || []).forEach((l) => {
      const s = (l.quantity || 0) * (l.unit_cost || 0);
      subtotal += s; vatAmount += s * ((l.vat_rate || 0) / 100);
    });
    return { subtotal, vatAmount, total: subtotal + vatAmount };
  }, [watchedLines]);

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setValue(`lines.${index}.description`, product.name);
      form.setValue(`lines.${index}.unit_cost`, product.cost_price);
      form.setValue(`lines.${index}.vat_rate`, product.vat_rate);
    }
  };

  const onSubmit = async (values: FormValues) => {
    toast.promise(async () => {
      // Sanitizar líneas: descartar order_id/order_full_number (son solo UI)
      const lines = (values.lines as LineField[]).map((l) => ({
        product_id: l.product_id,
        description: l.description,
        quantity: l.quantity,
        unit_cost: l.unit_cost,
        vat_rate: l.vat_rate,
        purchase_order_line_id: l.purchase_order_line_id || undefined,
      }));
      const result = await createPurchaseInvoice({
        supplier_id: values.supplier_id,
        voucher_type: values.voucher_type,
        point_of_sale: values.point_of_sale,
        number: values.number,
        issue_date: values.issue_date,
        due_date: values.due_date,
        cae: values.cae,
        notes: values.notes,
        purchase_order_ids: values.purchase_order_ids || [],
        lines,
      } as any);
      if (result.error) throw new Error(result.error);
      router.push('/dashboard/purchasing?tab=invoices'); router.refresh();
    }, { loading: 'Creando factura...', success: 'Factura creada', error: (e) => e?.message || 'Error' });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Datos del comprobante</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField control={form.control} name="supplier_id" render={({ field }) => (
              <FormItem className="lg:col-span-2"><FormLabel>Proveedor *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                  <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.business_name}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="voucher_type" render={({ field }) => (
              <FormItem><FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{Object.entries(VOUCHER_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="point_of_sale" render={({ field }) => (
              <FormItem><FormLabel>Pto. venta *</FormLabel><FormControl><Input placeholder="0001" maxLength={5} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="number" render={({ field }) => (
              <FormItem><FormLabel>Número *</FormLabel><FormControl><Input placeholder="00000001" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="issue_date" render={({ field }) => (
              <FormItem><FormLabel>Fecha emisión *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="due_date" render={({ field }) => (
              <FormItem><FormLabel>Vencimiento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="cae" render={({ field }) => (
              <FormItem><FormLabel>CAE</FormLabel><FormControl><Input placeholder="CAE" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        {availableOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="size-4" /> Vincular a Órdenes de Compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MultiSelectCombobox
                options={availableOrders.map((o) => ({
                  label: `${o.full_number} — $${o.total.toFixed(2)}`,
                  value: o.id,
                }))}
                placeholder="Seleccionar OCs (opcional — carga líneas pendientes de facturar)"
                emptyMessage="No hay OCs facturables para este proveedor"
                selectedValues={watchedOrderIds}
                onChange={handleOrdersChange}
                showSelectAll
              />
              {watchedOrderIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {watchedOrderIds.length} OC{watchedOrderIds.length > 1 ? 's' : ''} seleccionada
                  {watchedOrderIds.length > 1 ? 's' : ''}. Puede editar cantidades por línea.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Líneas</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', description: '', quantity: 1, unit_cost: 0, vat_rate: 21 })}>
              <Plus className="size-4 mr-1" /> Agregar línea
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-[180px]">Producto</TableHead>
                <TableHead className="w-[110px]">OC</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-[90px]">Cant.</TableHead><TableHead className="w-[110px]">Costo</TableHead>
                <TableHead className="w-[70px]">IVA%</TableHead><TableHead className="w-[110px] text-right">Subtotal</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const lineSubtotal = (watchedLines?.[index]?.quantity || 0) * (watchedLines?.[index]?.unit_cost || 0);
                  const orderLabel = (field as unknown as LineField).order_full_number;
                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Select onValueChange={(v) => { form.setValue(`lines.${index}.product_id`, v); handleProductSelect(index, v); }} value={form.watch(`lines.${index}.product_id`) || ''}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {orderLabel ? (
                          <Badge variant="outline" className="font-mono text-xs">{orderLabel}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell><Input className="h-8 text-sm" {...form.register(`lines.${index}.description`)} /></TableCell>
                      <TableCell><Input className="h-8 text-sm" type="number" step="1" min="1" {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })} /></TableCell>
                      <TableCell><Input className="h-8 text-sm" type="number" step="0.01" {...form.register(`lines.${index}.unit_cost`, { valueAsNumber: true })} /></TableCell>
                      <TableCell><Input className="h-8 text-sm" type="number" step="0.5" {...form.register(`lines.${index}.vat_rate`, { valueAsNumber: true })} /></TableCell>
                      <TableCell className="text-right font-mono text-sm">${lineSubtotal.toFixed(2)}</TableCell>
                      <TableCell>{fields.length > 1 && <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => remove(index)}><Trash2 className="size-3.5 text-destructive" /></Button>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4 text-sm"><div className="text-right space-y-1">
              <p>Subtotal: <span className="font-mono font-medium">${totals.subtotal.toFixed(2)}</span></p>
              <p>IVA: <span className="font-mono font-medium">${totals.vatAmount.toFixed(2)}</span></p>
              <p className="text-lg font-bold">Total: <span className="font-mono">${totals.total.toFixed(2)}</span></p>
            </div></div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Creando...' : 'Crear factura'}</Button>
        </div>
      </form>
    </Form>
  );
}
