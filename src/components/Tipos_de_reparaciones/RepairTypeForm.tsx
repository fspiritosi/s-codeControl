'use client';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLoggedUserStore } from '@/store/loggedUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { TypeOfRepair } from '@/types/types';

export function RepairTypeForm({ types_of_repairs }: { types_of_repairs: TypeOfRepair}) {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const company_id = useLoggedUserStore((state) => state.actualCompany)?.id;
  const [filterText, setFilterText] = useState('');
  const [filterCriticidad, setFilterCriticidad] = useState('All');
  const [filteredRepairs, setFilteredRepairs] = useState(types_of_repairs);
  const router = useRouter();
  const typeOfRepair = z.object({
    name: z.string({ required_error: 'El nombre es requerido' }).min(1, { message: 'Debe seleccionar un empleado' }),
    description: z
      .string({ required_error: 'Una breve descripción es requerida' })
      .min(3, { message: 'Intenta explicar con un poco mas de detalle' }),
    criticity: z
      .string({ required_error: 'La creticidad es requerida' })
      .min(1, { message: 'Debe seleccionar un nivel de criticidad' }),
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

  useEffect(() => {
    const data = types_of_repairs.filter((repair) => {
      const matchesText =
        repair.name.toLowerCase().includes(filterText.toLowerCase()) ||
        repair.criticity.toLowerCase().includes(filterText.toLowerCase()) ||
        repair.description.toLowerCase().includes(filterText.toLowerCase());

      const matchesCriticidad = filterCriticidad === 'All' || repair.criticity === filterCriticidad;

      return matchesText && matchesCriticidad;
    });
    setFilteredRepairs(data);
  }, [filterText, filterCriticidad, types_of_repairs]);

  console.log(form.formState.errors);

  const handleModify = (id: string) => {};

  const handleFilterCriticidadChange = (value: string) => {
    setFilterCriticidad(value);
  };

  const handleFilterTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="pt-6">
      <ResizablePanel>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del tipo de reparacion</FormLabel>
                  <Input placeholder="Ingresar nombre" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripcion</FormLabel>
                  <Textarea placeholder="Ingresa una descripcion" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Elije el nivel de creticidad" />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <Button className="mt-4">Crear tipo de reparacion</Button>
          </form>
        </Form>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel className="pl-6 min-w-[600px] flex flex-col gap-4" defaultSize={70}>
        <div className="flex gap-4">
          <Input
            value={filterText}
            onChange={handleFilterTextChange}
            placeholder="Filtrar por nombre, creticidad o descripcion"
            className="max-w-[400px] mb-4"
          />
          <Select onValueChange={handleFilterCriticidadChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar creticidad" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="All">Todas</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Media">Media</SelectItem>
              <SelectItem value="Baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableCaption>Lista de todos los tipos de reparaciones</TableCaption>
          <TableHeader>
            <TableRow className="border-t">
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo de mantenimiento</TableHead>
              <TableHead>Creticidad</TableHead>
              <TableHead>Descripcion</TableHead>
              <TableHead>Editar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRepairs.map((repair) => {
              const { criticity } = repair;
              const badgeVariant =
                criticity === 'Baja'
                  ? 'outline'
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
                    <Badge variant={badgeVariant}>{repair.criticity}</Badge>
                  </TableCell>
                  <TableCell>{repair.description}</TableCell>
                  <TableCell>
                    <Button>Modificar</Button>
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
