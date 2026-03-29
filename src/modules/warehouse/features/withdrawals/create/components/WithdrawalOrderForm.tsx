'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { createWithdrawalOrder } from '@/modules/warehouse/features/withdrawals/list/actions.server';
import { getWarehouseStocks } from '@/modules/warehouse/features/list/actions.server';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  warehouses: { id: string; code: string; name: string }[];
  employees: { id: string; firstname: string; lastname: string }[];
  vehicles: { id: string; domain: string | null; intern_number: string }[];
}

export default function WithdrawalOrderForm({ warehouses, employees, vehicles }: Props) {
  const router = useRouter();
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      warehouse_id: '', request_date: new Date().toISOString().split('T')[0],
      employee_id: '', vehicle_id: '', notes: '',
      lines: [{ product_id: '', description: '', quantity: 1, notes: '' }] as any[],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' });
  const watchedWarehouse = useWatch({ control: form.control, name: 'warehouse_id' });

  // Cargar productos con stock cuando cambia el almacén
  useEffect(() => {
    if (watchedWarehouse) {
      getWarehouseStocks(watchedWarehouse).then((stocks) => {
        setAvailableProducts(stocks.filter((s) => s.available_qty > 0));
      });
    } else {
      setAvailableProducts([]);
    }
  }, [watchedWarehouse]);

  const handleProductSelect = (index: number, productId: string) => {
    const stock = availableProducts.find((s) => s.product?.id === productId);
    if (stock) {
      form.setValue(`lines.${index}.description`, stock.product.name);
    }
  };

  const onSubmit = async (values: any) => {
    if (!values.lines?.length || !values.warehouse_id) {
      toast.error('Completar almacén y al menos una línea');
      return;
    }
    toast.promise(async () => {
      const result = await createWithdrawalOrder({
        ...values,
        employee_id: values.employee_id || undefined,
        vehicle_id: values.vehicle_id || undefined,
      });
      if (result.error) throw new Error(result.error);
      router.push('/dashboard/warehouse?tab=withdrawals');
      router.refresh();
    }, { loading: 'Creando orden...', success: 'Orden de retiro creada', error: (e) => e?.message || 'Error' });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Datos del retiro</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField control={form.control} name="warehouse_id" render={({ field }) => (
              <FormItem><FormLabel>Almacén origen *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar almacén" /></SelectTrigger></FormControl>
                  <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="request_date" render={({ field }) => (
              <FormItem><FormLabel>Fecha *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="employee_id" render={({ field }) => (
              <FormItem><FormLabel>Empleado que retira</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.lastname} {e.firstname}</SelectItem>)}
                  </SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="vehicle_id" render={({ field }) => (
              <FormItem><FormLabel>Para equipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.domain || v.intern_number}</SelectItem>)}
                  </SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem className="lg:col-span-3"><FormLabel>Notas</FormLabel><FormControl><Textarea placeholder="Motivo del retiro" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Materiales a retirar</CardTitle>
            <Button type="button" variant="outline" size="sm" disabled={!watchedWarehouse}
              onClick={() => append({ product_id: '', description: '', quantity: 1, notes: '' })}>
              <Plus className="size-4 mr-1" /> Agregar línea
            </Button>
          </CardHeader>
          <CardContent>
            {!watchedWarehouse ? (
              <p className="text-muted-foreground text-center py-8">Seleccioná un almacén para ver los productos disponibles</p>
            ) : availableProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay productos con stock en este almacén</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-[250px]">Producto (disponible)</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-[100px]">Cantidad</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Select onValueChange={(v) => { form.setValue(`lines.${index}.product_id`, v); handleProductSelect(index, v); }}
                          value={form.watch(`lines.${index}.product_id`) || ''}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            {availableProducts.map((s) => (
                              <SelectItem key={s.product?.id} value={s.product?.id}>
                                {s.product?.name} ({s.available_qty} {s.product?.unit_of_measure})
                              </SelectItem>
                            ))}
                          </SelectContent>
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
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creando...' : 'Crear orden de retiro'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
