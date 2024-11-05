'use client';
import { useEffect, useState } from 'react';
// import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
const ServiceSchema = z
  .object({
    id: z.string().optional(),
    customer_id: z.string().min(1, { message: 'Debe seleccionar un cliente' }),
    service_name: z.string().min(1, { message: 'Debe ingresar el nombre del servicio' }),
    service_start: z.date(),
    service_validity: z.date(),
  })
  .refine((data) => data.service_validity > data.service_start, {
    message: 'La validez del servicio debe ser mayor que el inicio del servicio',
    path: ['service_validity'],
  });
interface Customer {
  id: string;
  name: string;
}
type Services = {
  id: string;
  service_name: string;
  customer_id: string;
  description: string;
  service_price: number;
  service_start: string;
  service_validity: string;
  is_active: true;
};
type Service = z.infer<typeof ServiceSchema>;

export default function ServicesForm({
  customers,
  company_id,
  editingService,
}: {
  customers: Service[];
  company_id: string;
  editingService?: Service & { is_active: boolean };
}) {
  const form = useForm<Service>({
    resolver: zodResolver(ServiceSchema),
    defaultValues: {
      customer_id: '',
      service_name: '',
      service_start: new Date(),
      service_validity: new Date(),
    },
  });
  const { reset } = form;
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!!editingService);
  // Remove the filteredServices state variable
  const [filteredServices, setFilteredServices] = useState<Service[] | undefined>(
    editingService ? [editingService] : undefined
  );
  useEffect(() => {
    if (editingService) {
      const serviceStartDate = new Date(editingService.service_start);
      const serviceValidityDate = new Date(editingService.service_validity);

      serviceStartDate.setDate(serviceStartDate.getDate() + 1);
      serviceValidityDate.setDate(serviceValidityDate.getDate() + 1);

      reset({
        id: editingService.id,
        customer_id: editingService.customer_id,
        service_name: editingService.service_name,
        service_start: serviceStartDate,
        service_validity: serviceValidityDate,
      });
      setIsEditing(true);
    } else {
      reset({
        id: '',
        customer_id: '',
        service_name: '',
        service_start: new Date(),
        service_validity: new Date(),
      });
      setIsEditing(false);
    }
  }, [editingService, reset]);
  const modified_editing_service_id = editingService?.id?.toString().replace(/"/g, '') ?? '';
  const onSubmit = async (values: Service) => {
    const modified_company_id = company_id?.replace(/"/g, '');

    const data = JSON.stringify(values);
    try {
      const response = await fetch(`/api/services?actual=${modified_company_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
      });
      if (!response.ok) {
        throw new Error('Error en la solicitud');
      }
      const result = await response.json();
      toast.success('Servicio creado correctamente');
      router.refresh();
      resetForm();
    } catch (error) {
      console.error('Error al crear el servicio:', error);
      toast.error('Error al crear el servicio');
    }
  };

  const onUpdate = async (values: Service) => {
    const modified_company_id = company_id?.replace(/"/g, '');

    const data = JSON.stringify(values);
    try {
      type Service = {
        id: string;
        service_name: string;
        customer_id: string;
        description: string;
        service_price: number;
        service_start: string;
        service_validity: string;
        is_active: true;
      };
      const response = await fetch(`/api/services/?id=${modified_editing_service_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
      });
      if (!response.ok) {
        throw new Error('Error en la solicitud');
      }
      const result = await response.json();
      toast.success('Servicio actualizado correctamente');
      resetForm();
      router.refresh();
    } catch (error) {
      console.error('Error al actualizar el servicio:', error);
      toast.error('Error al actualizar el servicio');
    }
  };

  const handleDeactivate = async () => {
    if (editingService) {
      try {
        const newActiveState = !editingService.is_active;
        const response = await fetch(`/api/services/?id=${modified_editing_service_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...editingService, is_active: newActiveState }),
        });

        if (response.ok) {
          // Actualizar la lista de servicios con el servicio desactivado
          const updatedService = await response.json();
          setFilteredServices((prevServices: any) =>
            prevServices?.map((service: any) => (service.id === updatedService.id ? updatedService : service))
          );
          toast.success(`Servicio ${newActiveState ? 'activado' : 'desactivado'} correctamente`);
          // setIsModalOpen(false);
          router.refresh();
        } else {
          console.error('Error al desactivar el servicio');
          toast.error('Error al desactivar el servicio');
        }
      } catch (error) {
        console.error('Error al desactivar el servicio:', error);
      }
    }
  };

  const handleSubmit1 = (values: Service) => {
    if (isEditing) {
      onUpdate(values);
    } else {
      onSubmit(values);
    }
  };

  const resetForm = () => {
    reset({
      id: '',
      customer_id: '',
      service_name: '',
      service_start: new Date(),
      service_validity: new Date(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    resetForm();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit1)} className="space-y-8">
        <FormField
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-[400px]">
                    <SelectValue placeholder="Elegir cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((customer: any) => (
                    <SelectItem value={customer.id} key={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="service_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Servicio</FormLabel>
              <FormControl>
                <Input type="text" {...field} className="input w-[400px]" placeholder="Nombre del servicio" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="service_start"
          render={({ field }) => (
            <FormItem>
              <div className="flex gap-4 items-center w-[400px] justify-between">
                <FormLabel>Inicio del Servicio</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn('w-[240px] pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                      >
                        {field.value ? field.value.toLocaleDateString() : 'Elegir fecha'}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        {...field}
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="service_validity"
          render={({ field }) => (
            <FormItem>
              <div className="flex gap-4 items-center w-[400px] justify-between">
                <FormLabel>Validez del Servicio</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn('w-[240px] pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                      >
                        {field.value ? field.value.toLocaleDateString() : 'Elegir fecha'}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="mt-4" type="submit">
          {isEditing ? 'Editar' : 'Cargar'}
        </Button>
        <Button className="mt-4 ml-2" type="button" onClick={handleCancel} variant={'destructive'}>
          Cancelar
        </Button>
        {isEditing && (
          <Button
            className="mt-4 ml-2"
            onClick={handleDeactivate}
            variant={editingService?.is_active ? 'destructive' : 'success'}
          >
            {editingService?.is_active ? 'Dar de Baja' : 'Dar de Alta'}
          </Button>
        )}
      </form>
    </Form>
  );
}
