'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createProductSchema } from '@/modules/products/shared/validators';
import { UNIT_OF_MEASURE_OPTIONS, VAT_RATE_OPTIONS } from '@/modules/products/shared/types';
import { createProduct, updateProduct } from '@/modules/products/features/list/actions.server';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type FormValues = z.infer<typeof createProductSchema>;

interface Props {
  product?: any;
}

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const isEditing = !!product;
  const [priceMode, setPriceMode] = useState<'NETO' | 'BRUTO'>('NETO');

  const form = useForm<FormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      type: product?.type || 'PRODUCT',
      purchase_sale_type: product?.purchase_sale_type || 'PURCHASE_SALE',
      unit_of_measure: product?.unit_of_measure || 'UN',
      cost_price: product?.cost_price ?? 0,
      sale_price: product?.sale_price ?? 0,
      vat_rate: product?.vat_rate ?? 21,
      profit_margin_percent: product?.profit_margin_percent ?? null,
      track_stock: product?.track_stock ?? true,
      min_stock: product?.min_stock ?? 0,
      max_stock: product?.max_stock ?? undefined,
      barcode: product?.barcode || '',
      brand: product?.brand || '',
    },
  });

  const trackStock = form.watch('track_stock');
  const purchaseSaleType = form.watch('purchase_sale_type');
  const costPrice = Number(form.watch('cost_price')) || 0;
  const vatRate = Number(form.watch('vat_rate')) || 0;
  const profitMargin = Number(form.watch('profit_margin_percent')) || 0;

  const costPriceWithVat = costPrice * (1 + vatRate / 100);
  const salePriceNeto = purchaseSaleType === 'PURCHASE_SALE' ? costPrice * (1 + profitMargin / 100) : 0;
  const salePriceWithVat = salePriceNeto * (1 + vatRate / 100);

  const onCostPriceChange = (raw: string) => {
    const value = Number(raw);
    if (Number.isNaN(value)) return;
    if (priceMode === 'NETO') {
      form.setValue('cost_price', value, { shouldValidate: true });
    } else {
      const neto = vatRate >= 0 ? value / (1 + vatRate / 100) : value;
      form.setValue('cost_price', Number(neto.toFixed(4)), { shouldValidate: true });
    }
  };

  const displayedCostPrice = priceMode === 'NETO' ? costPrice : costPriceWithVat;
  const equivalentLabel =
    priceMode === 'NETO'
      ? `Equivalente con IVA: $${costPriceWithVat.toFixed(2)}`
      : `Equivalente sin IVA: $${costPrice.toFixed(2)}`;

  const onSubmit = async (values: FormValues) => {
    toast.promise(
      async () => {
        const result = isEditing
          ? await updateProduct(product.id, values as any)
          : await createProduct(values as any);

        if (result.error) throw new Error(result.error);
        router.push('/dashboard/warehouse?tab=products');
        router.refresh();
      },
      {
        loading: isEditing ? 'Actualizando producto...' : 'Creando producto...',
        success: isEditing ? 'Producto actualizado' : 'Producto creado',
        error: (err) => err?.message || 'Error al guardar producto',
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información básica</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del producto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchase_sale_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de operación *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PURCHASE">Solo compra</SelectItem>
                      <SelectItem value="PURCHASE_SALE">Compra y venta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PRODUCT">Producto</SelectItem>
                      <SelectItem value="SERVICE">Servicio</SelectItem>
                      <SelectItem value="RAW_MATERIAL">Materia Prima</SelectItem>
                      <SelectItem value="CONSUMABLE">Consumible</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit_of_measure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad de medida</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UNIT_OF_MEASURE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
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
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl>
                    <Input placeholder="Marca" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de barras</FormLabel>
                  <FormControl>
                    <Input placeholder="Código de barras" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="md:col-span-2 lg:col-span-3">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descripción del producto" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precios e IVA</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="vat_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alícuota IVA</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VAT_RATE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2 lg:col-span-2 space-y-2">
              <FormLabel>Precio de compra *</FormLabel>
              <Tabs value={priceMode} onValueChange={(v) => setPriceMode(v as 'NETO' | 'BRUTO')}>
                <TabsList>
                  <TabsTrigger value="NETO">Sin IVA</TabsTrigger>
                  <TabsTrigger value="BRUTO">Con IVA</TabsTrigger>
                </TabsList>
              </Tabs>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={Number.isFinite(displayedCostPrice) ? Number(displayedCostPrice.toFixed(4)) : 0}
                onChange={(e) => onCostPriceChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{equivalentLabel}</p>
              <p className="text-xs text-muted-foreground">
                Se persiste el valor sin IVA: ${costPrice.toFixed(2)}
              </p>
              {form.formState.errors.cost_price && (
                <p className="text-sm text-destructive">{form.formState.errors.cost_price.message as string}</p>
              )}
            </div>

            {purchaseSaleType === 'PURCHASE_SALE' && (
              <>
                <FormField
                  control={form.control}
                  name="profit_margin_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>% de ganancia *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2 flex flex-col justify-center gap-1 rounded-md border bg-muted/40 p-3 text-sm">
                  <span className="text-xs text-muted-foreground">Precio de venta calculado</span>
                  <span>
                    Sin IVA: <span className="font-semibold text-foreground">${salePriceNeto.toFixed(2)}</span>
                  </span>
                  <span>
                    Con IVA: <span className="font-semibold text-foreground">${salePriceWithVat.toFixed(2)}</span>
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Control de stock</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="track_stock"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormLabel>Controlar stock</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            {trackStock && (
              <>
                <FormField
                  control={form.control}
                  name="min_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock mínimo</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock máximo</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" min="0" placeholder="Sin límite" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
