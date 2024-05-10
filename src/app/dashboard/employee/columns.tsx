/**
 * This file contains the definition of the columns used in the dashboard.
 */

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
import { useToast } from '@/components/ui/use-toast'
import { useEdgeFunctions } from '@/hooks/useEdgeFunctions'
import { cn } from '@/lib/utils'
import { useLoggedUserStore } from '@/store/loggedUser'
import { zodResolver } from '@hookform/resolvers/zod'
import { DotsVerticalIcon } from '@radix-ui/react-icons'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowUpDown, CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { supabase } from '../../../supabase'

const formSchema = z.object({
  reason_for_termination: z.string({
    required_error: 'La razón de la baja es requerida.',
  }),
  termination_date: z.date({
    required_error: 'La fecha de baja es requerida.',
  }),
})

type Colum = {
  full_name: string
  email: string
  cuil: string
  document_number: string
  hierarchical_position: string
  company_position: string
  normal_hours: string
  type_of_contract: string
  allocated_to: string
  picture: string
  nationality: string
  lastname: string
  firstname: string
  bitrhplace: string
  document_type: undefined //Este header debe ser un select a partir de un arreglo de opciones
  gender: string
  marital_status: string
  level_of_education: string
  street: string
  street_number: string
  province: string
  postal_code: string
  phone: string
  file: string
  date_of_admission: string
  affiliate_status: string
  city: string
  hierrical_position: string
  workflow_diagram: string
  birthplace: string
  status: string
}

