'use client'

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
import { useDocument } from '@/hooks/useDocuments'
import { cn } from '@/lib/utils'
import { DocumentsValidation } from '@/store/documentValidation'
import { useLoggedUserStore } from '@/store/loggedUser'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarIcon,
  CaretSortIcon,
  CheckIcon,
  MinusCircledIcon,
} from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSearchParams } from 'next/navigation'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { any, z } from 'zod'
import { supabase } from '../../supabase/supabase'
import { Calendar } from './ui/calendar'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { useToast } from './ui/use-toast'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'

export default function SimpleDocument({
  resource,
  index,
  refSubmit,
  handleOpen,
}: {
  resource: string | undefined
  index: number
  refSubmit: React.RefObject<HTMLButtonElement>
  handleOpen: () => void
}) {
  const searchParams = useSearchParams()
  const document = searchParams.get('document')
  const id = searchParams.get('id')
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [documenTypes, setDocumentTypes] = useState<any[] | null>([])
  const [expiredDate, setExpiredDate] = useState(false)
  const {
    fetchEquipmentByDocument,
    fetchEmployeeByDocument,
    insertDocumentEmployees,
    insertDocumentEquipment,
    updateDocumentEmployees,
    updateDocumentEquipment,
    uploadDocumentFile,
  } = useDocument()
  console.log("Este console viene del no--multirecurso")
  const formSchema = z.object({
    id_document_types: z
      .string({
        required_error: 'Falta seleccionar el tipo de documento',
      })
      .optional(),
    validity: expiredDate
      ? z.date({ required_error: 'Falta ingresar la fecha de vencimiento' })
      : z.date().optional(),
    document: z.string().optional(),
    applies:
      resource?.toLowerCase() === 'empleado'
        ? z.string().optional()
        : z.string().optional(),
  })

  const { toast } = useToast()
  const fetchDocumentTypes = async () => {
    const applies = resource === 'empleado' ? 'Persona' : 'Equipos'

    let { data: document_types, error } = await supabase
      .from('document_types')
      .select('*')
      .eq('applies', applies)
      .eq('multiresource', false)

    setDocumentTypes(document_types)
  }
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })
  ////////////////////////////////////////////////////////////////////////
  const [equipmentData, setEquipmentData] = useState<any>(null)
  if (id) {
    const equipment = async () => {
      //console.log('Valor de document:', id)
      const data = await fetchEquipmentByDocument(id as any)
      //console.log('Datos obtenidos del empleado:', data)
      setEquipmentData(data)
    }
    //console.log('equipmentData: ', equipmentData)
    useEffect(() => {
      equipment()
    }, [])
  } else {
    const employee = async () => {
      //console.log('Valor de document:', document)
      const data = await fetchEmployeeByDocument(document as any)
      //console.log('Datos obtenidos del empleado:', data)
      setEmployeeData(data)
    }
    useEffect(() => {
      employee()
    }, [])
  }
  //console.log('este employee data: ', employeeData)

  ////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    form.reset()
    setFiles(undefined)
    fetchDocumentTypes()
    document && form.setValue('applies', document)
    id && form.setValue('applies', id)
  }, [resource])

  const [files, setFiles] = useState<File | undefined>(undefined)
  const setTotalForms = DocumentsValidation(state => state.setTotalForms)
  const deleteDocument = DocumentsValidation(state => state.deleteDocument)

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

  const user = useLoggedUserStore(state => state.credentialUser?.id)
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
  const updateDocumentErrors = DocumentsValidation(
    state => state.updateDocumentErrors,
  )
  const hasErrors = DocumentsValidation(state => state.hasErrors)
  const documentsErrors = DocumentsValidation(state => state.documentsErrors)
  const setLoading = DocumentsValidation(state => state.setLoading)

  const handleInvalidForm = () => {
    if (documentsErrors[index] === undefined) {
      updateDocumentErrors(index, true)
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    const matchingDocument = employeeData?.find(
      (doc: any) => doc.id_document_types === values.id_document_types,
    )?.id

    const matchingDocumentState = employeeData?.find(
      (doc: any) => doc.id_document_types === values.id_document_types,
    )?.state

    const matchingEquipment = equipmentData?.find(
      (doc: any) => doc.id_document_types === values.id_document_types,
    )?.id
    const matchingEquipmentState = equipmentData?.find(
      (doc: any) => doc.id_document_types === values.id_document_types,
    )?.state
    // console.log('match: ', matchingDocumentState)
    if (expiredDate) {
      if (!values.validity) {
        form.setError('validity', {
          message: 'La fecha de vencimiento es requerida',
        })
        return handleInvalidForm()
      }
    }
    if (!document && !id && !values.applies) {
      form.setError('applies', { message: 'El recurso es requerido' })
      return handleInvalidForm()
    }
    if (!files?.name && !values.applies) {
      form.setError('document', { message: 'El documento es requerido' })
      form.setError('applies', { message: 'El recurso es requerido' })
      return handleInvalidForm()
    } else if (!values.applies) {
      form.setError('applies', { message: 'El documento es requerido' })
      return handleInvalidForm()
    } else if (!values.id_document_types) {
      form.setError('id_document_types', {
        message: 'El tipo de documento es requerido',
      })
      return handleInvalidForm()
    } else if (!files?.name) {
      form.setError('document', { message: 'El documento es requerido' })
      return handleInvalidForm()
    } else {
      form.clearErrors()
      updateDocumentErrors(index, false)
    }

    if (!hasErrors) {
      // const fileExtension = files.name.split('.').pop()
      // const document_type_name = documenTypes
      //   ?.find(documentType => documentType.id === values.id_document_types)
      //   ?.name.replace(/\s/g, '')
      // const renamedFile = new File(
      //   [files],
      //   `${id || document || values.applies}-${document_type_name
      //     .trim()
      //     .replace(/\s/g, '')}.${fileExtension}`
      //     .trim()
      //     .replace(/\s/g, ''),
      //   {
      //     type: files.type,
      //   },
      // )
      const fileExtension = files.name.split('.').pop()
      const document_type_name = documenTypes
        ?.find(documentType => documentType.id === values.id_document_types)
        ?.name.normalize('NFD') // Normaliza los caracteres a su forma de descomposición canónica
        .replace(/[\u0300-\u036f]/g, '') // Elimina los diacríticos (acentos)
        .replace(/\s/g, '')

      const renamedFile = new File(
        [files],
        `${id || document || values.applies}-${document_type_name
          .trim()
          .replace(/\s/g, '')}.${fileExtension}`
          .trim()
          .replace(/\s/g, ''),
        {
          type: files.type,
        },
      )
      //console.log(renamedFile, 'renamedFile')
      setFiles(renamedFile)
      const fileUrl = await uploadDocumentFile(renamedFile, 'document_files')

      setLoading(true)
      let finalValues: any
      if (resource === 'equipo') {
        const vehicle_id = vehicles?.find((vehicle: any) => {
          return (
            vehicle?.id === values.applies ||
            vehicle?.document === values.applies ||
            vehicle?.name === values.applies
          )
        })?.id
        if (matchingEquipmentState !== 'aprobado') {
          if (matchingEquipment) {
            const documentIdToUpdate = matchingEquipment
            finalValues = {
              ...values,
              document_url: fileUrl,
              id_storage: null,
              is_active: true,
              applies: vehicle_id,
              user_id: user,
              state: 'presentado',
              id_document_types: values.id_document_types,
            }
            //console.log('equipmentData: ', equipmentData)
            //console.log('matching Equipment: ', matchingEquipment)
            //console.log('document Id To Update: ', documentIdToUpdate)
            updateDocumentEquipment(documentIdToUpdate, finalValues)
          } else {
            finalValues = {
              ...values,
              document_url: fileUrl,
              id_storage: null,
              is_active: true,
              applies: vehicle_id,
              user_id: user,
              id_document_types: values.id_document_types,
            }
            insertDocumentEquipment(finalValues)
          }
          toast({
            title: 'Documento cargado',
            description: 'El documento fue cargado con éxito',
          })
        } else {
          toast({
            title: 'Documento No cargado',
            description: 'El documento no fue cargado por que ya fue aprobado',
            variant: 'destructive',
          })
        }
      } else {
        const user_id = employees?.find(
          (e: any) => e?.document === values.applies,
        )?.id
        if (matchingDocumentState !== 'aprobado') {
          if (matchingDocument) {
            const documentIdToUpdate = matchingDocument
            finalValues = {
              ...values,
              document_url: fileUrl,
              id_storage: null,
              is_active: true,
              applies: user_id,
              user_id: user,
              id_document_types: values.id_document_types,
            }

            //console.log('employeeData: ', employeeData)
            updateDocumentEmployees(documentIdToUpdate, finalValues)
          } else {
            finalValues = {
              ...values,
              document_url: fileUrl,
              id_storage: null,
              is_active: true,
              applies: user_id,
              user_id: user,
              id_document_types: values.id_document_types,
            }

            insertDocumentEmployees(finalValues)
          }
          toast({
            title: 'Documento cargado',
            description: 'El documento fue cargado con éxito',
          })
        } else {
          toast({
            title: 'Documento No cargado',
            description: 'El documento no fue cargado por que ya fue aprobado',
            variant: 'destructive',
          })
        }
      }
      handleOpen()
    }
    setIsSubmitting(false)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filteredResources, setFilteredResources] = useState(data)
  const [inputValue, setInputValue] = useState<string>('')
  let url: undefined | string = undefined

  if (window !== undefined) {
    url = window.location.href
  }

  return (
    <>
      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue="item-1"
        asChild
      >
        <AccordionItem value={`item-${index + 1}`}>
          <AccordionTrigger
            defaultValue="item-1"
            className="text-lg flex relative"
          >{`Documento ${index + 1}`}</AccordionTrigger>
          <AccordionContent>
            {index !== 0 && (
              <MinusCircledIcon
                onClick={() => {
                  setTotalForms(false)
                  deleteDocument(index)
                }}
                className="h-4 w-4 shrink-0 absolute right-3 top-1 text-red-800 cursor-pointer"
              />
            )}
            <div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  {!document && !id && (
                    <FormField
                      control={form.control}
                      name="applies"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>
                            {resource === 'equipo' ? 'Equipos' : 'Empleados'}
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    ' justify-between',
                                    !field.value && 'text-muted-foreground',
                                  )}
                                >
                                  {field.value
                                    ? data?.find(
                                        (employee: any) =>
                                          employee.document === field.value ||
                                          employee.name === field.value,
                                      )?.name
                                    : `Seleccionar ${
                                        resource === 'equipo'
                                          ? 'equipo'
                                          : 'empleado'
                                      }`}
                                  <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
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
                                            person.document.includes(inputValue)
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
                                  {filteredResources?.map((employee: any) => {
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
                                          form.setValue(
                                            'applies',
                                            employee.document,
                                          )
                                        }}
                                      >
                                        {employee.name}
                                        <CheckIcon
                                          className={cn(
                                            'ml-auto h-4 w-4',
                                            employee.name === field.value ||
                                              employee.document === field.value
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
                            Selecciona el{' '}
                            {resource === 'equipo' ? 'equipo' : 'empleado'} al
                            que deseas vincular el documento
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="id_document_types"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Seleccione el tipo de documento que desea subir
                        </FormLabel>
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
                              <SelectValue placeholder="Seleccionar documento" />
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
                                files?.name || 'Seleccionar documento'
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
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>,
                              ) => {
                                setFiles(event.target.files?.[0])
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
                                    <span>
                                      Seleccionar fecha de vencimiento
                                    </span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="center"
                            >
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
                  <div className=" justify-evenly hidden">
                    <Button
                      ref={refSubmit}
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enviando...' : 'Subir documentos'}
                      Subir documentos
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  )
}
