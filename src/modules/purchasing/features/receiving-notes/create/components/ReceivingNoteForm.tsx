'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { receivingNoteSchema } from '@/modules/purchasing/shared/validators';
import { createReceivingNote } from '@/modules/purchasing/features/receiving-notes/list/actions.server';
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

type FormValues = z.infer<typeof receivingNoteSchema>;

interface Props {
  suppliers: { id: string; code: string; business_name: string }[];
  products: { id: string; code: string; name: string; unit_of_measure: string }[];
  warehouses: { id: string; code: string; name: string }[];
}

export default function ReceivingNoteForm({ suppliers, products, warehouses }: Props) {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(receivingNoteSchema),
    defaultValues: {
      supplier_id: '',
      warehouse_id: '',
      reception_date: new Date().toISOString().split('T')[0],
      purchase_order_id: '',
      purchase_invoice_id: '',
      notes: '',
      lines: [{ product_id: '', description: '', quantity: 1, notes: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' });

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setValue(`lines.${index}.description`, product.name);
    }
  };

  const onSubmit = async (values: FormValues) => {
    toast.promise(
      async () => {
        const result = await createReceivingNote(values as any);
        if (result.error) throw new Error(result.error);
        router.push('/dashboard/purchasing?tab=receiving');
        router.refresh();
      },
      { loading: 'Creando remito...', success: 'Remito creado', error: (e) => e?.message || 'Error' }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Datos de recepción</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField control={form.control} name="supplier_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.business_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="warehouse_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Almacén destino *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="reception_date" render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de recepción *</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem className="lg:col-span-3">
                <FormLabel>Notas</FormLabel>
                <FormControl><Textarea placeholder="Observaciones" rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Productos a recibir</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', description: '', quantity: 1, notes: '' })}>
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
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
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
                    <TableCell><Input className="h-8 text-sm" type="number" step="0.001" min="0" {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })} /></TableCell>
                    <TableCell><Input className="h-8 text-sm" placeholder="Notas" {...form.register(`lines.${index}.notes`)} /></TableCell>
                    <TableCell>{fields.length > 1 && <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => remove(index)}><Trash2 className="size-3.5 text-destructive" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {form.formState.errors.lines?.message && (
              <p className="text-sm text-destructive mt-2">{form.formState.errors.lines.message}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creando...' : 'Crear remito'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
