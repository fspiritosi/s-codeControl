'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { receivingNoteSchema } from '@/modules/purchasing/shared/validators';
import { createReceivingNote } from '@/modules/purchasing/features/receiving-notes/list/actions.server';
import { getOrdersForReceiving, getPurchaseOrderLinesForReceiving } from '@/modules/purchasing/features/purchase-orders/list/actions.server';
import { getInvoicesForReceiving, getInvoiceLinesForReceiving } from '@/modules/purchasing/features/invoices/list/actions.server';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, LinkIcon, FileText, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

type FormValues = z.infer<typeof receivingNoteSchema>;
type SourceType = 'order' | 'invoice' | null;

interface Props {
  suppliers: { id: string; code: string; business_name: string }[];
  products: { id: string; code: string; name: string; unit_of_measure: string }[];
  warehouses: { id: string; code: string; name: string }[];
}

export default function ReceivingNoteForm({ suppliers, products, warehouses }: Props) {
  const router = useRouter();
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);
  const [sourceType, setSourceType] = useState<SourceType>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(receivingNoteSchema),
    defaultValues: {
      supplier_id: '', warehouse_id: '',
      reception_date: new Date().toISOString().split('T')[0],
      purchase_order_id: '', purchase_invoice_id: '', notes: '',
      lines: [{ product_id: '', description: '', quantity: 1, notes: '' }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: 'lines' });
  const watchedSupplier = useWatch({ control: form.control, name: 'supplier_id' });

  useEffect(() => {
    if (watchedSupplier) {
      Promise.all([
        getOrdersForReceiving(watchedSupplier),
        getInvoicesForReceiving(watchedSupplier),
      ]).then(([orders, invoices]) => {
        setAvailableOrders(orders.map((o: any) => ({ ...o, total: Number(o.total) })));
        setAvailableInvoices(invoices.map((inv: any) => ({ ...inv, total: Number(inv.total) })));
      });
    } else {
      setAvailableOrders([]);
      setAvailableInvoices([]);
    }
    // Reset source selection when supplier changes
    setSourceType(null);
    form.setValue('purchase_order_id', '');
    form.setValue('purchase_invoice_id', '');
    replace([{ product_id: '', description: '', quantity: 1, notes: '' }]);
  }, [watchedSupplier]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearSourceSelection = () => {
    form.setValue('purchase_order_id', '');
    form.setValue('purchase_invoice_id', '');
    replace([{ product_id: '', description: '', quantity: 1, notes: '' }]);
  };

  const handleSourceTypeChange = (type: SourceType) => {
    if (type === sourceType) return;
    clearSourceSelection();
    setSourceType(type);
  };

  const handleOrderSelect = async (orderId: string) => {
    if (!orderId) return;
    form.setValue('purchase_order_id', orderId);
    form.setValue('purchase_invoice_id', '');
    const lines = await getPurchaseOrderLinesForReceiving(orderId);
    if (lines.length > 0) {
      replace(lines.map((l) => ({
        product_id: l.product?.id || '',
        description: l.description,
        quantity: l.pending_qty,
        purchase_order_line_id: l.id,
        notes: '',
      })));
    }
  };

  const handleInvoiceSelect = async (invoiceId: string) => {
    if (!invoiceId) return;
    form.setValue('purchase_invoice_id', invoiceId);
    form.setValue('purchase_order_id', '');
    const lines = await getInvoiceLinesForReceiving(invoiceId);
    if (lines.length > 0) {
      replace(lines.map((l) => ({
        product_id: l.product?.id || '',
        description: l.description,
        quantity: l.pending_qty,
        purchase_invoice_line_id: l.id,
        notes: '',
      })));
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) form.setValue(`lines.${index}.description`, product.name);
  };

  const onSubmit = async (values: FormValues) => {
    toast.promise(async () => {
      const result = await createReceivingNote(values as any);
      if (result.error) throw new Error(result.error);
      router.push('/dashboard/purchasing?tab=receiving'); router.refresh();
    }, { loading: 'Creando remito...', success: 'Remito creado', error: (e) => e?.message || 'Error' });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Datos de recepción</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField control={form.control} name="supplier_id" render={({ field }) => (
              <FormItem><FormLabel>Proveedor *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                  <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.business_name}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="warehouse_id" render={({ field }) => (
              <FormItem><FormLabel>Almacén destino *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                  <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="reception_date" render={({ field }) => (
              <FormItem><FormLabel>Fecha de recepción *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem className="lg:col-span-3"><FormLabel>Notas</FormLabel><FormControl><Textarea placeholder="Observaciones" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        {(availableOrders.length > 0 || availableInvoices.length > 0) && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="size-4" /> Vincular documento de origen</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {availableOrders.length > 0 && (
                  <Button
                    type="button"
                    variant={sourceType === 'order' ? 'default' : 'outline'}
                    size="sm"
                    className={cn('gap-2', sourceType === 'order' && 'pointer-events-none')}
                    onClick={() => handleSourceTypeChange('order')}
                  >
                    <ShoppingCart className="size-4" /> Orden de Compra ({availableOrders.length})
                  </Button>
                )}
                {availableInvoices.length > 0 && (
                  <Button
                    type="button"
                    variant={sourceType === 'invoice' ? 'default' : 'outline'}
                    size="sm"
                    className={cn('gap-2', sourceType === 'invoice' && 'pointer-events-none')}
                    onClick={() => handleSourceTypeChange('invoice')}
                  >
                    <FileText className="size-4" /> Factura ({availableInvoices.length})
                  </Button>
                )}
                {sourceType && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { clearSourceSelection(); setSourceType(null); }}
                  >
                    Limpiar
                  </Button>
                )}
              </div>

              {sourceType === 'order' && (
                <Select onValueChange={handleOrderSelect} value={form.watch('purchase_order_id') || ''}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar OC (carga productos pendientes de recibir)" /></SelectTrigger>
                  <SelectContent>
                    {availableOrders.map((o) => <SelectItem key={o.id} value={o.id}>{o.full_number} — ${o.total.toFixed(2)}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {sourceType === 'invoice' && (
                <Select onValueChange={handleInvoiceSelect} value={form.watch('purchase_invoice_id') || ''}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar factura (carga productos pendientes de recibir)" /></SelectTrigger>
                  <SelectContent>
                    {availableInvoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.full_number} — {inv.voucher_type.replace(/_/g, ' ')} — ${inv.total.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Productos a recibir</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', description: '', quantity: 1, notes: '' })}>
              <Plus className="size-4 mr-1" /> Agregar línea
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-[200px]">Producto</TableHead><TableHead>Descripción</TableHead>
                <TableHead className="w-[100px]">Cantidad</TableHead><TableHead>Notas</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Select onValueChange={(v) => { form.setValue(`lines.${index}.product_id`, v); handleProductSelect(index, v); }} value={form.watch(`lines.${index}.product_id`) || ''}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Input className="h-8 text-sm" {...form.register(`lines.${index}.description`)} /></TableCell>
                    <TableCell><Input className="h-8 text-sm" type="number" step="1" min="1" {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })} /></TableCell>
                    <TableCell><Input className="h-8 text-sm" placeholder="Notas" {...form.register(`lines.${index}.notes`)} /></TableCell>
                    <TableCell>{fields.length > 1 && <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => remove(index)}><Trash2 className="size-3.5 text-destructive" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {form.formState.errors.lines?.message && <p className="text-sm text-destructive mt-2">{form.formState.errors.lines.message}</p>}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Creando...' : 'Crear remito'}</Button>
        </div>
      </form>
    </Form>
  );
}
