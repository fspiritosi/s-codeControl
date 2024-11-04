'use client';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { zodResolver } from '@hookform/resolvers/zod';
import { Item } from '@radix-ui/react-dropdown-menu';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
const ItemsSchema = z.object({
  customer_id: z.string().nonempty(),
  customer_service_id: z.string().nonempty(),
  item_name: z.string().min(1, { message: 'Debe ingresar el nombre del servicio' }),
  item_description: z.string().min(1, { message: 'Debe ingresar una descripción del servicio' }),
  item_price: z.preprocess((val) => Number(val), z.number().min(0, { message: 'Debe ingresar un precio válido' })),
  item_measure_units: z.string().min(1, { message: 'Debe seleccionar la unidad de medida' }),
  is_active: z.boolean().optional(),
});
const EditItemSchema = z.object({
  customer_id: z.string().optional(),
  customer_service_id: z.string().optional(),
  item_name: z.string().optional(),
  item_description: z.string().optional(),
  item_price: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: 'Debe ingresar un precio válido' }).optional()
  ),
  item_measure_units: z.string().optional(),
});

interface Item {
  id: string;
  item_name: string;
  item_description: string;
  item_measure_units: { id: string };
  item_price: number;
  is_active: boolean;
  customer_id: { id: string; name: string };
  customer_service_id: { customer_id: { id: string; name: string } };
  company_id: string;
}

type customer = {
  id: string;
  name: string;
};

interface measure_unit {
  id: number;
  unit: string;
  simbol: string;
  tipo: string;
}

interface UpdatedFields {
  item_name?: string;
  item_description?: string;
  item_price?: number;
  item_measure_units?: number;
  is_active?: boolean;
}
type EditServiceFields = Omit<z.infer<typeof ItemsSchema>, 'customer_id' | 'customer_service_id'>;
type Service = z.infer<typeof ItemsSchema>;

