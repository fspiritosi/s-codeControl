'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { handleSupabaseError } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../supabase/supabase';

const defaultValues = [
  {
    id: 'multiresource',
    label: 'Es multirecurso?',
    tooltip: 'Si el documento aplica a mas de una persona o equipo',
  },
  {
    id: 'mandatory',
    label: 'Es mandatorio?',
    tooltip: 'Si el documento es obligatorio, se crearan alertas para su cumplimiento',
  },
  { id: 'explired', label: 'Expira?', tooltip: 'Si el documento expira' },
  {
    id: 'special',
    label: 'Es especial?',
    tooltip: 'Si el documento requiere documentacion especial',
  },
  {
    id: 'is_it_montlhy',
    label: 'Es mensual?',
    tooltip: 'Si el documento vence mensualmente',
  },
  {
    id: 'private',
    label: 'Es privado?',
    tooltip: 'Si el documento es privado no sera visible para los usuarios con el rol invitado',
  },
  {
    id: 'down_document',
    label: 'Es un documento de baja?',
    tooltip: 'Si el documento es de baja solo se pedira cuando el empleado este dado de baja',
  },
];

export default function NewDocumentType({
  codeControlClient,
  optionChildrenProp,
}: {
  codeControlClient?: boolean;
  optionChildrenProp: string;
}) {
  const [special, setSpecial] = useState(false);
  const router = useRouter();
  const fetchDocumentTypes = useCountriesStore((state) => state.documentTypes);
  const documentTypes = useCountriesStore((state) => state.companyDocumentTypes);
  const fetchDocuments = useLoggedUserStore((state) => state.documetsFetch);
  const [items, setItems] = useState(defaultValues);

  const selectOptions = optionChildrenProp === 'all' ? 'Personas, Equipos o Empresa' : optionChildrenProp;

  const isOptional = items.length < 5;
  const FormSchema = z.object({
    name: z
      .string({ required_error: 'Este campo es requerido' })
      .min(3, { message: 'El nombre debe contener mas de 3 caracteres' })
      .max(50, { message: 'El nombre debe contener menos de 50 caracteres' }),
    applies: z.enum(['Persona', 'Equipos', 'Empresa'], {
      required_error: 'Este campo es requerido',
    }),
    multiresource: isOptional
      ? z.boolean().optional()
      : z.boolean({
          required_error: 'Se debe seleccionar una opcion',
        }),
    mandatory: isOptional ? z.boolean().optional() : z.boolean({ required_error: 'Se debe seleccionar una opcion' }),
    explired: z.boolean({ required_error: 'Se debe seleccionar una opcion' }),
    special: isOptional ? z.boolean().optional() : z.boolean({ required_error: 'Este campo es requerido' }),
    description: isOptional
      ? z.string().optional()
      : special
        ? z.string({ required_error: 'Este campo es requerido' })
        : z.string().optional(),
    is_it_montlhy: z.boolean({ required_error: 'Este campo es requerido' }),
    private: z.boolean({ required_error: 'Este campo es requerido' }),
    down_document: z.boolean({ required_error: 'Este campo es requerido' }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      multiresource: undefined,
      mandatory: undefined,
      explired: undefined,
      special: undefined,
      applies: selectOptions === 'all' ? undefined : selectOptions as "Empresa" | "Persona" | "Equipos" | undefined,
    },
  });

  useEffect(() => {
    if (selectOptions === 'Empresa') {
      setItems(defaultValues.filter((e) => e.id === 'explired' || e.id === 'is_it_montlhy' || e.id === 'private'));
    }
  }, [selectOptions]);

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    const formattedValues = {
      ...values,
      name: formatName(values.name),
      description: formatDescription(values.description),
      company_id: codeControlClient ? useLoggedUserStore.getState().actualCompany?.id : null,
      multiresource: isOptional ? false : values.multiresource,
      mandatory: isOptional ? true : values.mandatory,
      special: isOptional ? false : values.special,
      down_document: isOptional ? false : values.down_document,
      private: values.private,
    };

    toast.promise(
      async () => {
        const { data, error } = await supabase.from('document_types').insert(formattedValues).select();

        if (error) {
          throw new Error(handleSupabaseError(error.message));
        }
      },
      {
        loading: 'Creando documento...',
        success: (data) => {
          fetchDocumentTypes(useLoggedUserStore.getState().actualCompany?.id || '');
          fetchDocuments();
          router.refresh();
          if (codeControlClient) {
            document.getElementById('close_document_modal')?.click();
            return 'El documento se ha creado correctamente';
          } else {
            router.push('/auditor');
            return 'El documento se ha creado correctamente';
          }
        },
        error: (error) => {
          return error;
        },
      }
    );
  }

  function formatName(name: string): string {
    // Capitalize first letter and convert the rest to lowercase
    return name.charAt(0)?.toUpperCase() + name.slice(1).toLowerCase();
  }

  function formatDescription(description: string | undefined): string | undefined {
    if (description) {
      // Capitalize first letter and convert the rest to lowercase
      return description.charAt(0)?.toUpperCase() + description.slice(1).toLowerCase();
    }
    return description;
  }

  const [down, setDown] = useState(false);
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} className="w-full rounded-md border p-4 shadow" placeholder="Nombre del documento" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="applies"
          render={({ field }) => (
            <FormItem>
              <div>
                <FormLabel>Aplica a</FormLabel>
                <Select
                  onValueChange={(value) => {
                    if (value === 'Empresa') {
                      setItems(
                        defaultValues.filter(
                          (e) => e.id === 'explired' || e.id === 'is_it_montlhy' || e.id === 'private'
                        )
                      );
                      if (down) {
                        setDown(false);
                        const name = form.getValues('name');
                        form.reset({ name });
                        form.setValue('applies', 'Empresa');
                      } else {
                        form.setValue('down_document', false);
                      }
                    } else {
                      setItems(defaultValues);
                    }

                    field.onChange(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectOptions} />
                    </SelectTrigger>
                  </FormControl>
                  {optionChildrenProp === 'all' ? (
                    <SelectContent>
                      <SelectItem value="Persona">Persona</SelectItem>
                      <SelectItem value="Equipos">Equipos</SelectItem>
                      <SelectItem value="Empresa">Empresa</SelectItem>
                    </SelectContent>
                  ) : (
                    <SelectContent>
                      <SelectItem value={optionChildrenProp || 'All'}>{optionChildrenProp}</SelectItem>
                    </SelectContent>
                  )}
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 grid-cols-1 gap-6 items-stretch justify-between">
          <TooltipProvider delayDuration={150}>
            {items?.map((item) => {
              if (!form.getValues('applies')) return;
              return (
                <FormField
                  key={item.id}
                  control={form.control}
                  name={item.id as 'name' | 'applies' | 'multiresource' | 'mandatory' | 'explired' | 'special'}
                  render={({ field }) => (
                    <FormItem>
                      <div className="">
                        <FormLabel className="flex gap-1 items-center mb-2">
                          {item.label}
                          <Tooltip>
                            <TooltipTrigger className="hover:cursor-help" type="button">
                              <InfoCircledIcon className="text-blue-500 size-5" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{item.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <div className="flex flex-col space-x-2">
                            <div className="flex gap-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={field.value === true}
                                  disabled={
                                    down &&
                                    (item.id === 'is_it_montlhy' ||
                                      item.id === 'mandatory' ||
                                      item.id === 'explired' ||
                                      item.id === 'special' ||
                                      item.id === 'multiresource')
                                  }
                                  onCheckedChange={(value) => {
                                    if (item.id === 'special') {
                                      setSpecial(true);
                                    }
                                    if (item.id === 'is_it_montlhy') {
                                      form.setValue('explired', value ? false : true);
                                    }
                                    if (item.id === 'explired') {
                                      form.setValue('is_it_montlhy', value ? false : true);
                                    }
                                    if (item.id === 'down_document') {
                                      form.setValue('is_it_montlhy', false);
                                      form.setValue('mandatory', true);
                                      form.setValue('explired', false);
                                      form.setValue('special', false);
                                      form.setValue('multiresource', false);
                                      setDown(true);
                                    }
                                    field.onChange(value ? true : false);
                                  }}
                                />
                                <span>Sí</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={field.value === false}
                                  disabled={
                                    down &&
                                    (item.id === 'is_it_montlhy' ||
                                      item.id === 'mandatory' ||
                                      item.id === 'explired' ||
                                      item.id === 'special' ||
                                      item.id === 'multiresource')
                                  }
                                  onCheckedChange={(value) => {
                                    field.onChange(value ? false : true);
                                    if (item.id === 'special') {
                                      setSpecial(false);
                                    }
                                    if (item.id === 'is_it_montlhy') {
                                      form.setValue('explired', false);
                                    }
                                    if (item.id === 'explired') {
                                      form.setValue('is_it_montlhy', false);
                                    }
                                    if (item.id === 'down_document') {
                                      setDown(false);
                                    }
                                  }}
                                />
                                <span>No</span>
                              </div>
                            </div>
                            <FormMessage />
                          </div>
                        </FormControl>
                        <div className="space-y-1 leading-none"></div>
                      </div>
                    </FormItem>
                  )}
                />
              );
            })}
          </TooltipProvider>
        </div>
        {special && (
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div>
                  <FormLabel>Documentacion Especial</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar documento especial" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Maneja">Maneja</SelectItem>
                      <SelectItem value="Habilitacion especial">Habilitacion especial</SelectItem>
                      {/* <SelectGroup>
                        <SelectLabel>Siguientes Opciones</SelectLabel>
                        {Object.keys(EMPLOYEES_TABLE).map((e) => (
                          <SelectItem key={EMPLOYEES_TABLE[e]} value={EMPLOYEES_TABLE[e]}>
                            {EMPLOYEES_TABLE[e]}
                          </SelectItem>
                        ))}
                      </SelectGroup> */}
                    </SelectContent>
                  </Select>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" id="create_new_document" className={cn(codeControlClient ? 'hidden' : '')}>
          Crear tipo de documento
        </Button>
      </form>
    </Form>
  );
}
