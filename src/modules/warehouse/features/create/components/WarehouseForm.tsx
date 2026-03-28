'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createWarehouseSchema } from '@/modules/warehouse/shared/validators';
import { createWarehouse, updateWarehouse } from '@/modules/warehouse/features/list/actions.server';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type FormValues = z.infer<typeof createWarehouseSchema>;

interface Props {
  warehouse?: any;
}

export default function WarehouseForm({ warehouse }: Props) {
  const router = useRouter();
  const isEditing = !!warehouse;

  const form = useForm<FormValues>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      code: warehouse?.code || '',
      name: warehouse?.name || '',
      type: warehouse?.type || 'MAIN',
      address: warehouse?.address || '',
      city: warehouse?.city || '',
      province: warehouse?.province || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    toast.promise(
      async () => {
        const result = isEditing
          ? await updateWarehouse(warehouse.id, values as any)
          : await createWarehouse(values as any);

        if (result.error) throw new Error(result.error);
        router.push('/dashboard/warehouse');
        router.refresh();
      },
      {
        loading: isEditing ? 'Actualizando almacén...' : 'Creando almacén...',
        success: isEditing ? 'Almacén actualizado' : 'Almacén creado',
        error: (err) => err?.message || 'Error al guardar almacén',
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos del almacén</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="code" render={({ field }) => (
              <FormItem>
                <FormLabel>Código *</FormLabel>
                <FormControl><Input placeholder="ALM-001" disabled={isEditing} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl><Input placeholder="Nombre del almacén" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="MAIN">Principal</SelectItem>
                    <SelectItem value="BRANCH">Sucursal</SelectItem>
                    <SelectItem value="TRANSIT">En tránsito</SelectItem>
                    <SelectItem value="VIRTUAL">Virtual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl><Input placeholder="Dirección" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="city" render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl><Input placeholder="Ciudad" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="province" render={({ field }) => (
              <FormItem>
                <FormLabel>Provincia</FormLabel>
                <FormControl><Input placeholder="Provincia" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear almacén'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
