'use client'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { zodResolver } from '@hookform/resolvers/zod'
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'
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
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { supabase } from '../../supabase/supabase'
import { Input } from './ui/input'

export default function MultiResourceDocument({
  resource,
}: {
  resource: 'empleado' | 'equipo'
}) {
  const [documenTypes, setDocumentTypes] = useState<any[] | null>([])
  const vehicles = useLoggedUserStore(state => state.vehicles)?.reduce(
    (acc: any, act: { year: string; intern_number: string }) => {
      const data = {
        name: act.intern_number,
        document: act.year,
      }
      return [...acc, data]
    },
    [],
  )
  const employees = useLoggedUserStore(state => state.employees)?.reduce(
    (acc: any, act: { full_name: string; document_number: string }) => {
      const data = {
        name: act.full_name,
        document: act.document_number,
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
    fetchDocumentTypes()
  }, [])

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

    documenTypes: z.string({
      required_error: 'Por favor, selecciona un tipo de documento',
    }),
    resources: z
      .array(z.string(), { required_error: 'Los recursos son requeridos' })
      .min(2, 'Selecciona al menos dos recursos'),
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    if (!file)
      return form.setError('document', {
        message: 'Por favor, selecciona un documento',
      })
    const finalValues = { ...values, document: file }
    console.log(finalValues)
  }

  const [open, setOpen] = useState(true)
  const handleOpen = () => {
    setOpen(!open)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <AlertDialog open={open} onOpenChange={handleOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Documento Multirecurso</AlertDialogTitle>
          <AlertDialogDescription>
            Este documento estará vinculado a más de un {resource}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="documenTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
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
                            No se encontraron recursos con ese nombre o
                            documento
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
                                      selectedResources.includes(
                                        person.document,
                                      )
                                        ? selectedResources.filter(
                                            resource =>
                                              resource !== person.document,
                                          )
                                        : [
                                            ...selectedResources,
                                            person.document,
                                          ]

                                    setSelectedResources(updatedResources)
                                    form.setValue('resources', updatedResources)
                                  }}
                                >
                                  {person.name}
                                  <CheckIcon
                                    className={cn(
                                      'ml-auto h-4 w-4',
                                      selectedResources?.includes(
                                        person.document,
                                      )
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
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-evenly">
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <Button type="submit">Subir documentos</Button>
              </div>
            </form>
          </Form>
        </div>

        <AlertDialogFooter></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
