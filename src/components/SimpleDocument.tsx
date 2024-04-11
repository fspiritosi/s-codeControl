import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CaretSortIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import { addMonths, format } from 'date-fns'
import { Calendar as CalendarIcon, CheckIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { Button } from './ui/button'
import { CardDescription } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Separator } from './ui/separator'

import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useLoggedUserStore } from '@/store/loggedUser'
import { es } from 'date-fns/locale'
import { supabase } from '../../supabase/supabase'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from './ui/command'
import { useToast } from './ui/use-toast'

export default function SimpleDocument({
  resource,
  handleOpen,
}: {
  resource: string | undefined
  handleOpen: () => void
}) {
  const searchParams = useSearchParams()
  const documentResource = searchParams.get('document')
  const [defaultResource, setDefaultResource] = useState<string | null>('')
  const id = searchParams.get('id')
  const user = useLoggedUserStore(state => state.credentialUser?.id)
  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    getValues,
    setValue,
  } = useForm({
    defaultValues: {
      documents: [
        {
          applies: '',
          id_document_types: '',
          file: '',
          validity: '',
          user_id: user,
        },
      ],
    },
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'documents',
  })
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const onSubmit = async ({ documents }: any) => {
    setLoading(true)
    let hasError = false
    try {
      const idApplies =
        id ||
        employees.find(
          (employee: any) => employee.document === documentResource,
        )?.id
      const tableEntries = documents.map((entry: any) => {
        return {
          applies: entry.applies || idApplies,
          id_document_types: entry.id_document_types,
          validity: entry.validity
            ? format(entry.validity, 'dd/MM/yyyy')
            : null,
          user_id: user,
        }
      })
      for (let index = 0; index < documents.length; index++) {
        const document = documents[index]
        const document_type_name = documenTypes
          ?.find(documentType => documentType.id === document.id_document_types)
          ?.name.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s/g, '')
          .toLowerCase()
          .replace('/', '-')

        const storagePath =
          resource === 'empleado'
            ? 'documentos-empleados'
            : 'documentos-equipos'

        const { data } = await supabase.storage
          .from('document_files')
          .list(storagePath, {
            search: `document-${document_type_name}-${tableEntries[index].applies}`,
          })

        if (data?.length && data?.length > 0) {
          setError(`documents.${index}.id_document_types`, {
            message: 'El documento ya ha sido subido anteriormente',
            type: 'validate',
            types: {
              validate: 'El documento ya ha sido subido anteriormente',
            },
          })
          setLoading(false)
          hasError = true
          return
        }

        if (hasError) {
          return setLoading(false)
        }
        const fileExtension = document.file.split('.').pop()

        const tableName =
          resource === 'empleado'
            ? 'documents_employees'
            : 'documents_equipment'

        const { error } = await supabase
          .from(tableName)
          .insert(tableEntries[index])
          .select()

        if (error) {
          console.error(error)
          toast({
            title: 'Error',
            description: 'Hubo un error al subir los documentos (storage)',
            variant: 'destructive',
          })
          setLoading(false)
          hasError = true
          return
        }

        const { error: storageError } = await supabase.storage
          .from('document_files')
          .upload(
            `/${storagePath}/document-${document_type_name}-${tableEntries[index].applies}.${fileExtension}`,
            files?.[index] || document.file,
            {
              cacheControl: '3600',
              upsert: false,
            },
          )

        if (storageError) {
          toast({
            title: 'Error',
            description: 'Hubo un error al subir los documentos (storage)',
            variant: 'destructive',
          })
          setLoading(false)
          hasError = true
          return
        }
      }

      if (hasError) {
        return setLoading(false)
      }

      toast({
        title: 'Éxito',
        description: 'Documentos subidos correctamente',
        variant: 'default',
      })
      setLoading(false)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Hubo un error al subir los documentos',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }
  const [documenTypes, setDocumentTypes] = useState<any[] | null>([])

  const fetchDocumentTypes = async () => {
    const applies = resource === 'empleado' ? 'Persona' : 'Equipos'

    let { data: document_types, error } = await supabase
      .from('document_types')
      .select('*')
      .eq('applies', applies)
      .eq('multiresource', false)

    setDocumentTypes(document_types)
  }
  
  useEffect(() => {
    fetchDocumentTypes()
    if (documentResource || id) {
      setDefaultResource(documentResource || id)
    }
  }, [resource])

  const today = new Date()
  const nextMonth = addMonths(new Date(), 1)
  const [month, setMonth] = useState<Date>(nextMonth)

  const yearsAhead = Array.from({ length: 20 }, (_, index) => {
    const year = today.getFullYear() + index + 1
    return year
  })

  const employees = useLoggedUserStore(state => state.employees)?.reduce(
    (
      acc: any,
      act: { full_name: string; document_number: string; id: string },
    ) => {
      const data = {
        name: act.full_name,
        document: act.document_number,
        id: act.id,
      }
      return [...acc, data]
    },
    [],
  )
  const vehicles = useLoggedUserStore(state => state.vehicles)?.reduce(
    (acc: any, act: { domain: string; serie: string; id: string }) => {
      const data = {
        name: act.domain || act.serie,
        document: act.serie || act.domain,
        id: act.id,
      }
      return [...acc, data]
    },
    [],
  )
  const data = resource === 'empleado' ? employees : vehicles
  const [filteredResources, setFilteredResources] = useState(data)
  const [inputValue, setInputValue] = useState<string>('')
  const [hasExpired, setHasExpired] = useState(false)
  const [duplicatedDocument, setDuplicatedDocument] = useState(false)
  const [files, setFiles] = useState<File[] | undefined>([])

  // console.log(documentResource, 'documentResource')

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ul className="flex flex-col gap-2">
        <div className="space-y-3">
          {fields.map((item, index) => {
            return (
              <React.Fragment key={item.id}>
                <details open={index === 0}>
                  <summary
                    className={cn(
                      errors.documents &&
                        errors.documents[index] &&
                        errors?.documents?.[index] &&
                        'text-red-600',
                      'text-xl flex justify-between items-center cursor-pointer',
                    )}
                  >
                    Documento {index + 1}
                  </summary>
                  <li className="space-y-4 ">
                    {(!id && !documentResource) && (
                      <div className="space-y-2 py-3 ">
                        <Label className="block">Empleados</Label>
                        <Controller
                          render={({ field }) => {
                            const selectedResourceName = data.find(
                              (resource: any) => resource.id === field.value,
                            )?.name

                            return (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      ' justify-between w-full',
                                      !field.value && 'text-muted-foreground',
                                    )}
                                  >
                                    {field.value && selectedResourceName
                                      ? data?.find(
                                          (employee: any) =>
                                            employee.id === field.value ||
                                            employee.name === field.value,
                                        )?.name
                                      : `Seleccionar ${
                                          resource === 'equipo'
                                            ? 'equipo'
                                            : 'empleado'
                                        }`}
                                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className=" p-0">
                                  <Command>
                                    <CommandInput
                                      placeholder={`Buscar ${
                                        resource === 'equipo'
                                          ? 'equipo'
                                          : 'empleado'
                                      }`}
                                      className="h-9"
                                      onFocus={() => {
                                        setFilteredResources(data)
                                      }}
                                      onInput={e => {
                                        const inputValue = (
                                          e.target as HTMLInputElement
                                        ).value.toLowerCase()
                                        setInputValue(inputValue)
                                        const isNumberInput = /^\d+$/.test(
                                          inputValue,
                                        )
                                        const filteredresources = data.filter(
                                          (person: any) => {
                                            if (isNumberInput) {
                                              return person.document.includes(
                                                inputValue,
                                              )
                                            } else {
                                              return (
                                                person.name
                                                  .toLowerCase()
                                                  .includes(inputValue) ||
                                                person.document.includes(
                                                  inputValue,
                                                )
                                              )
                                            }
                                          },
                                        )
                                        setFilteredResources(filteredresources)
                                      }}
                                    />
                                    <CommandEmpty>
                                      {filteredResources?.length === 0 &&
                                        inputValue.length > 0 &&
                                        'No se encontraron resultados'}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {filteredResources?.map(
                                        (employee: any) => {
                                          const key = /^\d+$/.test(inputValue)
                                            ? employee.document
                                            : employee.name
                                          const value = /^\d+$/.test(inputValue)
                                            ? employee.document
                                            : employee.name
                                          return (
                                            <CommandItem
                                              value={value}
                                              key={key}
                                              onSelect={() => {
                                                const id = data.find(
                                                  (resource: any) =>
                                                    resource.name === value ||
                                                    resource.document === value,
                                                ).id

                                                const resource =
                                                  getValues('documents')[index]
                                                    .id_document_types
                                                setDuplicatedDocument(
                                                  getValues('documents').some(
                                                    (
                                                      document: any,
                                                      document_index,
                                                    ) => {
                                                      return (
                                                        index !==
                                                          document_index &&
                                                        document.id_document_types ===
                                                          resource &&
                                                        document.applies === id
                                                      )
                                                    },
                                                  ),
                                                )
                                                id
                                                field.onChange(id)
                                              }}
                                            >
                                              {employee.name}
                                              <CheckIcon
                                                className={cn(
                                                  'ml-auto h-4 w-4',
                                                  employee.name ===
                                                    field.value ||
                                                    employee.document ===
                                                      field.value
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                                )}
                                              />
                                            </CommandItem>
                                          )
                                        },
                                      )}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            )
                          }}
                          name={`documents.${index}.applies`}
                          control={control}
                          rules={
                            !id || !documentResource
                              ? { required: 'Este campo es requerido' }
                              : {}
                          }
                        />
                        <CardDescription>
                          Selecciona el empleado al que deseas vincular el
                          documento
                        </CardDescription>
                        {errors.documents &&
                          errors.documents[index] &&
                          errors?.documents?.[index]?.applies && (
                            <CardDescription className="text-red-700 mt-0 m-0">
                              {errors?.documents?.[index]?.applies?.message}
                            </CardDescription>
                          )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>
                        Seleccione el tipo de documento a vincular al recurso
                      </Label>
                      <Controller
                        render={({ field }) => (
                          <Select
                            onValueChange={e => {
                              const selected = documenTypes?.find(
                                doc => doc.id === e,
                              )
                              setHasExpired(selected.explired)
                              const resource =
                                getValues('documents')[index].applies

                              setDuplicatedDocument(
                                getValues('documents').some(
                                  (document: any, document_index) => {
                                    index !== document_index &&
                                      document.id_document_types === e &&
                                      document.applies === resource
                                  },
                                ),
                              )
                              if (duplicatedDocument) {
                                return setError(
                                  `documents.${index}.id_document_types`,
                                  {
                                    message:
                                      'El documento ya ha sido seleccionado',
                                    type: 'validate',
                                    types: {
                                      validate:
                                        'El documento ya ha sido seleccionado',
                                    },
                                  },
                                )
                              } else {
                                clearErrors(
                                  `documents.${index}.id_document_types`,
                                )
                                field.onChange(e)
                              }
                            }}
                            defaultValue={field.value}
                          >
                            <SelectTrigger
                              className={cn(
                                field.value
                                  ? 'text-red-white'
                                  : 'text-muted-foreground',
                              )}
                            >
                              <SelectValue placeholder="Seleccionar tipo de documento" />
                            </SelectTrigger>
                            <SelectContent>
                              {documenTypes?.map(documentType => {
                                return (
                                  <SelectItem
                                    key={documentType.id}
                                    value={documentType.id}
                                  >
                                    {documentType.name}
                                  </SelectItem>
                                )
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
                      {errors.documents &&
                        errors.documents[index] &&
                        errors?.documents?.[index]?.id_document_types && (
                          <CardDescription className="text-red-700 m-0">
                            {
                              errors?.documents?.[index]?.id_document_types
                                ?.message
                            }
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
                            onChange={e => {
                              field.onChange(e)

                              if (e?.target?.files?.[0] && files) {
                                files[index] = e.target.files[0]
                              }
                            }}
                            className={cn(
                              field.value
                                ? 'text-red-white'
                                : 'text-muted-foreground',
                            )}
                          />
                        )}
                        name={`documents.${index}.file`}
                        control={control}
                        rules={{ required: 'El documento es requerido' }}
                      />

                      <CardDescription>
                        Sube el documento que deseas vincular a los recursos
                      </CardDescription>
                      {errors.documents &&
                        errors.documents[index] &&
                        errors?.documents?.[index]?.file && (
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
                                      !field.value && 'text-muted-foreground',
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
                                <PopoverContent className="flex w-full flex-col space-y-2 p-2 ">
                                  <Select
                                    onValueChange={e => {
                                      const actualSelectedDate = format(
                                        field.value || today,
                                        'dd/MM/yyyy',
                                        { locale: es },
                                      )
                                      const finalDate = new Date(
                                        `${actualSelectedDate.split('/')[1]}/${
                                          actualSelectedDate.split('/')[0]
                                        }/${e}`,
                                      )
                                      field.onChange(finalDate)
                                      setMonth(new Date(e))
                                    }}
                                    defaultValue={format(
                                      field.value || new Date(),
                                      'yyyy',
                                      { locale: es },
                                    )}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Elegir año" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                      {yearsAhead.map(year => (
                                        <SelectItem
                                          key={year}
                                          value={`${year}`}
                                        >
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
                                      onSelect={e => {
                                        field.onChange(e)
                                      }}
                                    />
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                            name={`documents.${index}.validity`}
                            control={control}
                            rules={
                              hasExpired
                                ? { required: 'Falta la fecha de vencimiento' }
                                : undefined
                            }
                          />
                        </div>
                        {errors.documents &&
                          errors.documents[index] &&
                          errors?.documents?.[index]?.validity && (
                            <CardDescription className="text-red-700 mt-0">
                              {errors?.documents?.[index]?.validity?.message}
                            </CardDescription>
                          )}
                        <CardDescription>
                          La fecha de vencimiento del documento
                        </CardDescription>
                      </div>
                    )}

                    {fields.length > 1 && (
                      <Button
                        variant={'destructive'}
                        onClick={() => {
                          remove(index)
                          setFiles(files?.filter((_, i) => i !== index))
                        }}
                      >
                        Eliminar
                      </Button>
                    )}
                  </li>
                </details>
                <Separator />
              </React.Fragment>
            )
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
              })
            }
          >
            <PlusCircledIcon className=" h-4 w-4 shrink-0" />
          </Button>
        </div>
      </ul>
      <div className="flex justify-evenly mt-2">
        <Button onClick={() => handleOpen()}>Cancelar</Button>
        <Button disabled={loading} type="submit">
          {loading ? 'Enviando' : 'Enviar documentos'}
        </Button>
      </div>
    </form>
  )
}
