'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSupplierSchema } from '@/modules/suppliers/shared/validators';
import { TAX_CONDITION_LABELS } from '@/modules/suppliers/shared/types';
import { createSupplier, updateSupplier } from '@/modules/suppliers/features/list/actions.server';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type FormValues = z.infer<typeof createSupplierSchema>;

interface Props {
  supplier?: any;
}

export default function SupplierForm({ supplier }: Props) {
  const router = useRouter();
  const isEditing = !!supplier;

  const form = useForm<FormValues>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      business_name: supplier?.business_name || '',
      trade_name: supplier?.trade_name || '',
      tax_id: supplier?.tax_id || '',
      tax_condition: supplier?.tax_condition || 'RESPONSABLE_INSCRIPTO',
      email: supplier?.email || '',
      phone: supplier?.phone || '',
      website: supplier?.website || '',
      address: supplier?.address || '',
      city: supplier?.city || '',
      province: supplier?.province || '',
      zip_code: supplier?.zip_code || '',
      country: supplier?.country || 'Argentina',
      payment_term_days: supplier?.payment_term_days || 0,
      credit_limit: supplier?.credit_limit || undefined,
      contact_name: supplier?.contact_name || '',
      contact_phone: supplier?.contact_phone || '',
      contact_email: supplier?.contact_email || '',
      notes: supplier?.notes || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    toast.promise(
      async () => {
        const result = isEditing
          ? await updateSupplier(supplier.id, values as any)
          : await createSupplier(values as any);

        if (result.error) throw new Error(result.error);
        router.push('/dashboard/suppliers');
        router.refresh();
      },
      {
        loading: isEditing ? 'Actualizando proveedor...' : 'Creando proveedor...',
        success: isEditing ? 'Proveedor actualizado' : 'Proveedor creado',
        error: (err) => err?.message || 'Error al guardar proveedor',
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos fiscales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="business_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Razón social *</FormLabel>
                <FormControl><Input placeholder="Razón social" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="trade_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de fantasía</FormLabel>
                <FormControl><Input placeholder="Nombre de fantasía" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="tax_id" render={({ field }) => (
              <FormItem>
                <FormLabel>CUIT *</FormLabel>
                <FormControl><Input placeholder="XX-XXXXXXXX-X" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="tax_condition" render={({ field }) => (
              <FormItem>
                <FormLabel>Condición ante IVA *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {Object.entries(TAX_CONDITION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="email@ejemplo.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl><Input placeholder="Teléfono" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="website" render={({ field }) => (
              <FormItem>
                <FormLabel>Sitio web</FormLabel>
                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="contact_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de contacto</FormLabel>
                <FormControl><Input placeholder="Nombre" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="contact_phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono de contacto</FormLabel>
                <FormControl><Input placeholder="Teléfono" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="contact_email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email de contacto</FormLabel>
                <FormControl><Input type="email" placeholder="contacto@ejemplo.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dirección</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem className="lg:col-span-2">
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
            <FormField control={form.control} name="zip_code" render={({ field }) => (
              <FormItem>
                <FormLabel>Código postal</FormLabel>
                <FormControl><Input placeholder="CP" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="country" render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl><Input placeholder="País" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos comerciales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField control={form.control} name="payment_term_days" render={({ field }) => (
              <FormItem>
                <FormLabel>Plazo de pago (días)</FormLabel>
                <FormControl><Input type="number" min="0" max="365" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="credit_limit" render={({ field }) => (
              <FormItem>
                <FormLabel>Límite de crédito</FormLabel>
                <FormControl><Input type="number" step="0.01" min="0" placeholder="Sin límite" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="lg:col-span-3">
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl><Textarea placeholder="Observaciones" rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear proveedor'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
