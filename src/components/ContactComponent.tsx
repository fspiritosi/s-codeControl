'use client';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import { contactSchema } from '@/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Toaster, toast } from 'sonner';
import { z } from 'zod';
import { createdContact, updateContact } from '../app/dashboard/company/actualCompany/contact/action/create';

type Action = 'view' | 'edit' | null;

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactRegister({ id }: { id: string }) {
  const router = useRouter();
  const functionAction = id ? updateContact : createdContact;
  const searchParams = useSearchParams();
  const actualCompany = useLoggedUserStore((state) => state.actualCompany?.id);
  const supabase = supabaseBrowser();
  const [action, setAction] = useState<Action>(searchParams.get('action') as Action);
  const [readOnly, setReadOnly] = useState(action === 'edit' ? false : true);
  const [clientData, setClientData] = useState<any>(null);
  const [contactData, setContactData] = useState<any>(null);
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      contact_charge: '',
      customer: '',
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors: formErrors },
  } = form;

  useEffect(() => {
    const id = searchParams.get('id');
    if (action === 'view') {
      setReadOnly(true);
    }
    if (action === 'edit') {
      setReadOnly(false);
    }
    if (!id) {
      setReadOnly(false);
    }

    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .eq('company_id', actualCompany || '');
      if (error) {
        console.error('Error fetching customers:', error);
      } else {
        setClientData(data);
      }
    };

    const fetchContact = async () => {
      if (id) {
        const { data, error } = await supabase.from('contacts').select('*').eq('id', id);

        if (error) {
          console.error('Error fetching contact:', error);
        } else {
          if (data && data.length > 0) {
            const contact = data[0];
            setContactData(contact);
            setValue('contact_name', contact.contact_name || '');
            setValue('contact_email', contact.constact_email || '');
            setValue('contact_phone', contact.contact_phone?.toString() || '');
            setValue('contact_charge', contact.contact_charge || '');
            setValue('customer', contact.customer_id || '');
          } else {
            console.error('No se encontró ningún contacto con el id proporcionado.');
          }
        }
      }
    };

    fetchCustomers();
    fetchContact();
  }, [action, id]);

  const customerValue = watch('customer');

  const onSubmit = async (formData: ContactFormValues) => {
    try {
      if (!formData.customer || formData.customer === 'undefined') {
        throw new Error('Debe seleccionar un cliente válido.');
      }

      const data = new FormData();
      data.append('id', id);
      data.append('contact_name', formData.contact_name);
      data.append('contact_email', formData.contact_email || '');
      data.append('contact_phone', formData.contact_phone);
      data.append('contact_charge', formData.contact_charge);
      data.append('customer', formData.customer);
      const company_id = actualCompany;
      data.append('company_id', company_id as string);
      toast.loading('Creando contacto');

      const response = await functionAction(data);

      if (response.status === 201) {
        toast.dismiss();
        toast.success('Contacto creado satisfactoriamente!');
        router.push('/dashboard/company/actualCompany');
      } else {
        toast.dismiss();
        toast.error(response.body);
      }
    } catch (errors) {
      // console.error('Error submitting form:', error);
      toast.dismiss();
      toast.error('Error al crear el cliente');
    }
  };

  return (
    <section className={cn('md:mx-7')}>
      <Card className="mt-6 p-8">
        <CardTitle className="text-4xl mb-3">
          {action === 'view' ? '' : action === 'edit' ? 'Editar Contacto' : 'Registrar Contacto'}
        </CardTitle>
        <CardDescription>
          {action === 'view'
            ? ''
            : action === 'edit'
              ? 'Edita este formulario con los datos de tu Contacto'
              : 'Completa este formulario con los datos de tu nuevo Contacto'}
        </CardDescription>
        <div className="mt-6 rounded-xl flex w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" name="id" value={id} />

            <div className="flex flex-wrap gap-3 items-center w-full">
              <div>
                <Label htmlFor="contact_name">Nombre del Contacto</Label>
                <Input
                  id="contact_name"
                  {...register('contact_name')}
                  className="max-w-[350px] w-[300px]"
                  placeholder="nombre del contacto"
                  defaultValue={contactData?.contact_name || ''}
                  readOnly={readOnly}
                />
                {formErrors.contact_name && (
                  <CardDescription id="contact_name_error" className="max-w-[300px]">
                    {formErrors.contact_name.message}
                  </CardDescription>
                )}
              </div>
              <div>
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  {...register('contact_email')}
                  className="max-w-[350px] w-[300px]"
                  placeholder="email"
                  defaultValue={contactData?.contact_email || ''}
                  readOnly={readOnly}
                />
                {formErrors.contact_email && (
                  <CardDescription id="contact_email_error" className="max-w-[300px]">
                    {formErrors.contact_email.message}
                  </CardDescription>
                )}
              </div>
              <div>
                <Label htmlFor="contact_phone">Número de teléfono</Label>
                <Input
                  id="contact_phone"
                  {...register('contact_phone')}
                  className="max-w-[350px] w-[300px]"
                  placeholder="teléfono"
                  defaultValue={contactData?.contact_phone || ''}
                  readOnly={readOnly}
                />
                {formErrors.contact_phone && (
                  <CardDescription id="contact_phone_error" className="max-w-[300px]">
                    {formErrors.contact_phone.message}
                  </CardDescription>
                )}
              </div>

              <div>
                <Label htmlFor="customer">Seleccione un cliente</Label>
                <Select
                  value={customerValue}
                  onValueChange={(value) => setValue('customer', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id="customer" name="customer" className="max-w-[350px] w-[300px]">
                    <SelectValue
                      placeholder={
                        clientData?.find((cli: any) => cli.id === customerValue)?.name || 'Seleccionar un cliente'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {clientData?.map((client: any) => (
                      <SelectItem key={client?.id} value={client?.id}>
                        {client?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.customer && (
                  <CardDescription id="customer_error" className="max-w-[300px]">
                    {formErrors.customer.message}
                  </CardDescription>
                )}
              </div>
              <div>
                <Label htmlFor="contact_charge">Cargo</Label>
                <Input
                  id="contact_charge"
                  {...register('contact_charge')}
                  className="max-w-[350px] w-[300px]"
                  placeholder="cargo en la empresa"
                  defaultValue={contactData?.contact_charge || ''}
                  readOnly={readOnly}
                />
                {formErrors.contact_charge && (
                  <CardDescription id="contact_charge_error" className="max-w-[300px]">
                    {formErrors.contact_charge.message}
                  </CardDescription>
                )}
              </div>
            </div>
            {action === 'view' ? null : (
              <Button type="submit" className="mt-5">
                {id ? 'Editar Contacto' : 'Registrar Contacto'}
              </Button>
            )}
            <Toaster />
          </form>
        </div>
      </Card>
    </section>
  );
}
