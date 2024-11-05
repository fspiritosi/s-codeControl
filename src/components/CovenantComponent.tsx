'use client';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import { covenantSchema } from '@/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Toaster, toast } from 'sonner';
import { z } from 'zod';
import { createdContact, updateContact } from '../app/dashboard/company/actualCompany/contact/action/create';

type Action = 'view' | 'edit' | null;

type CovenantFormValues = z.infer<typeof covenantSchema>;

export default function CovenantComponent({ id }: { id: string }) {
  const router = useRouter();
  const functionAction = id ? updateContact : createdContact;
  const searchParams = useSearchParams();
  const actualCompany = useLoggedUserStore((state) => state.actualCompany?.id);
  const supabase = supabaseBrowser();
  const [action, setAction] = useState<Action>(searchParams.get('action') as Action);
  const [readOnly, setReadOnly] = useState(action === 'edit' ? false : true);
  const [categoryData, setCategoryData] = useState<any>(null);
  const [covenantData, setCovenantData] = useState<any>(null);
  const form = useForm<CovenantFormValues>({
    resolver: zodResolver(covenantSchema),
    defaultValues: {
      name: '',
      category: '',
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

    const fetchCovenant = async () => {
      const { data, error } = await supabase
        .from('covenant')
        .select('*')
        .eq('is_active', true)
        .eq('company_id', actualCompany || '');
      if (error) {
        console.error('Error fetching covenants:', error);
      } else {
        setCovenantData(data);
      }
    };

    const fetchCategory = async () => {
      if (id) {
        const { data, error } = await supabase.from('category').select('*').eq('id', id);

        if (error) {
          console.error('Error fetching category:', error);
        } else {
          if (data && data.length > 0) {
            const category = data[0];
            setCategoryData(category);
            setValue('name', category.name || '');
          } else {
            console.error('No se encontró ningún contacto con el id proporcionado.');
          }
        }
      }
    };

    fetchCovenant();
    fetchCategory();
  }, [action, id]);

  const covenantValue = watch('name');

  const onSubmit = async (formData: CovenantFormValues) => {
    try {
      if (!formData.name || formData.name === 'undefined') {
        throw new Error('Debe seleccionar un cliente válido.');
      }

      const data = new FormData();
      data.append('id', id);
      data.append('name', formData.name);

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
                <Label htmlFor="name">Nombre del Contacto</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className="max-w-[350px] w-[300px]"
                  placeholder="nombre del contacto"
                  defaultValue={covenantData?.name || ''}
                  readOnly={readOnly}
                />
                {formErrors.name && (
                  <CardDescription id="name_error" className="max-w-[300px]">
                    {formErrors.name.message}
                  </CardDescription>
                )}
              </div>

              <div>
                <Label htmlFor="category">Seleccione una Categoria</Label>
                <Select
                  value={covenantValue}
                  onValueChange={(value) => setValue('category', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id="category" name="category" className="max-w-[350px] w-[300px]">
                    <SelectValue
                      placeholder={
                        covenantData?.find((cli: any) => cli.id === covenantValue)?.name || 'Seleccionar un cliente'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryData?.map((client: any) => (
                      <SelectItem key={client?.id} value={client?.id}>
                        {client?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <CardDescription id="customer_error" className="max-w-[300px]">
                    {formErrors.category.message}
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
