'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarIcon,
  CaretSortIcon,
  CheckIcon,
  Cross1Icon,
} from '@radix-ui/react-icons'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useLoggedUserStore } from '@/store/loggedUser'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { supabase } from '../../supabase/supabase'
import { Badge } from './ui/badge'
import { Calendar } from './ui/calendar'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { Switch } from './ui/switch'
import { useDocument } from '@/hooks/useDocuments'

export default function MultiResourceDocument({
  resource,
  handleOpen,
}: {
  resource: string | undefined
  handleOpen: () => void
}) {
  const [documenTypes, setDocumentTypes] = useState<any[] | null>([])
  const [expiredDate, setExpiredDate] = useState(false)
  const vehicles = useLoggedUserStore(state => state.vehicles)?.reduce(
    (acc: any, act: { year: string; intern_number: string; id: string }) => {
      const data = {
        name: act.intern_number,
        document: act.year,
        id: act.id,
      }
      return [...acc, data]
    },
    [],
  )
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
  const resources = resource === 'empleado' ? employees : vehicles

  const [file, setFile] = useState<File | undefined>()

  const fetchDocumentTypes = async () => {
    const applies = resource === 'empleado' ? 'Persona' : 'Equipos'
    let { data: document_types, error } = await supabase
      .from('document_types')
      .select('*')
      .eq('applies', applies)
      .eq('multiresource', true)

    setDocumentTypes(document_types)
  }

  useEffect(() => {
    form.reset()
    setFile(undefined)
    setSelectedResources([])
    fetchDocumentTypes()
  }, [resource])

  const formSchema = z.object({
    document: z
      .string()
      .refine(
        _ => {
          if (file?.name) return true
          return false
        },
        { message: 'Por favor, selecciona un documento' },
      )
      .optional(),

    id_document_types: z.string({
      required_error: 'Por favor, selecciona un tipo de documento',
    }),
    resources: z
      .array(z.string(), { required_error: 'Los recursos son requeridos' })
      .min(1, 'Selecciona al menos dos recursos')
      .optional(), //! Cambiar a 1 si se necesita que sea solo uno
    validity: expiredDate
      ? z.date({ required_error: 'Falta ingresar la fecha de vencimiento' })
      : z.date().optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resources: [],
    },
  })

  const [filteredResources, setFilteredResources] = useState(resources)
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [inputValue, setInputValue] = useState<string>('')
  const user = useLoggedUserStore(state => state.credentialUser?.id)
  const {
    insertMultiDocumentEmployees,
    insertMultiDocumentEquipment,
    uploadDocumentFile,
  } = useDocument()

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { resources, ...rest } = values
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    if (!file)
      return form.setError('document', {
        message: 'Por favor, selecciona un documento',
      })

    const fileUrl = await uploadDocumentFile(file, 'document_files')
    let finalValues
    const idEmployees = selectedResources.map(resource => {
      const employee = employees.find((element: any) => {
        return element.document === resource
      })
      return employee?.id
    })

    const idVehicles = selectedResources.map(resource => {
      const vehicle = vehicles.find((element: any) => {
        return element.document === resource
      })
      return vehicle?.id
    })
    if (resource === 'equipo') {
      //finalValues = { ...rest, applies: idVehicles, document: file }
      finalValues = {
        ...values,
        document_url: fileUrl,
        id_storage: null,
        state: 'presentado',
        is_active: true,
        applies: idVehicles,
        user_id: user,
      }
      delete finalValues?.resources
      insertMultiDocumentEquipment(finalValues)
    } else {
      //finalValues = { ...rest, document: file, applies: idEmployees }
      finalValues = {
        ...values,
        document_url: fileUrl,
        id_storage: null,
        state: 'presentado',
        is_active: true,
        applies: idEmployees,
        user_id: user,
      }
      delete finalValues?.resources
      insertMultiDocumentEmployees(finalValues)
    }
    //console.log(finalValues)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  let url: undefined | string = undefined
  if (typeof window !== 'undefined') {
    url = window.location.href
  }
  return (
    <div>
      <h2 className="text-lg font-semibold">Documento Multirecurso</h2>
      <Separator className="my-1" />
      <p className="text-sm text-muted-foreground mb-3">
        Este documento estará vinculado a más de un {resource}
      </p>
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="id_document_types"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Documento</FormLabel>
                  <Select
                       onValueChange={e => {
                        field.onChange(e)
                        setExpiredDate(
                          documenTypes?.find(doc => doc.id === e)?.explired,
                        )
                      }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo de documento" />
                      </SelectTrigger>
                    </FormControl>
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

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documento</FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        readOnly
                        type="text"
                        accept=".jpg, .jpeg, .png, .gif, .bmp, .tif, .tiff"
                        onClick={() => fileInputRef?.current?.click()} // Abre el diálogo de selección de archivos
                        className="self-center cursor-pointer"
                        placeholder={
                          file?.name || 'Seleccionar foto o subir foto'
                        }
                      />
                      <Input
                        {...field}
                        value={
                          field.value as
                            | string
                            | number
                            | readonly string[]
                            | undefined
                        }
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg, .jpeg, .png, .gif, .bmp, .tif, .tiff"
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                          setFile(event.target.files?.[0])
                        }}
                        className="self-center hidden"
                        id="fileInput"
                        placeholder="Seleccionar documento"
                        style={{ display: 'none' }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Sube el documento que deseas vincular a los recursos
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resources"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Recursos</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'justify-between',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {`${
                            selectedResources.length || '0'
                          } recursos seleccionados`}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className=" p-0">
                      <Command>
                        <CommandInput
                          placeholder="Buscar recursos..."
                          className="h-9"
                          onFocus={() => {
                            setFilteredResources(resources)
                          }}
                          onInput={e => {
                            const inputValue = (
                              e.target as HTMLInputElement
                            ).value.toLowerCase()
                            setInputValue(inputValue)
                            const isNumberInput = /^\d+$/.test(inputValue)

                            const filteredresources = resources.filter(
                              (person: any) => {
                                if (isNumberInput) {
                                  return person.document.includes(inputValue)
                                } else {
                                  return (
                                    person.name
                                      .toLowerCase()
                                      .includes(inputValue) ||
                                    person.document.includes(inputValue)
                                  )
                                }
                              },
                            )
                            setFilteredResources(filteredresources)
                          }}
                        />
                        <CommandEmpty>
                          No se encontraron recursos con ese nombre o documento
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredResources?.map((person: any) => {
                            const key = /^\d+$/.test(inputValue)
                              ? person.document
                              : person.name
                            const value = /^\d+$/.test(inputValue)
                              ? person.document
                              : person.name

                            return (
                              <CommandItem
                                value={value}
                                key={key}
                                onSelect={() => {
                                  const updatedResources =
                                    selectedResources.includes(person.document)
                                      ? selectedResources.filter(
                                          resource =>
                                            resource !== person.document,
                                        )
                                      : [...selectedResources, person.document]

                                  setSelectedResources(updatedResources)
                                  form.setValue('resources', updatedResources)
                                }}
                              >
                                {person.name}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    selectedResources?.includes(person.document)
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    {` Selecciona al menos dos recursos para vincular el 
                      documento. Puedes buscar por  ${
                        resource === 'empleado' ? 'nombre' : 'numero interno'
                      } o ${resource === 'empleado' ? 'documento' : 'año'}.`}
                    {/* //! Cambiar a 1 si se necesita que sea solo uno */}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {expiredDate && (
              <FormField
                control={form.control}
                name="validity"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de vencimiento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: es })
                            ) : (
                              <span>Seleccionar fecha de vencimiento</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={date => date < new Date()}
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      La fecha de vencimiento del documento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="container overflow-y-scroll max-h-[200px] space-x-1 flex w-full flex-wrap text-sm items-center gap-y-2">
              {selectedResources.map((resource, index) => {
                const resourceData = resources.find((element: any) => {
                  return element.document === resource
                })
                return (
                  <Badge
                    key={index}
                    variant="outline"
                    onClick={() => {
                      const updatedResources = selectedResources.filter(
                        res => res !== resource,
                      )
                      setSelectedResources(updatedResources)
                      form.setValue('resources', updatedResources)
                    }}
                    className="w-fit h-4 cursor-pointer m-0 p-3"
                  >
                    {resourceData?.name}{' '}
                    <Cross1Icon className="ml-2 h-4 w-4 shrink-0 opacity-80 text-red-700" />
                  </Badge>
                )
              })}
            </div>
            <Separator className="m-0 p-0" />
            <div className="flex justify-evenly">
              <Button onClick={handleOpen}>Cancel</Button>
              <Button type="submit">Subir documentos</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