export default function ServiceItemsForm({
  measure_units,
  customers,
  services,
  company_id,
  editingService,
}: {
  measure_units: measure_unit[];
  customers: customer[];
  services: Service[];
  company_id: string;
  editingService: Item;
}) {
  const [selectedClient, setSelectedClient] = useState<string | undefined>(editingService?.customer_id?.id);
  const [isEditing, setIsEditing] = useState(!!editingService);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [servicesData, setServicesData] = useState<Service[]>([]);
  const URL = process.env.NEXT_PUBLIC_BASE_URL;

  const [loading, setLoading] = useState(true);
  const modified_company_id = company_id?.replace(/"/g, '');
  const supabase = supabaseBrowser();
  // const { services } = await fetch(`${URL}/api/services?actual=${company_id}`).then((e) => e.json());
  const form = useForm<Service>({
    resolver: zodResolver(isEditing ? EditItemSchema : ItemsSchema),
    defaultValues: {
      customer_id: '',
      customer_service_id: '',
      item_name: '',
      item_description: '',
      item_price: 0,
      item_measure_units: '',
    },
  });
  const { reset } = form;
  const router = useRouter();
  const fetchServices = async () => {
    try {
      const servicesResponse = await fetch(`${URL}/api/services?actual=${company_id}`);

      if (!servicesResponse.ok) {
        throw new Error('Error al obtener los servicios');
      }
      // const {data, error}= await supabase
      // .from('customer_services')
      // .select('*')
      // .eq('company_id', company_id);
      const responseData = await servicesResponse.json();
      const services = Array.isArray(responseData) ? responseData : responseData.services;
      setServicesData(services as any);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [services]);

  useEffect(() => {
    if (editingService) {
      reset({
        customer_id: editingService.customer_service_id?.customer_id?.name,
        customer_service_id: editingService.customer_service_id?.customer_id?.id,
        item_name: editingService.item_name,
        item_description: editingService.item_description,
        item_price: editingService.item_price,
        item_measure_units: editingService.item_measure_units?.id,
      });
      setIsEditing(true);
    } else {
      reset({
        customer_id: '',
        customer_service_id: '',
        item_name: '',
        item_description: '',
        item_price: 0,
        item_measure_units: '',
      });
      setIsEditing(false);
    }
  }, [editingService, reset]);

  const onSubmit = async (values: any) => {
    const modified_company_id = company_id.replace(/"/g, '');
    const modified_editing_service_id = values.customer_service_id.replace(/"/g, '');
    const updatedValues = { ...values, customer_service_id: modified_editing_service_id };
    const data = JSON.stringify(updatedValues);

    try {
      const response = await fetch(`/api/services/items?actual=${modified_company_id}`, {
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
      toast.success('Item creado correctamente');
      resetForm();
    } catch (error) {
      console.error('Error al crear el item:', error);
      toast.error('Error al crear el item');
    }
    router.refresh();
  };

  const onUpdate = async (values: Service) => {
    const modified_company_id = company_id.replace(/"/g, '');
    const data = JSON.stringify(values);

    try {
      const modified_editing_service_id = editingService?.id?.toString().replace(/"/g, '');

      const response = await fetch(`/api/services/items?id=${modified_editing_service_id}`, {
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
      toast.success('Item actualizado correctamente');
      resetForm();
    } catch (error) {
      console.error('Error al actualizar el item:', error);
      toast.error('Error al actualizar el item');
    }
    router.refresh();
  };

  const handleDeactivateItem = async () => {
    if (editingService) {
      try {
        const newActiveState = !editingService.is_active;

        const response = await fetch(`/api/services/items/?id=${editingService.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_active: newActiveState }),
        });

        if (response.ok) {
          // Actualizar la lista de items con el item desactivado
          const updatedItem = await response.json();
          setFilteredItems((prevItems) =>
            prevItems.map((item: any) => (item.id === updatedItem.id ? updatedItem : item))
          );
          toast.success(`Item ${newActiveState ? 'activado' : 'desactivado'} correctamente`);
          // setIsModalOpen(false);
        } else {
          console.error('Error al desactivar el item');
          toast.error('Error al desactivar el item');
        }
      } catch (error) {
        console.error('Error al desactivar el item:', error);
        toast.error('Error al desactivar el item');
      }
    }
    router.refresh();
  };

  const handleSubmit1 = (values: any) => {
    if (isEditing) {
      onUpdate(values);
    } else {
      onSubmit(values);
    }
  };

  const resetForm = () => {
    reset({
      customer_id: '',
      customer_service_id: '',
      item_name: '',
      item_description: '',
      item_price: 0,
      item_measure_units: '',
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    resetForm();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit1)} className="space-y-8">
        {!isEditing && (
          <>
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedClient(value);
                    }}
                    value={field.value}
                    defaultValue=""
                  >
                    <FormControl>
                      <SelectTrigger className="w-[400px]">
                        <SelectValue placeholder="Elegir cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((customer: any) => (
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
              name="customer_service_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servicio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                    <FormControl>
                      <SelectTrigger className="w-[400px]">
                        <SelectValue placeholder="Elegir Servicio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {servicesData
                        ?.filter((service) => service.customer_id === selectedClient)
                        .map((service: any) => (
                          <SelectItem value={service.id} key={service.id}>
                            {service.service_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <FormField
          control={form.control}
          name="item_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Item</FormLabel>
              <FormControl>
                <Input type="text" {...field} className="input w-[400px]" placeholder="Nombre del item" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="item_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripcion del Item</FormLabel>
              <FormControl>
                <Textarea {...field} className="input w-[400px]" placeholder="Descripcion del item" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="item_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio del Item</FormLabel>
              <FormControl>
                <Input type="number" {...field} className="input w-[400px]" placeholder="Precio del item" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="item_measure_units"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad de Medida</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-[400px]">
                    <SelectValue placeholder="Elegir unidad de medida" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {measure_units?.map((measure: measure_unit) => (
                    <SelectItem value={measure.id.toString()} key={measure.id}>
                      {measure.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="mt-4" type="submit">
          {isEditing ? 'Editar' : 'Cargar'}
        </Button>
        <Button className="mt-4 ml-2" type="button" variant={'destructive'} onClick={handleCancel}>
          Cancelar
        </Button>
        {isEditing && (
          <Button
            className="mt-4 ml-2"
            onClick={handleDeactivateItem}
            variant={editingService.is_active ? 'destructive' : 'success'}
          >
            {editingService.is_active ? 'Dar de Baja' : 'Dar de Alta'}
          </Button>
        )}
      </form>
    </Form>
  );
}

function setItems(arg0: (prevItems: any) => any) {
  throw new Error('Function not implemented.');
}
