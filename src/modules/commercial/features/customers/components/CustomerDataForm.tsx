'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { customersSchema } from '@/shared/zodSchemas/schemas';
import { createdCustomer, updateCustomer } from '@/modules/commercial/features/customers/components/action/create';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import BackButton from '@/shared/components/common/BackButton';

const TAX_CONDITIONS = [
  ['RESPONSABLE_INSCRIPTO', 'Responsable Inscripto'],
  ['MONOTRIBUTO', 'Monotributo'],
  ['EXENTO', 'Exento'],
  ['CONSUMIDOR_FINAL', 'Consumidor Final'],
  ['NO_RESPONSABLE', 'No Responsable'],
] as const;

const DOCUMENT_TYPES = ['CUIT', 'CUIL', 'DNI', 'Pasaporte', 'CDI', 'LE', 'LC'] as const;

const formSchema = customersSchema.extend({
  tax_condition: z.string().optional(),
  document_type: z.string().optional(),
  tax_id: z.string().optional(),
  fiscal_address: z.string().optional(),
  fiscal_city: z.string().optional(),
  fiscal_province: z.string().optional(),
  fiscal_zip_code: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export type CustomerDataInitial = Partial<FormValues> & { id?: string };

export default function CustomerDataForm({
  companyId,
  initialData,
}: {
  companyId: string;
  initialData?: CustomerDataInitial;
}) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: initialData?.company_name ?? '',
      client_cuit: initialData?.client_cuit ?? '',
      client_email: initialData?.client_email ?? '',
      client_phone: initialData?.client_phone ?? '',
      address: initialData?.address ?? '',
      tax_condition: initialData?.tax_condition ?? '',
      document_type: initialData?.document_type ?? 'CUIT',
      tax_id: initialData?.tax_id ?? '',
      fiscal_address: initialData?.fiscal_address ?? '',
      fiscal_city: initialData?.fiscal_city ?? '',
      fiscal_province: initialData?.fiscal_province ?? '',
      fiscal_zip_code: initialData?.fiscal_zip_code ?? '',
    },
  });

  const { register, handleSubmit, watch, setValue, formState } = form;
  const { errors } = formState;

  const onSubmit = async (values: FormValues) => {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, v == null ? '' : String(v)));
    fd.append('company_id', companyId);
    if (isEdit) fd.append('id', initialData!.id!);

    const action = isEdit ? updateCustomer : createdCustomer;
    const res = await action(fd);
    const ok = res && (res.status === 200 || res.status === 201);
    if (!ok) {
      toast.error(res?.body || 'No se pudo guardar el cliente');
      return;
    }
    toast.success(isEdit ? 'Cliente actualizado' : 'Cliente creado');
    router.push('/dashboard/commercial/customers');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</CardTitle>
          <div className="flex gap-2">
            <BackButton />
            <Button type="submit">{isEdit ? 'Guardar cambios' : 'Crear cliente'}</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Datos generales</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Nombre / Razón social *" error={errors.company_name?.message}>
                <Input {...register('company_name')} placeholder="Nombre del cliente" />
              </Field>
              <Field label="CUIT * (11 dígitos)" error={errors.client_cuit?.message}>
                <Input {...register('client_cuit')} placeholder="30123456789" inputMode="numeric" />
              </Field>
              <Field label="Condición IVA">
                <Select value={watch('tax_condition') || ''} onValueChange={(v) => setValue('tax_condition', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_CONDITIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Email" error={errors.client_email?.message}>
                <Input {...register('client_email')} placeholder="cliente@correo.com" type="email" />
              </Field>
              <Field label="Teléfono *" error={errors.client_phone?.message}>
                <Input {...register('client_phone')} placeholder="1155551234" />
              </Field>
              <Field label="Dirección *" error={errors.address?.message}>
                <Input {...register('address')} placeholder="Calle y número" />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Datos fiscales (facturación)</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Tipo de documento">
                <Select value={watch('document_type') || 'CUIT'} onValueChange={(v) => setValue('document_type', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nº fiscal (si difiere del CUIT)">
                <Input {...register('tax_id')} placeholder="Documento fiscal" />
              </Field>
              <Field label="Dirección fiscal">
                <Input {...register('fiscal_address')} placeholder="Domicilio fiscal" />
              </Field>
              <Field label="Ciudad">
                <Input {...register('fiscal_city')} placeholder="Ciudad" />
              </Field>
              <Field label="Provincia">
                <Input {...register('fiscal_province')} placeholder="Provincia" />
              </Field>
              <Field label="Código postal">
                <Input {...register('fiscal_zip_code')} placeholder="CP" />
              </Field>
            </div>
          </section>
        </CardContent>
      </Card>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
