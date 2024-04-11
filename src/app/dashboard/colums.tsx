'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { useEdgeFunctions } from '@/hooks/useEdgeFunctions'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, DotsVerticalIcon } from '@radix-ui/react-icons'
import { ColumnDef } from '@tanstack/react-table'
import { format, formatRelative } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { supabase } from '../../../supabase/supabase'

type Colum = {
  date: string
  allocated_to: string
  documentName: string
  multiresource: string
  validity: string
  id: string
  resource: string
  state: string
  document_number?: string
  mandatory?: string
}
const formSchema = z.object({
  reason_for_termination: z.string({
    required_error: 'La razón de la baja es requerida.',
  }),
  termination_date: z.date({
    required_error: 'La fecha de baja es requerida.',
  }),
})

type DocumentHistory = {
  documents_employees_id: string
  modified_by: string
  updated_at: string
}

export const ExpiredColums: ColumnDef<Colum>[] = [
  {
    id: 'actions',
    cell: ({ row }: { row: any }) => {
      const [showModal, setShowModal] = useState(false)
      const [integerModal, setIntegerModal] = useState(false)
      const [viewModal, setViewModal] = useState(false)
      const [domain, setDomain] = useState('')
      const [documentHistory, setDocumentHistory] = useState<DocumentHistory[]>(
        [],
      )
      //const user = row.original
      const [showInactive, setShowInactive] = useState<boolean>(false)
      const [showDeletedEquipment, setShowDeletedEquipment] = useState(false)

      const equipment = row.original
      const document = row.original

      const handleOpenModal = (id: string) => {
        setDomain(id)
        setShowModal(!showModal)
      }
      // const { fetchDocumentEquipmentByCompany } = useDocument()

      // useEffect(() => {
      //   fetchDocumentEquipmentByCompany
      // }, [])
      const handleOpenIntegerModal = (id: string) => {
        setDomain(id)
        setIntegerModal(!integerModal)
      }

      const handleOpenViewModal = (id: string) => {
        setDomain(id)

        setViewModal(!viewModal)
      }

      const { errorTranslate } = useEdgeFunctions()

      const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          reason_for_termination: undefined,
        },
      })

      const { toast } = useToast()

      async function reintegerDocumentEmployees() {
        try {
          const { data, error } = await supabase
            .from('documents_employees')
            .update({
              is_active: true,
              // termination_date: null,
              // reason_for_termination: null,
            })
            .eq('id', document.id)
            .select()

          setIntegerModal(!integerModal)
          //setInactive(data as any)
          setShowDeletedEquipment(false)
          toast({
            variant: 'default',
            title: 'Equipo reintegrado',
            description: `El equipo ${equipment?.engine} ha sido reintegrado`,
          })
        } catch (error: any) {
          const message = await errorTranslate(error?.message)
          toast({
            variant: 'destructive',
            title: 'Error al reintegrar el equipo',
            description: message,
          })
        }
      }

      async function onSubmit(values: z.infer<typeof formSchema>) {
        const data = {
          ...values,
          termination_date: format(values.termination_date, 'yyyy-MM-dd'),
        }

        try {
          await supabase
            .from('documents_employees')
            .update({
              is_active: false,
              //termination_date: data.termination_date,
              //reason_for_termination: data.reason_for_termination,
            })
            .eq('id', document.id)
            .select()

          setShowModal(!showModal)

          toast({
            variant: 'default',
            title: 'Documento eliminado',
            description: `El documento ${document.name} ha sido dado de baja`,
          })
        } catch (error: any) {
          const message = await errorTranslate(error?.message)
          toast({
            variant: 'destructive',
            title: 'Error al dar de baja el documento',
            description: message,
          })
        }
      }
      const handleToggleInactive = () => {
        setShowInactive(!showInactive)
      }

      async function viewDocumentEmployees() {
        try {
          const { data, error } = await supabase
            .from('documents_employees_logs')
            .select('*, documents_employees(user_id(email))')
            .eq('documents_employees_id', document.id)

          if (data) {
            setDocumentHistory(data)
          }
          //console.log('Datos del documento:', data)
          // console.log('document: ', document.id)
          //setViewModal(!viewModal)
        } catch (error: any) {
          const message = await errorTranslate(error?.message)
          toast({
            variant: 'destructive',
            title: 'Error al reintegrar el equipo',
            description: message,
          })
        }
      }
      useEffect(() => {
        viewDocumentEmployees()
      }, [])

      //console.log('data: ', data)
      return (
        <DropdownMenu>
          {integerModal && (
            <AlertDialog
              defaultOpen
              onOpenChange={() => setIntegerModal(!integerModal)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ¿Estás completamente seguro?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {`Estás a punto de reintegrar el documento ${document.id_document_types}, que fue dado de baja por ${equipment.reason_for_termination} el día ${equipment.termination_date}. Al reintegrar el documento, se borrarán estas razones. Si estás seguro de que deseas reintegrarlo, haz clic en 'Continuar'. De lo contrario, haz clic en 'Cancelar'.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => reintegerDocumentEmployees()}
                  >
                    Continuar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {showModal && (
            <Dialog defaultOpen onOpenChange={() => setShowModal(!showModal)}>
              <DialogContent className="dark:bg-slate-950">
                <DialogTitle>Dar de baja Documento</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas dar de baja este documento?,
                  completa los campos para continuar.
                </DialogDescription>
                <DialogFooter>
                  <div className="w-full">
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                      >
                        <FormField
                          control={form.control}
                          name="reason_for_termination"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Motivo de Baja</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona la razón" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Despido de empleado">
                                    Despido de empleado
                                  </SelectItem>
                                  <SelectItem value="Renuncia de empleado">
                                    Renuncia de empleado
                                  </SelectItem>
                                  <SelectItem value="Cambio de Funciones de empleado">
                                    Cambio de Funciones de empleado
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Elige la razón por la que deseas dar de baja el
                                documento
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="termination_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fecha de Baja</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={'outline'}
                                      className={cn(
                                        ' pl-3 text-left font-normal',
                                        !field.value && 'text-muted-foreground',
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, 'P', {
                                          locale: es,
                                        })
                                      ) : (
                                        <span>Elegir fecha</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={date =>
                                      date > new Date() ||
                                      date < new Date('1900-01-01')
                                    }
                                    initialFocus
                                    locale={es}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription>
                                Fecha en la que se dio de baja
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-4 justify-end">
                          <Button variant="destructive" type="submit">
                            Dar de Baja
                          </Button>
                          <DialogClose>Cancelar</DialogClose>
                        </div>
                      </form>
                    </Form>
                    {/* <Button variant="destructive" onClick={() => handleDelete()}>
                    Eliminar
                  </Button> */}
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {viewModal && (
            <Dialog defaultOpen onOpenChange={() => setViewModal(!viewModal)}>
              <DialogContent>
                <DialogTitle>Historial de Modificaciones</DialogTitle>
                <DialogDescription>
                  Aquí se muestra quién modificó el documento y cuándo
                </DialogDescription>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="text-center">Usuario</TableCell>
                      <TableCell className="text-center">
                        Fecha de modificación
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentHistory.map((entry: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="text-center">
                          {entry.documents_employees.user_id.email}
                        </TableCell>

                        <TableCell className="text-center">
                          {formatRelative(
                            new Date(entry.updated_at),
                            new Date(),
                            { locale: es },
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <DialogFooter>
                  <Button onClick={() => setViewModal(false)}>Cerrar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <DotsVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(row.original.document_number)
              }
            >
              Copiar DNI del empleado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenViewModal(domain)}>
              Historial de Modificaciones
            </DropdownMenuItem>

            {/* <DropdownMenuItem>
              {document.is_active ? (
                <Button
                  variant="destructive"
                  onClick={() => handleOpenModal(equipment?.id)}
                  className="text-sm"
                >
                  Dar de baja documento
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => handleOpenIntegerModal(equipment.id)}
                  className="text-sm"
                >
                  Reintegrar Equipo
                </Button>
              )}
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    accessorKey: 'date',
    sortingFn: 'datetime',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Subido el
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'resource',
    header: 'Empleado',
  },
  {
    accessorKey: 'allocated_to',
    header: 'Afectado a',
  },
  {
    accessorKey: 'documentName',
    header: 'Documento',
  },
  {
    accessorKey: 'mandatory',
    header: 'Mandatorio',
  },
  {
    accessorKey: 'state',
    header: 'Estado',
    cell: ({ row }) => {
      const variants: {
        [key: string]:
          | 'destructive'
          | 'success'
          | 'default'
          | 'secondary'
          | 'outline'
          | 'yellow'
          | null
          | undefined
      } = {
        vencido: 'yellow',
        rechazado: 'destructive',
        aprobado: 'success',
        presentado: 'default',
      }
      return (
        <Badge variant={variants[row.original.state]}>
          {row.original.state}
        </Badge>
      )
    },
  },

  {
    accessorKey: 'multiresource',
    header: 'Multirecurso',
  },
  {
    accessorKey: 'validity',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Vencimiento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'id',
    header: 'Revisar documento',
    cell: ({ row }) => {
      return (
        <Link href={`/dashboard/document/${row.original.id}`}>
          <Button>Ver documento</Button>
        </Link>
      )
    },
  },
]
