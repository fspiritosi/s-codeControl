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
import { cn } from '@/lib/utils'
import { useLoggedUserStore } from '@/store/loggedUser'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSearchParams } from 'next/navigation'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { supabase } from '../../supabase/supabase'
import { Calendar } from './ui/calendar'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { Switch } from './ui/switch'
import { useDocument } from '@/hooks/useDocuments'
import { profile } from 'console'
import { useToast } from './ui/use-toast'

export default function SimpleDocument({
  resource,
  handleOpen,
}: {
  resource: string | undefined
  handleOpen?: () => void
}) {
  const searchParams = useSearchParams()
  const document = searchParams.get('document')
  const id = searchParams.get('id')
  const [documenTypes, setDocumentTypes] = useState<any[] | null>([])
  const [expiredDate, setExpiredDate] = useState(false)
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

  useEffect(() => {
    form.reset()
    setFiles(undefined)
    fetchDocumentTypes()
    document && form.setValue('applies', document)
    id && form.setValue('applies', id)
  }, [resource])
  const [files, setFiles] = useState<File | undefined>(undefined)

  const formSchema = z.object({
    id_document_types: z.string({
      required_error: 'Falta seleccionar el tipo de documento',
    }),
    validity: expiredDate
      ? z.date({ required_error: 'Falta ingresar la fecha de vencimiento' })
      : z.date().optional(),
    document: z.string().optional(),
    applies:
      resource?.toLowerCase() === 'empleado'
        ? z.string().optional()
        : z.string(),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })
  const {
    insertDocumentEmployees,
    insertDocumentEquipment,
    uploadDocumentFile,
  } = useDocument()

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!files?.name) {
      form.setError('document', { message: 'El documento es requerido' })
      return
    }
    const fileUrl = await uploadDocumentFile(files, 'document_files')

    const vehicle_id = vehicles?.find((vehicle: any) => {
      return (
        vehicle?.id === values.applies ||
        vehicle?.document === values.applies ||
        vehicle?.name === values.applies
      )
    })?.id

    const user_id = employees?.find((e: any) => e?.document === values.applies)
      ?.id

    let finalValues
    if (resource === 'equipo') {
      //finalValues = { ...values, document: files, applies: vehicle_id }
      finalValues = {
        ...values,
        document_url: fileUrl,
        id_storage: null,
        state: 'presentado',
        is_active: true,
        applies: vehicle_id,
        user_id: user,
      }

      insertDocumentEquipment(finalValues)
    } else {
      //finalValues = { ...values, document: files, applies: user_id }
      finalValues = {
        ...values,
        document_url: fileUrl,
        id_storage: null,
        state: 'presentado',
        is_active: true,
        applies: user_id,
        user_id: user,
      }

      insertDocumentEmployees(finalValues)
    }

    toast({
      title: 'Documento cargado',
      description: 'El documento fue cargado con éxito',
    })

    //console.log(finalValues, 'values')
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filteredResources, setFilteredResources] = useState(data)
  const [inputValue, setInputValue] = useState<string>('')
  let url: undefined | string = undefined

  if (window !== undefined) {
    url = window.location.href
  }
  return (
    <div>
      <h2 className="text-lg font-semibold">Documento No multirecurso</h2>
      <Separator className="my-1" />
      <p className="text-sm text-muted-foreground mb-3">
        Sube los documentos que necesitas
      </p>
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                                  resource === 'equipo' ? 'equipo' : 'empleado'
                                }`}
                            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className=" p-0">
                        <Command>
                          <CommandInput
                            placeholder={`Buscar ${
                              resource === 'equipo' ? 'equipo' : 'empleado'
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
                              const isNumberInput = /^\d+$/.test(inputValue)

                              const filteredresources = data.filter(
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
                                    form.setValue('applies', employee.document)
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
                      {resource === 'equipo' ? 'equipo' : 'empleado'} al que
                      deseas vincular el documento
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
                    onValueChange={field.onChange}
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
                        placeholder={files?.name || 'Seleccionar documento'}
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
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
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
            <div className="flex items-center space-x-2">
              <Label htmlFor="expired">¿Tiene fecha de vencimiento?</Label>
              <Switch
                id="expired"
                onCheckedChange={() => setExpiredDate(!expiredDate)}
              />
            </div>
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
            <Separator className="my-1" />
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