export const columns: ColumnDef<Colum>[] = [
  {
    id: 'actions',
    cell: ({ row }: { row: any }) => {
      const [showModal, setShowModal] = useState(false)
      const [integerModal, setIntegerModal] = useState(false)
      const [document, setDocument] = useState('')
      const user = row.original

      const handleOpenModal = (id: string) => {
        setDocument(id)
        setShowModal(!showModal)
      }

      const setInactiveEmployees = useLoggedUserStore(
        state => state.setInactiveEmployees,
      )
      const setActivesEmployees = useLoggedUserStore(
        state => state.setActivesEmployees,
      )
      const setShowDeletedEmployees = useLoggedUserStore(
        state => state.setShowDeletedEmployees,
      )
      const employees = useLoggedUserStore(state => state.employeesToShow)

      const handleOpenIntegerModal = (id: string) => {
        setDocument(id)
        setIntegerModal(!integerModal)
      }

      const { errorTranslate } = useEdgeFunctions()

      const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          reason_for_termination: undefined,
        },
      })

      const { toast } = useToast()

      async function reintegerEmployee() {
        try {
          await supabase
            .from('employees')
            .update({
              is_active: true,
              termination_date: null,
              reason_for_termination: null,
            })
            .eq('document_number', document)
            .select()

          setIntegerModal(!integerModal)
          setInactiveEmployees()
          setShowDeletedEmployees(false)
          toast({
            variant: 'default',
            title: 'Empleado reintegrado',
            description: `El empleado ${user.full_name} ha sido reintegrado`,
          })
        } catch (error: any) {
          const message = await errorTranslate(error?.message)
          toast({
            variant: 'destructive',
            title: 'Error al reintegrar al empleado',
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
            .from('employees')
            .update({
              is_active: false,
              termination_date: data.termination_date,
              reason_for_termination: data.reason_for_termination,
            })
            .eq('document_number', document)
            .select()

          setShowModal(!showModal)

          toast({
            variant: 'default',
            title: 'Empleado eliminado',
            description: `El empleado ${user.full_name} ha sido eliminado`,
          })
        } catch (error: any) {
          const message = await errorTranslate(error?.message)
          toast({
            variant: 'destructive',
            title: 'Error al dar de baja al empleado',
            description: message,
          })
        }
      }

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
                    {`Estás a punto de reintegrar al empleado ${user.full_name}, quien fue dado de baja por ${user.reason_for_termination} el día ${user.termination_date}. Al reintegrar al empleado, se borrarán estas razones. Si estás seguro de que deseas reintegrarlo, haz clic en 'Continuar'. De lo contrario, haz clic en 'Cancelar'.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => reintegerEmployee()}>
                    Continuar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {showModal && (
            <Dialog defaultOpen onOpenChange={() => setShowModal(!showModal)}>
              <DialogContent className="dark:bg-slate-950">
                <DialogTitle>Dar de baja</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar este empleado?
                  <br /> Completa los campos para continuar.
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
                              <FormLabel>Motivo de baja</FormLabel>
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
                                  <SelectItem value="Despido sin causa">
                                    Despido sin causa
                                  </SelectItem>
                                  <SelectItem value="Renuncia">
                                    Renuncia
                                  </SelectItem>
                                  <SelectItem value="Despido con causa">
                                    Despido con causa
                                  </SelectItem>
                                  <SelectItem value="Acuerdo de partes">
                                    Acuerdo de partes
                                  </SelectItem>
                                  <SelectItem value="Fin de contrato">
                                    Fin de contrato
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Elige la razón por la que deseas eliminar al
                                empleado
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
                              <FormLabel>Fecha de baja</FormLabel>
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
                                Fecha en la que se terminó el contrato
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-4 justify-end">
                          <Button variant="destructive" type="submit">
                            Eliminar
                          </Button>
                          <DialogClose>Cancelar</DialogClose>
                        </div>
                      </form>
                    </Form>
                  </div>
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
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(user.document_number)
              }
            >
              Copiar DNI
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link
                href={`/dashboard/employee/action?action=view&document=${user?.document_number}`}
              >
                Ver empleado
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href={`/dashboard/employee/action?action=edit&document=${user?.document_number}`}
              >
                Editar empleado
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              {user.is_active ? (
                <Button
                  variant="destructive"
                  onClick={() => handleOpenModal(user?.document_number)}
                  className="text-sm"
                >
                  Dar de baja
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => handleOpenIntegerModal(user?.document_number)}
                  className="text-sm"
                >
                  Reintegrar Empleado
                </Button>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    accessorKey: 'full_name',
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0"
        >
          Nombre completo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'cuil',
    header: 'Cuil',
  },
  {
    accessorKey: 'document_number',
    header: 'Numero de documento',
  },
  {
    accessorKey: 'hierarchical_position',
    header: 'Posición jerárquica',
  },
  {
    accessorKey: 'company_position',
    header: 'Posición en la empresa',
  },
  {
    accessorKey: 'normal_hours',
    header: 'Horas normales',
  },
  {
    accessorKey: 'type_of_contract',
    header: 'Tipo de contrato',
  },
  {
    accessorKey: 'allocated_to',
    header: 'Afectado a',
  },
  {
    accessorKey: 'picture',
    header: 'Foto',
  },
  {
    accessorKey: 'nationality',
    header: 'Nacionalidad',
  },
  {
    accessorKey: 'lastname',
    header: 'Apellido',
  },
  {
    accessorKey: 'firstname',
    header: 'Nombre',
  },
  {
    accessorKey: 'birthplace',
    header: 'Lugar de nacimiento',
  },
  {
    accessorKey: 'document_type',
    header: 'Tipo de documento',
  },
  {
    accessorKey: 'gender',
    header: 'Género',
  },
  {
    accessorKey: 'marital_status',
    header: 'Estado civil',
  },
  {
    accessorKey: 'level_of_education',
    header: 'Nivel de estudios',
  },
  {
    accessorKey: 'street',
    header: 'Calle',
  },
  {
    accessorKey: 'street_number',
    header: 'Numero de calle',
  },
  {
    accessorKey: 'province',
    header: 'Provincia',
  },
  {
    accessorKey: 'postal_code',
    header: 'Codigo postal',
  },
  {
    accessorKey: 'phone',
    header: 'Teléfono',
  },
  {
    accessorKey: 'file',
    header: 'Legajo',
  },
  {
    accessorKey: 'date_of_admission',
    header: 'Fecha de ingreso',
  },
  {
    accessorKey: 'affiliate_status',
    header: 'Estado de afiliado',
  },
  {
    accessorKey: 'city',
    header: 'Ciudad',
  },
  {
    accessorKey: 'hierrical_position',
    header: 'Posición jerárquica',
  },
  {
    accessorKey: 'workflow_diagram',
    header: 'Diagrama de flujo',
  },
  {
    accessorKey: 'showUnavaliableEmployees',
    header: 'Ver empleados dados de baja',
  },
]
