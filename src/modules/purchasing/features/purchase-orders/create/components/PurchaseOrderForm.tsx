'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { purchaseOrderSchema } from '@/modules/purchasing/shared/validators';
import { createPurchaseOrder } from '@/modules/purchasing/features/purchase-orders/list/actions.server';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { BASE_CURRENCY, convertAmount } from '@/shared/lib/currency-conversion';
import { formatCurrencyIn } from '@/shared/lib/utils/formatters';

type FormValues = z.infer<typeof purchaseOrderSchema>;

interface Props {
  suppliers: { id: string; code: string; business_name: string }[];
  products: { id: string; code: string; name: string; cost_price: any; vat_rate: any; unit_of_measure: string }[];
  /** Última cotización USD de la empresa, para precargar el TC de una OC en dólares. */
  latestUsdRate?: number | null;
}

export default function PurchaseOrderForm({ suppliers, products, latestUsdRate }: Props) {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      payment_conditions: '',
      delivery_address: '',
      notes: '',
      currency: 'ARS',
      exchange_rate: 1,
      lines: [{ product_id: '', description: '', quantity: 1, unit_cost: 0, vat_rate: 21 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' });
  const watchedLines = useWatch({ control: form.control, name: 'lines' });
  const currency = useWatch({ control: form.control, name: 'currency' }) ?? BASE_CURRENCY;
  const exchangeRate = Number(useWatch({ control: form.control, name: 'exchange_rate' })) || 0;
  const fmt = (n: number) => formatCurrencyIn(n, currency);

  const totals = useMemo(() => {
    let subtotal = 0;
    let vatAmount = 0;
    (watchedLines || []).forEach((line) => {
      const lineSubtotal = (line.quantity || 0) * (line.unit_cost || 0);
      const lineVat = lineSubtotal * ((line.vat_rate || 0) / 100);
      subtotal += lineSubtotal;
      vatAmount += lineVat;
    });
    return { subtotal, vatAmount, total: subtotal + vatAmount };
  }, [watchedLines]);

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setValue(`lines.${index}.description`, product.name);
      // El costo del producto está en pesos: en una OC en dólares se precarga
      // convertido al TC de la orden (sin TC queda en 0 para cargarlo a mano).
      const cost = Number(product.cost_price);
      form.setValue(
        `lines.${index}.unit_cost`,
        currency === BASE_CURRENCY
          ? cost
          : exchangeRate > 1
            ? convertAmount({ amount: cost, from: BASE_CURRENCY, to: currency, rate: exchangeRate })
            : 0
      );
      form.setValue(`lines.${index}.vat_rate`, Number(product.vat_rate));
    }
  };

  const onSubmit = async (values: FormValues) => {
    toast.promise(
      async () => {
        const result = await createPurchaseOrder(values as any);
        if (result.error) throw new Error(result.error);
        router.push('/dashboard/purchasing?tab=orders');
        router.refresh();
      },
      {
        loading: 'Creando orden de compra...',
        success: 'Orden de compra creada',
        error: (err) => err?.message || 'Error al crear orden de compra',
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Datos generales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField control={form.control} name="supplier_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor *</FormLabel>
                <SearchableSelect
                  options={suppliers.map((s) => ({ value: s.id, label: `${s.business_name} (${s.code})` }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Seleccionar proveedor"
                  searchPlaceholder="Buscar proveedor..."
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="issue_date" render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de emisión *</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="expected_delivery_date" render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha estimada de entrega</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="currency" render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue('exchange_rate', v === 'ARS' ? 1 : latestUsdRate && latestUsdRate > 1 ? latestUsdRate : 0);
                  }}
                >
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ARS">Peso (ARS)</SelectItem>
                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {currency === 'USD' && (
              <FormField control={form.control} name="exchange_rate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de cambio de referencia (ARS por USD) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="1200.0000"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Los precios van en dólares. El pago puede hacerse en pesos al tipo de cambio del día del pago.
                  </p>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <FormField control={form.control} name="payment_conditions" render={({ field }) => (
              <FormItem>
                <FormLabel>Condiciones de pago</FormLabel>
                <FormControl><Input placeholder="Ej: 30 días" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="delivery_address" render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección de entrega</FormLabel>
                <FormControl><Input placeholder="Dirección" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem className="lg:col-span-3">
                <FormLabel>Observaciones</FormLabel>
                <FormControl><Textarea placeholder="Notas" rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Líneas de la orden</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product_id: '', description: '', quantity: 1, unit_cost: 0, vat_rate: 21 })}
            >
              <Plus className="size-4 mr-1" /> Agregar línea
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Producto</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-[100px]">Cantidad</TableHead>
                  <TableHead className="w-[120px]">Costo unit. ({currency})</TableHead>
                  <TableHead className="w-[80px]">IVA %</TableHead>
                  <TableHead className="w-[120px] text-right">Subtotal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const qty = watchedLines?.[index]?.quantity || 0;
                  const cost = watchedLines?.[index]?.unit_cost || 0;
                  const lineSubtotal = qty * cost;

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <SearchableSelect
                          options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))}
                          value={form.watch(`lines.${index}.product_id`) || ''}
                          onValueChange={(v) => {
                            form.setValue(`lines.${index}.product_id`, v);
                            handleProductSelect(index, v);
                          }}
                          placeholder="Seleccionar"
                          searchPlaceholder="Buscar producto..."
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 text-sm" {...form.register(`lines.${index}.description`)} />
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 text-sm" type="number" step="1" min="1" {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })} />
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 text-sm" type="number" step="0.001" min="0" {...form.register(`lines.${index}.unit_cost`, { valueAsNumber: true })} />
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 text-sm" type="number" step="0.5" min="0" max="100" {...form.register(`lines.${index}.vat_rate`, { valueAsNumber: true })} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(lineSubtotal)}</TableCell>
                      <TableCell>
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => remove(index)}>
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {form.formState.errors.lines?.message && (
              <p className="text-sm text-destructive mt-2">{form.formState.errors.lines.message}</p>
            )}

            <div className="flex justify-end mt-4 space-y-1">
              <div className="text-sm space-y-1 text-right">
                <p>Subtotal: <span className="font-mono font-medium">{fmt(totals.subtotal)}</span></p>
                <p>IVA: <span className="font-mono font-medium">{fmt(totals.vatAmount)}</span></p>
                <p className="text-lg font-bold">Total: <span className="font-mono">{fmt(totals.total)}</span></p>
                {currency !== BASE_CURRENCY && exchangeRate > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Referencia: {formatCurrencyIn(convertAmount({ amount: totals.total, from: currency, to: BASE_CURRENCY, rate: exchangeRate }), BASE_CURRENCY)} al TC {exchangeRate}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creando...' : 'Crear orden de compra'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
