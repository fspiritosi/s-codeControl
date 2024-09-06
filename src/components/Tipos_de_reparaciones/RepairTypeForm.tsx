'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLoggedUserStore } from '@/store/loggedUser';
import { TypeOfRepair } from '@/types/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { criticidad } from './RepairSolicitudesTable/data';
export function RepairTypeForm({ types_of_repairs }: { types_of_repairs: TypeOfRepair }) {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const company_id = useLoggedUserStore((state) => state.actualCompany)?.id;
  const [filterText, setFilterText] = useState('');
  const [filterCriticidad, setFilterCriticidad] = useState('All');
  const [filterMaintenance, setFilterMaintenance] = useState('All');
  const [filteredRepairs, setFilteredRepairs] = useState(types_of_repairs);
  const [selectedRepair, setSelectedRepair] = useState<TypeOfRepair[0] | null>(null);
  const router = useRouter();

  const typeOfRepair = z.object({
    name: z.string({ required_error: 'El nombre es requerido' }).min(1, { message: 'Debe ingresar un nombre' }),
    description: z
      .string({ required_error: 'Una breve descripción es requerida' })
      .min(3, { message: 'Intenta explicar con un poco más de detalle' }),
    criticity: z.enum(['Alta', 'Media', 'Baja'], { required_error: 'La criticidad es requerida' }),
    is_active: z.boolean().default(true).optional(),
    company_id: z
      .string()
      .default(company_id || '')
      .optional(),
    type_of_maintenance: z.enum(['Correctivo', 'Preventivo']),
  });

  type Repair = z.infer<typeof typeOfRepair>;

  const form = useForm<Repair>({
    resolver: zodResolver(typeOfRepair),
    defaultValues: {
      company_id: company_id,
    },
  });

  const onSubmit = async (data: Repair) => {
    toast.promise(
      async () => {
        try {
          await fetch(`${URL}/api/repairs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          router.refresh();
        } catch (error) {
          console.error(error);
        }
      },
      {
        loading: 'Creando tipo de reparación...',
        success: 'Tipo de reparación creado con éxito',
        error: 'Hubo un error al crear el tipo de reparación',
      }
    );
  };

  const onUpdate = async (data: Repair) => {
    toast.promise(
      async () => {
        try {
          await fetch(`${URL}/api/repairs/${selectedRepair?.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          router.refresh();
          setSelectedRepair(null);
          form.reset();
        } catch (error) {
          console.error(error);
        }
      },
      {
        loading: 'Actualizando tipo de reparación...',
        success: 'Tipo de reparación actualizado con éxito',
        error: 'Hubo un error al actualizar el tipo de reparación',
      }
    );
  };

  const onDelete = async (id: string) => {
    toast.promise(
      async () => {
        try {
          await fetch(`${URL}/api/repairs/${id}`, {
            method: 'DELETE',
          });
          router.refresh();
          setSelectedRepair(null);
          form.reset();
        } catch (error) {
          console.error(error);
        }
      },
      {
        loading: 'Eliminando tipo de reparación...',
        success: 'Tipo de reparación eliminado con éxito',
        error: 'Hubo un error al eliminar el tipo de reparación',
      }
    );
  };

  useEffect(() => {
    const data = types_of_repairs.filter((repair) => {
      const matchesText =
        repair.name.toLowerCase().includes(filterText.toLowerCase()) ||
        repair.criticity.toLowerCase().includes(filterText.toLowerCase()) ||
        repair.description.toLowerCase().includes(filterText.toLowerCase());

      const matchesCriticidad = filterCriticidad === 'All' || repair.criticity === filterCriticidad;
      const matchesMaintenance = filterMaintenance === 'All' || repair.type_of_maintenance === filterMaintenance;

      return matchesText && matchesCriticidad && matchesMaintenance;
    });
    setFilteredRepairs(data);
  }, [filterText, filterCriticidad, filterMaintenance, types_of_repairs]);

  const handleModify = (repair: TypeOfRepair[0]) => {
    setSelectedRepair(repair);
    form.setValue('name', repair.name);
    form.setValue('description', repair.description);
    form.setValue('criticity', repair.criticity);
    form.setValue('type_of_maintenance', repair.type_of_maintenance);
  };

  const handleFilterCriticidadChange = (value: string) => {
    setFilterCriticidad(value);
  };

  const handleFilterMaintenanceChange = (value: string) => {
    setFilterMaintenance(value);
  };

  const handleFilterTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="pt-6">
      <ResizablePanel>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(selectedRepair ? onUpdate : onSubmit)} className="space-y-8 p-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del tipo de reparación</FormLabel>
                  <Input placeholder="Ingresar nombre" {...field} value={field.value} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <Textarea placeholder="Ingresa una descripción" {...field} value={field.value} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="criticity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de criticidad</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Elije el nivel de criticidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Baja">Baja</SelectItem>
                        <SelectItem value="Media">Media</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type_of_maintenance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de mantenimiento</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Elegir tipo de mantenimiento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Preventivo">Preventivo</SelectItem>
                        <SelectItem value="Correctivo">Correctivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedRepair ? (
              <div className="flex justify-between mt-4">
                <Button type="submit">Actualizar tipo de reparación</Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Eliminar</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro de que deseas eliminar este tipo de reparación?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer y se perderán todos los datos relacionados como las solicitudes
                        de reparaciones que tengan este tipo de reparación.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button variant={'destructive'} type="button" onClick={() => onDelete(selectedRepair.id)}>
                          Eliminar
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <Button type="submit" className="mt-4">
                Crear tipo de reparación
              </Button>
            )}
          </form>
        </Form>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel className="pl-6 min-w-[600px] flex flex-col gap-4" defaultSize={70}>
        <div className="flex gap-4">
          <Input
            value={filterText}
            onChange={handleFilterTextChange}
            placeholder="Filtrar por nombre, criticidad o descripción"
            className="max-w-[400px] mb-4"
          />
          <Select onValueChange={handleFilterCriticidadChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar criticidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Todas</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Media">Media</SelectItem>
              <SelectItem value="Baja">Baja</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={handleFilterMaintenanceChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar mantenimiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Todos</SelectItem>
              <SelectItem value="Preventivo">Preventivo</SelectItem>
              <SelectItem value="Correctivo">Correctivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableCaption>Lista de todos los tipos de reparaciones</TableCaption>
          <TableHeader>
            <TableRow className="border-t">
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo de mantenimiento</TableHead>
              <TableHead>Criticidad</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Editar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRepairs.map((repair) => {
              const { criticity } = repair;
              const priority = criticidad.find((priority) => priority.value === criticity);
              const badgeVariant =
                criticity === 'Baja'
                  ? 'success'
                  : criticity === 'Media'
                    ? 'yellow'
                    : ('destructive' as
                        | 'success'
                        | 'default'
                        | 'destructive'
                        | 'outline'
                        | 'secondary'
                        | 'yellow'
                        | 'red'
                        | null
                        | undefined);
              return (
                <TableRow key={repair.id}>
                  <TableCell>{repair.name}</TableCell>
                  <TableCell>{repair.type_of_maintenance}</TableCell>
                  <TableCell className="font-medium">
                    <Badge variant={badgeVariant} className='font-bold'>
                      {' '}
                      {priority?.icon && <priority.icon className="mr-2 h-4 w-4 font-bold" />}
                      {repair.criticity}
                    </Badge>
                  </TableCell>
                  <TableCell>{repair.description}</TableCell>
                  <TableCell>
                    <Button onClick={() => handleModify(repair)}>Modificar</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
