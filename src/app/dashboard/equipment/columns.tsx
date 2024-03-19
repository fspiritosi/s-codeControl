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
import { zodResolver } from '@hookform/resolvers/zod'
import { DotsVerticalIcon } from '@radix-ui/react-icons'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowUpDown, CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { supabase } from '../../../../supabase/supabase'

const formSchema = z.object({
  reason_for_termination: z.string({
    required_error: 'La razón de la baja es requerida.',
  }),
  termination_date: z.date({
    required_error: 'La fecha de baja es requerida.',
  }),
})

type Colum = {
  picture: string
  types_of_vehicles: { name: string }
  type_of_vehicle: string
  domain: string
  chassis: string
  engine: string
  serie: string
  intern_number: string
  year: string
  brand: string
  model: string
  is_active: boolean
  showInactive: boolean
  status: string
}

export const columns: ColumnDef<Colum>[] = [
  {
    id: 'actions',
    cell: ({ row }: { row: any }) => {
      const [showModal, setShowModal] = useState(false)
      const [integerModal, setIntegerModal] = useState(false)
      const [domain, setDomain] = useState('')
      //const user = row.original
      const [showInactive, setShowInactive] = useState<boolean>(false)
      const [showDeletedEquipment, setShowDeletedEquipment] = useState(false)
      const equipment = row.original

      const handleOpenModal = (id: string) => {
        setDomain(id)
        setShowModal(!showModal)
      }

      const fetchInactiveEquipment = async () => {
        try {
          const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('is_active', false)

          if (error) {
            console.error(error)
          }
        } catch (error) {
          console.error(error)
        }
      }
      useEffect(() => {
        fetchInactiveEquipment()
      }, [])
      const handleOpenIntegerModal = (id: string) => {
        setDomain(id)
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

      async function reintegerEquipment() {
        try {
          const { data, error } = await supabase
            .from('vehicles')
            .update({
              is_active: true,
              termination_date: null,
              reason_for_termination: null,
            })
            .eq('id', equipment.id)
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
            .from('vehicles')
            .update({
              is_active: false,
              termination_date: data.termination_date,
              reason_for_termination: data.reason_for_termination,
            })
            .eq('id', equipment.id)
            .select()

          setShowModal(!showModal)

          toast({
            variant: 'default',
            title: 'Equipo eliminado',
            description: `El equipo ${equipment.domain} ha sido dado de baja`,
          })
        } catch (error: any) {
          const message = await errorTranslate(error?.message)
          toast({
            variant: 'destructive',
            title: 'Error al dar de baja el equipo',
            description: message,
          })
        }
      }
      const handleToggleInactive = () => {
        setShowInactive(!showInactive)
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
                    {`Estás a punto de reintegrar al equipo ${equipment.id}, quien fue dado de baja por ${equipment.reason_for_termination} el día ${equipment.termination_date}. Al reintegrar al equipo, se borrarán estas razones. Si estás seguro de que deseas reintegrarlo, haz clic en 'Continuar'. De lo contrario, haz clic en 'Cancelar'.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => reintegerEquipment()}>
                    Continuar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {showModal && (
            <Dialog defaultOpen onOpenChange={() => setShowModal(!showModal)}>
              <DialogContent>
                <DialogTitle>Dar de baja Equipo</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas dar de baja este equipo?, completa
                  los campos para continuar.
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
                                  <SelectItem value="Venta del vehículo">
                                    Venta del vehículo
                                  </SelectItem>
                                  <SelectItem value="Destrucción Total">
                                    Destrucción Total
                                  </SelectItem>
                                  <SelectItem value="Fundido">
                                    Fundido
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Elige la razón por la que deseas dar de baja el
                                equipo
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
              onClick={() => navigator.clipboard.writeText(equipment.domain)}
            >
              Copiar Dominio
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href={`/dashboard/equipment/action?action=view&id=${equipment?.id}`}
              >
                Ver equipo
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href={`/dashboard/equipment/action?action=edit&id=${equipment?.id}`}
              >
                Editar equipo
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              {equipment.is_active ? (
                <Button
                  variant="destructive"
                  onClick={() => handleOpenModal(equipment?.id)}
                  className="text-sm"
                >
                  Dar de baja equipo
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
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    accessorKey: 'domain',
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0"
        >
          Dominio
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'chassis',
    header: 'Chassis',
  },
  {
    accessorKey: 'status',
    header: 'Estado',
  },
  {
    accessorKey: 'types_of_vehicles',
    header: 'Tipos de vehículos',
  },

  {
    accessorKey: 'engine',
    header: 'Motor',
  },
  {
    accessorKey: 'serie',
    header: 'Serie',
  },
  {
    accessorKey: 'intern_number',
    header: 'Número Interno',
  },
  {
    accessorKey: 'year',
    header: 'Año',
  },
  {
    accessorKey: 'brand',
    header: 'Marca',
  },
  {
    accessorKey: 'model',
    header: 'Modelo',
  },
  {
    accessorKey: 'picture',
    header: 'Foto',
  },
  {
    accessorKey: 'is_active',
    header: 'Ver equipos dados de baja',
  },

]
