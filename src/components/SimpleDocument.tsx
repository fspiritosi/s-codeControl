import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CaretSortIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import { addMonths, format } from 'date-fns';
import { Calendar as CalendarIcon, CheckIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLoggedUserStore } from '@/store/loggedUser';
import { es } from 'date-fns/locale';
import { supabase } from '../../supabase/supabase';
import { AlertDialogCancel } from './ui/alert-dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command';
import { useToast } from './ui/use-toast';

export default function SimpleDocument({
  resource,
  handleOpen,
  defaultDocumentId,
  document,
}: {
  resource: string | undefined;
  handleOpen: () => void;
  defaultDocumentId?: string;
  document?: string;
}) {
  const documentDrawerEmployees = useLoggedUserStore((state) => state.documentDrawerEmployees);
  const documentDrawerVehicles = useLoggedUserStore((state) => state.documentDrawerVehicles);
  const employees = useLoggedUserStore((state) => state.employees)?.reduce(
    (acc: any, act: { full_name: string; document_number: string; id: string }) => {
      const data = {
        name: act.full_name,
        document: act.document_number,
        id: act.id,
      };
      return [...acc, data];
    },
    []
  );
  const vehicles = useLoggedUserStore((state) => state.vehicles)?.reduce(
    (acc: any, act: { domain: string; serie: string; id: string }) => {
      const data = {
        name: act.domain || act.serie,
        document: act.serie || act.domain,
        id: act.id,
      };
      return [...acc, data];
    },
    []
  );
  const [documenTypes, setDocumentTypes] = useState<any[] | null>([]);

  const searchParams = useSearchParams();
  const documentResource = searchParams.get('document');
  const id = searchParams.get('id');
  const user = useLoggedUserStore((state) => state.credentialUser?.id);
  const idApplies = employees?.find((employee: any) => employee.document === documentResource)?.id as string;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    getValues,
  } = useForm({
    defaultValues: {
      documents: [
        {
          applies: idApplies || '',
          id_document_types: defaultDocumentId ?? '',
          file: '',
          validity: '',
          user_id: user,
          period: null || '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'documents',
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onSubmit = async ({ documents }: any) => {
    // Notificar los errores y consejos con un toast

    /*
     Id del recurso
     recursoid - tipo de documentoid (fecha de vencimiento || v0)
    */

    setLoading(true);
    let hasError = false;
    try {
      const idApplies = id || employees.find((employee: any) => employee.document === documentResource)?.id;

      const updateEntries = documents?.map((entry: any) => {
        return {
          applies: entry.applies || idApplies,
          id_document_types: entry.id_document_types,
          validity: entry.validity ? format(entry.validity, 'dd/MM/yyyy') : null,
          user_id: user,
          created_at: new Date(),
          period: entry.period,
        };
      });
      const storagePath = resource === 'empleado' ? 'documentos-empleados' : 'documentos-equipos';

      for (let index = 0; index < documents.length; index++) {
        const document = documents[index];
        const { data } = await supabase.storage.from('document_files').list(storagePath, {
          search: `document-${document.id_document_types}-${updateEntries[index].applies}`,
        });

        if (data?.length && data?.length > 0) {
          setError(`documents.${index}.id_document_types`, {
            message: 'El documento ya ha sido subido anteriormente',
            type: 'validate',
            types: {
              validate: 'El documento ya ha sido subido anteriormente',
            },
          });
          setLoading(false);
          hasError = true;
          toast({
            title: 'El documento ya ha sido subido anteriormente',
            description: 'Por favor, sube un documento diferente o elimina la entrada duplicada',
            variant: 'destructive',
          });
          return;
        }

        if (hasError) {
          return setLoading(false);
        }
        const fileExtension = document.file.split('.').pop();
        const tableName = resource === 'empleado' ? 'documents_employees' : 'documents_equipment';
        const hasExpiredDate = updateEntries?.[index]?.validity?.replace(/\//g, '-') ?? 'v0';
        await supabase.storage
          .from('document_files')
          .upload(
            `/${storagePath}/document-${document.id_document_types}-${updateEntries[index].applies}-${hasExpiredDate}.${fileExtension}`,
            files?.[index] || document.file,
            {
              cacheControl: '3600',
              upsert: false,
            }
          )
          .then(async (response) => {
            const isMandatory = documenTypes?.find(
              (doc) => doc.id === updateEntries[index].id_document_types
            )?.mandatory;

            // // // console.log('isMandatory', isMandatory)

            if (isMandatory) {
              const data = {
                validity: updateEntries[index].validity,
                document_path: response.data?.path,
                created_at: new Date(),
                state: 'presentado',
                period: updateEntries[index].period || null,
              };
              const { error } = await supabase
                .from(tableName)
                .update(data)
                .eq('applies', idApplies || updateEntries[index].applies)
                .eq('id_document_types', updateEntries[index].id_document_types);

              // // // console.log(error, 'error')

              if (error) {
                toast({
                  title: 'Error',
                  description: 'Hubo un error al subir los documentos a la base de datos',
                  variant: 'destructive',
                });
                setLoading(false);
                hasError = true;
                console.error(error);
                return;
              }
            } else {
              // const data = {
              //   validity: updateEntries[index].validity,
              //   document_path: response.data?.path,
              //   created_at: new Date(),
              //   state: 'presentado',
              // }
              // const { error } = await supabase
              //   .from(tableName)
              //   .upsert(data)
              //   .eq('applies', idApplies || updateEntries[index].applies)
              //   .eq('id_document_types', updateEntries[index].id_document_types)

              // // // console.log('insert')

              const { error } = await supabase.from(tableName).insert({
                validity: updateEntries[index].validity,
                document_path: response.data?.path,
                created_at: new Date(),
                state: 'presentado',
                applies: idApplies || updateEntries[index].applies,
                id_document_types: updateEntries[index].id_document_types,
                user_id: user,
                period: updateEntries[index].period || null,
              });

              if (error) {
                // // // console.log(error, 'error')
                toast({
                  title: 'Error',
                  description: 'Hubo un error al subir los documentos a la base de datos',
                  variant: 'destructive',
                });
                setLoading(false);
                hasError = true;
                console.error(error);
                return;
              }
            }
          })
          .catch((error) => {
            toast({
              title: 'Error',
              description: 'Hubo un error al subir los documentos al storage',
              variant: 'destructive',
            });
            setLoading(false);
            hasError = true;
            return;
          });
      }

      if (hasError) {
        return setLoading(false);
      }

      toast({
        title: 'Éxito',
        description: 'Documentos subidos correctamente',
        variant: 'default',
      });
      setLoading(false);
      if (document) {
        documentDrawerEmployees(document);
      }
      if (id) {
        documentDrawerVehicles(id);
      }
      handleOpen();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Hubo un error al subir los documentos',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const fetchDocumentTypes = async () => {
    const applies = resource === 'empleado' ? 'Persona' : 'Equipos';

    let { data: document_types, error } = await supabase
      .from('document_types')
      .select('*')
      .eq('applies', applies)
      .or(`company_id.eq.${useLoggedUserStore?.getState?.()?.actualCompany?.id},company_id.is.null`);

    setDocumentTypes(document_types);
  };

  useEffect(() => {
    fetchDocumentTypes();
  }, [resource]);

  const today = new Date();
  const nextMonth = addMonths(new Date(), 1);
  const [month, setMonth] = useState<Date>(nextMonth);

  const yearsAhead = Array.from({ length: 20 }, (_, index) => {
    const year = today.getFullYear() + index;
    return year;
  });

  const data = resource === 'empleado' ? employees : vehicles;
  const [filteredResources, setFilteredResources] = useState(data);
  const [inputValue, setInputValue] = useState<string>('');
  const [hasExpired, setHasExpired] = useState(false);
  const [isMontlhy, setIsMontlhy] = useState(false);
  const [duplicatedDocument, setDuplicatedDocument] = useState(false);
  const [files, setFiles] = useState<File[] | undefined>([]);
  const [openResourceSelector, setOpenResourceSelector] = useState(false);
  const [years, setYear] = useState(today.getFullYear().toString());

  useEffect(() => {
    const documentInfo = documenTypes?.find((documentType) => documentType.id === defaultDocumentId);
    setHasExpired(documentInfo?.explired);
  }, [defaultDocumentId, documenTypes]);
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ul className="flex flex-col gap-2">
        <div className="space-y-3">
          {fields?.map((item, index) => {
            return (
              <React.Fragment key={item.id}>
                <details open={index === 0}>
                  <summary
                    className={cn(
                      errors.documents && errors.documents[index] && errors?.documents?.[index] && 'text-red-600',
                      'text-xl flex justify-between items-center cursor-pointer'
                    )}
                  >
                    Documento {index + 1}
                  </summary>
                  <li className="space-y-4 ">
                    {!id && !documentResource && (
                      <div className="space-y-2 py-3 ">
                        <Label className="block">{resource === 'equipo' ? 'Equipos' : 'Empleados'}</Label>
                        <Controller
                          render={({ field }) => {
                            const selectedResourceName = data?.find(
                              (resource: any) => resource.id === field.value
                            )?.name;

                            return (
                              <Popover
                                open={openResourceSelector}
                                onOpenChange={() => {
                                  setOpenResourceSelector(!openResourceSelector);
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(' justify-between w-full', !field.value && 'text-muted-foreground')}
                                  >
                                    {field.value && selectedResourceName
                                      ? data?.find(
                                          (employee: any) =>
                                            employee.id === field.value || employee.name === field.value
                                        )?.name
                                      : `Seleccionar ${resource === 'equipo' ? 'equipo' : 'empleado'}`}
                                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className=" p-0">
                                  <Command>
                                    <CommandInput
                                      placeholder={`Buscar ${resource === 'equipo' ? 'equipo' : 'empleado'}`}
                                      className="h-9"
                                      onFocus={() => {
                                        setFilteredResources(data);
                                      }}
                                      onInput={(e) => {
                                        const inputValue = (e.target as HTMLInputElement).value.toLowerCase();
                                        setInputValue(inputValue);
                                        const isNumberInput = /^\d+$/.test(inputValue);
                                        const filteredresources = data?.filter((person: any) => {
                                          if (isNumberInput) {
                                            return person.document.includes(inputValue);
                                          } else {
                                            return (
                                              person.name.toLowerCase().includes(inputValue) ||
                                              person.document.includes(inputValue)
                                            );
                                          }
                                        });
                                        setFilteredResources(filteredresources);
                                      }}
                                    />
                                    <CommandEmpty>
                                      {filteredResources?.length === 0 &&
                                        inputValue.length > 0 &&
                                        'No se encontraron resultados'}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {filteredResources?.map((employee: any) => {
                                        const key = /^\d+$/.test(inputValue) ? employee.document : employee.name;
                                        const value = /^\d+$/.test(inputValue) ? employee.document : employee.name;

                                        return (
                                          <CommandItem
                                            value={value}
                                            key={key}
                                            onSelect={() => {
                                              const id = data.find(
                                                (resource: any) =>
                                                  resource.name === value || resource.document === value
                                              ).id;

                                              field.onChange(id);

                                              const resource = getValues('documents')[index].id_document_types;
                                              setDuplicatedDocument(
                                                getValues('documents').some((document: any, document_index) => {
                                                  return (
                                                    index !== document_index &&
                                                    document.id_document_types === resource &&
                                                    document.applies === id
                                                  );
                                                })
                                              );
                                              id;
                                              field.onChange(id);
                                              setOpenResourceSelector(!openResourceSelector);
                                            }}
                                          >
                                            {employee.name}
                                            <CheckIcon
                                              className={cn(
                                                'ml-auto h-4 w-4',
                                                employee.name === field.value || employee.document === field.value
                                                  ? 'opacity-100'
                                                  : 'opacity-0'
                                              )}
                                            />
                                          </CommandItem>
                                        );
                                      })}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            );
                          }}
                          name={`documents.${index}.applies`}
                          control={control}
                          rules={!id || !documentResource ? { required: 'Este campo es requerido' } : {}}
                        />
                        <CardDescription>Selecciona el empleado al que deseas vincular el documento</CardDescription>
                        {errors.documents && errors.documents[index] && errors?.documents?.[index]?.applies && (
                          <CardDescription className="text-red-700 mt-0 m-0">
                            {errors?.documents?.[index]?.applies?.message}
                          </CardDescription>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Seleccione el tipo de documento a vincular al recurso</Label>
                      <Controller
                        render={({ field }) => (
                          <Select
                            onValueChange={(e) => {
                              const selected = documenTypes?.find((doc) => doc.id === e);
                              setHasExpired(selected.explired);
                              setIsMontlhy(selected.is_it_montlhy);
                              const resource = getValues('documents')[index].applies;

                              setDuplicatedDocument(
                                getValues('documents').some((document: any, document_index) => {
                                  index !== document_index &&
                                    document.id_document_types === e &&
                                    document.applies === resource;
                                })
                              );
                              if (duplicatedDocument) {
                                return setError(`documents.${index}.id_document_types`, {
                                  message: 'El documento ya ha sido seleccionado',
                                  type: 'validate',
                                  types: {
                                    validate: 'El documento ya ha sido seleccionado',
                                  },
                                });
                              } else {
                                clearErrors(`documents.${index}.id_document_types`);
                                field.onChange(e);
                              }
                            }}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className={cn(field.value ? 'text-red-white' : 'text-muted-foreground')}>
                              <SelectValue placeholder="Seleccionar tipo de documento" />
                            </SelectTrigger>
                            <SelectContent>
                              {documenTypes?.map((documentType) => {
                                return (
                                  <SelectItem key={documentType.id} value={documentType.id}>
                                    {documentType.name}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        )}
                        name={`documents.${index}.id_document_types`}
                        control={control}
                        rules={{
                          required: 'Este campo es requerido',
                        }}
                      />
                      {errors.documents && errors.documents[index] && errors?.documents?.[index]?.id_document_types && (
                        <CardDescription className="text-red-700 m-0">
                          {errors?.documents?.[index]?.id_document_types?.message}
                        </CardDescription>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Documento</Label>
                      <Controller
                        render={({ field }) => (
                          <Input
                            type="file"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);

                              if (e?.target?.files?.[0] && files) {
                                files[index] = e.target.files[0];
                              }
                            }}
                            className={cn(field.value ? 'text-red-white' : 'text-muted-foreground')}
                          />
                        )}
                        name={`documents.${index}.file`}
                        control={control}
                        rules={{ required: 'El documento es requerido' }}
                      />

                      <CardDescription>Sube el documento que deseas vincular a los recursos</CardDescription>
                      {errors.documents && errors.documents[index] && errors?.documents?.[index]?.file && (
                        <CardDescription className="text-red-700 mt-0">
                          {errors?.documents?.[index]?.file?.message}
                        </CardDescription>
                      )}
                    </div>
                    {hasExpired && (
                      <div className="space-y-2">
                        <div className="flex flex-col gap-3">
                          <Label>Fecha de vencimiento</Label>
                          <Controller
                            render={({ field }) => (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant={'outline'}
                                    className={cn(
                                      ' justify-start text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                      format(field.value, 'PPP', { locale: es })
                                    ) : (
                                      <span>Fecha de vencimiento</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="flex w-full flex-col space-y-2 p-2">
                                  <Select
                                    onValueChange={(e) => {
                                      setMonth(new Date(e));
                                      setYear(e);
                                      const newYear = parseInt(e, 10);
                                      const dateWithNewYear = new Date(field.value);
                                      dateWithNewYear.setFullYear(newYear);
                                      field.onChange(dateWithNewYear);
                                      setMonth(dateWithNewYear);
                                    }}
                                    value={years || today.getFullYear().toString()}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Elegir año" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                      {yearsAhead?.map((year) => (
                                        <SelectItem key={year} value={`${year}`}>
                                          {year}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <div className="rounded-md border w-full">
                                    <Calendar
                                      month={month}
                                      onMonthChange={setMonth}
                                      fromDate={today}
                                      locale={es}
                                      mode="single"
                                      selected={new Date(field.value) || today}
                                      onSelect={(e) => {
                                        field.onChange(e);
                                      }}
                                    />
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                            name={`documents.${index}.validity`}
                            control={control}
                            rules={hasExpired ? { required: 'Falta la fecha de vencimiento' } : undefined}
                          />
                        </div>
                        {errors.documents && errors.documents[index] && errors?.documents?.[index]?.validity && (
                          <CardDescription className="text-red-700 mt-0">
                            {errors?.documents?.[index]?.validity?.message}
                          </CardDescription>
                        )}
                        <CardDescription>La fecha de vencimiento del documento</CardDescription>
                      </div>
                    )}
                    {isMontlhy && (
                      <div className="space-y-2">
                        <div className="flex flex-col gap-3">
                          <Label>Periodo</Label>
                          <Controller
                            render={({ field }) => (
                              <Input
                                placeholder="Seleccionar periodo"
                                type="month"
                                min={new Date().toISOString().split('T')[0]}
                                onChange={field.onChange}
                              />
                            )}
                            name={`documents.${index}.period`}
                            control={control}
                            rules={isMontlhy ? { required: 'Falta seleccionar el periodo' } : undefined}
                          />
                        </div>
                        {errors.documents && errors.documents[index] && errors?.documents?.[index]?.period && (
                          <CardDescription className="text-red-700 mt-0">
                            {errors?.documents?.[index]?.period?.message}
                          </CardDescription>
                        )}
                        <CardDescription>
                          El documento es mensual, debe seleccioar el periodo al que aplica
                        </CardDescription>
                      </div>
                    )}

                    {fields.length > 1 && (
                      <Button
                        variant={'destructive'}
                        onClick={() => {
                          remove(index);
                          setFiles(files?.filter((_, i) => i !== index));
                        }}
                      >
                        Eliminar
                      </Button>
                    )}
                  </li>
                </details>
                <Separator />
              </React.Fragment>
            );
          })}
        </div>
        <div className="w-full flex justify-end">
          <Button
            className=" w-8 h-8 bg-blue-400 rounded-full hover:bg-blue-500 transition-colors duration-200 ease-in-out"
            onClick={() =>
              append({
                applies: '',
                id_document_types: '',
                file: '',
                validity: '',
                user_id: user,
                period: null || '',
              })
            }
          >
            <PlusCircledIcon className=" h-4 w-4 shrink-0" />
          </Button>
        </div>
      </ul>
      <div className="flex justify-evenly mt-2">
        <AlertDialogCancel className="text-black dark:bg-white hover:text-black/50" asChild>
          <Button onClick={() => handleOpen()}>Cancelar</Button>
        </AlertDialogCancel>

        <Button disabled={loading} type="submit">
          {loading ? 'Enviando' : 'Enviar documentos'}
        </Button>
      </div>
    </form>
  );
}
