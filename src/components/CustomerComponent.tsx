'use client';

import { columnsGuests } from '@/app/dashboard/company/actualCompany/components/columnsGuests';
import { DataTable as DataTableInvited } from '@/app/dashboard/company/actualCompany/components/data-table';
import { createdCustomer, updateCustomer } from '@/app/dashboard/company/actualCompany/customers/action/create';
import { EquipmentTable } from '@/app/dashboard/equipment/data-equipment';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import { customersSchema } from '@/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Toaster, toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '../../supabase/supabase';
// import { columns } from '../app/dashboard/company/customers/action/columnsCustomers';
import { EmployeesListColumns } from '@/app/dashboard/employee/columns';
import { EmployeesTable } from '@/app/dashboard/employee/data-table';
import { EquipmentColums as columns1 } from '../app/dashboard/equipment/columns';
// import { Employee } from '@/types/types';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { setEmployeesToShow } from '@/lib/utils/utils';
import cookie from 'js-cookie';
import moment from 'moment';
import { Badge } from './ui/badge';
interface Service {
  id: string;
  service_name: string;
  is_active: boolean;
  service_start: string;
  service_validity: string;
}

export default function ClientRegister({ id, equipment }: { id: string; equipment: VehicleWithBrand[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const functionAction = id ? updateCustomer : createdCustomer;
  const [errors, setErrors] = useState<any>({});
  // const actualCompany = useLoggedUserStore((state) => state.actualCompany?.id);
  const [action, setAction] = useState(searchParams.get('action'));
  const [readOnly, setReadOnly] = useState(action === 'edit' ? false : true);
  const [clientData, setClientData] = useState<any>(null);
  const [contactData, setContactData] = useState<any>(null);
  const [userId, setUserId] = useState<any>(null);
  const [employ, setEmploy] = useState<any>(null);
  const [servicesData, setServicesData] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [items, setItems] = useState<any>(null);
  const actualCompany = cookie.get('actualComp');
  const URL = process.env.NEXT_PUBLIC_BASE_URL;

  const fetchItems = async () => {
    const { items } = await fetch(`${URL}/api/services/items/report?actual=${actualCompany}`).then((e) => e.json());
    setItems(items);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setOpenModal(false);
  };
  const handleOpenModal = (service: any) => {
    setSelectedService(service);

    setOpenModal(true);
    fetchItems();
  };

  const filteredItems = items?.filter((item: any) => item.customer_service_id?.id === selectedService?.id);

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user);
  };
  const fetchemploy = async () => {
    const { employees } = await fetch(`${URL}/api/employees/table?actual=${actualCompany}&user=${userId}`).then((e) =>
      e.json()
    );
    setEmploy(employees);
  };

  const fetchServices = async () => {
    const { services } = await fetch(`${URL}/api/services?actual=${actualCompany}`).then((e) => e.json());
    const filteredServices = services.filter(
      (service: any) => service.customer_id.toString() === id && service.is_active === true
    );
    setServicesData(filteredServices);
  };

  const activeEmploees = setEmployeesToShow(employ?.filter((e: any) => e.is_active));
  const inactiveEmploees = setEmployeesToShow(employ?.filter((e: any) => !e.is_active));
  // const equipment = useLoggedUserStore((state) => state.vehiclesToShow);

  useEffect(() => {
    fetchUser();
    fetchemploy();
    fetchServices();
  }, []);

  const filteredCustomersActiveEmployees = activeEmploees
    ?.filter((customer: any) => customer.allocated_to && customer.allocated_to.includes(clientData?.id))
    .map((customer: any) => ({
      ...customer,
      guild: customer.guild?.name,
    }));

  const filteredCustomersInActiveEmployees = inactiveEmploees
    ?.filter((customer: any) => customer.allocated_to && customer.allocated_to.includes(clientData?.id))
    .map((customer: any) => ({
      ...customer,
      guild: customer.guild?.name,
    }));

  const filteredCustomersEquipment = equipment?.filter((equipmentItem) =>
    equipmentItem.contractor_equipment.some((e) => e.contractor_id.id === clientData?.id)
  );

  const form = useForm<z.infer<typeof customersSchema>>({
    resolver: zodResolver(customersSchema),
    defaultValues: {
      company_name: '',
      client_cuit: '',
      client_email: '',
      client_phone: '',
      address: '',
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors: formErrors },
  } = form;

  useEffect(() => {
    if (action === 'view') {
      setReadOnly(true);
    } else {
      setReadOnly(false);
    }

    const id = searchParams.get('id');
    const fetchCustomerData = async () => {
      const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();

      if (error) {
        console.error('Error fetching customer data:', error);
      } else {
        setClientData(data);
        setValue('company_name', data?.name);
        setValue('client_cuit', data?.cuit.toString());
        setValue('client_email', data?.client_email);
        setValue('client_phone', data?.client_phone.toString());
        setValue('address', data?.address);
      }
    };

    if (id) {
      fetchCustomerData();
    }
  }, [action, id, setValue]);

  const onSubmit = async (formData: z.infer<typeof customersSchema>) => {
    const data = new FormData();
    data.append('id', id);
    data.append('company_name', formData.company_name);
    data.append('client_cuit', formData.client_cuit);
    data.append('client_email', formData.client_email || '');
    data.append('client_phone', formData.client_phone);
    data.append('address', formData.address);
    const company_id = actualCompany;
    data.append('company_id', company_id as string);
    toast.loading('Creando cliente');
    try {
      const response = await functionAction(data);

      if (response.status === 201) {
        toast.dismiss();
        toast.success('Cliente creado satisfactoriamente!');
        router.push('/dashboard/company/actualCompany');
      } else {
        toast.dismiss();
        toast.error(response.body);
      }
    } catch (errors) {
      // console.error('Error submitting form:', error);
      toast.dismiss();
      toast.error('Error al crear el cliente');
    }
  };

  const renderCard = () => (
    // <Card className="mt-6 p-8"></Card>
    <Card className="mt-6 p-8">
      <CardTitle className="text-4xl mb-3">
        {action === 'view' ? '' : action === 'edit' ? 'Editar Cliente' : 'Registrar Cliente'}
        {action === 'view' ? (
          <div className="flex flex-grap gap-2 ">
            <Button
              variant="default"
              onClick={() => {
                setReadOnly(!readOnly);
              }}
            >
              {!readOnly ? 'No editar' : '  Editar '}
            </Button>
          </div>
        ) : null}
      </CardTitle>
      <CardDescription>
        {action === 'view'
          ? ''
          : action === 'edit'
            ? 'Edita este formulario con los datos de tu Cliente'
            : 'Completa este formulario con los datos de tu nuevo Cliente'}
      </CardDescription>
      <div className="mt-6 w-full">
        <form onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" name="id" value={id} />
          <div className="grid grid-cols-4 gap-4 w-full">
            <div>
              <Label htmlFor="company_name">Nombre de la compañía</Label>
              <Input
                id="company_name"
                {...register('company_name')}
                className="w-full"
                placeholder="nombre de la compañía"
                readOnly={readOnly}
              />
              {formErrors.company_name && (
                <CardDescription className="text-red-500">{formErrors.company_name.message}</CardDescription>
              )}
            </div>
            <div>
              <Label htmlFor="client_cuit">CUIT de la compañía</Label>
              <Input
                id="client_cuit"
                {...register('client_cuit')}
                className="w-full"
                placeholder="número de cuit"
                readOnly={readOnly}
              />
              {formErrors.client_cuit && (
                <CardDescription className="text-red-500">{formErrors.client_cuit.message}</CardDescription>
              )}
            </div>
            <div>
              <Label htmlFor="client_email">Email</Label>
              <Input
                id="client_email"
                {...register('client_email')}
                className="w-full"
                placeholder="email"
                readOnly={readOnly}
              />
              {formErrors.client_email && (
                <CardDescription className="text-red-500">{formErrors.client_email.message}</CardDescription>
              )}
            </div>
            <div>
              <Label htmlFor="client_phone">Número de teléfono</Label>
              <Input
                id="client_phone"
                {...register('client_phone')}
                className="w-full"
                placeholder="teléfono"
                readOnly={readOnly}
              />
              {formErrors.client_phone && (
                <CardDescription className="text-red-500">{formErrors.client_phone.message}</CardDescription>
              )}
            </div>
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                {...register('address')}
                className="w-full"
                placeholder="dirección"
                readOnly={readOnly}
              />
              {formErrors.address && (
                <CardDescription className="text-red-500">{formErrors.address.message}</CardDescription>
              )}
            </div>
          </div>

          <br />
          {action === 'view' && readOnly === true ? null : (
            <Button type="submit" className="mt-5">
              {id ? 'Guardar' : 'Registrar'}
            </Button>
          )}
          <Toaster />
        </form>
      </div>
    </Card>
  );
  const sharedUsersAll = useLoggedUserStore((state) => state.sharedUsers)?.filter((e) => e.customer_id?.id === id);
  const user = useLoggedUserStore((state) => state.profile);
  const sharedUsers =
    sharedUsersAll?.map((user) => {
      return {
        email: user.profile_id.email,
        fullname: user.profile_id.fullname,
        role: user?.role,
        alta: user.created_at,
        id: user.id,
        img: user.profile_id.avatar || '',
        customerName: user.customer_id?.name,
      };
    }) || [];

  const guestsData =
    sharedUsers
      ?.filter((user) => user.role === 'Invitado') // Filtrar usuarios donde el rol no sea "Invitado"
      ?.map((user) => ({
        ...user,
        fullname: user.fullname || '',
      })) || [];

  const totalPages = Math.ceil(servicesData?.length / itemsPerPage);
  const currentReports = servicesData?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  //console.log(filteredItems)
  return (
    <section className={cn('md:mx-7 max-w-full')}>
      {action === 'view' ? (
        <section className={cn('md:mx-7 mt-8')}>
          <Accordion type="single" collapsible className="border-2 pl-4 rounded-lg mb-6">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg hover:no-underline p-2 border-b-2 ">
                {clientData?.name}
              </AccordionTrigger>
              <AccordionContent>{renderCard()}</AccordionContent>
            </AccordionItem>
          </Accordion>

          <Tabs defaultValue="empleados activos" className="h-full flex-1 flex-col mt-6">
            <TabsList>
              <TabsTrigger value="empleados activos">Empleados Activos</TabsTrigger>
              <TabsTrigger value="empleados inactivos">Empleados Inactivos</TabsTrigger>
              <TabsTrigger value="equipos">Equipos</TabsTrigger>
              <TabsTrigger value="servicios">Servicios</TabsTrigger>
              <TabsTrigger value="invitados">invitados</TabsTrigger>
            </TabsList>
            <TabsContent value="empleados activos">
              <div className="h-full flex-1 flex-col space-y-8 md:flex">
                <Card>
                  <CardContent>
                    <EmployeesTable columns={EmployeesListColumns} data={filteredCustomersActiveEmployees || []} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="empleados inactivos">
              <div className="h-full flex-1 flex-col space-y-8 md:flex">
                <Card>
                  <CardContent>
                    <EmployeesTable columns={EmployeesListColumns} data={filteredCustomersInActiveEmployees || []} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="equipos">
              <Card>
                <CardContent>
                  <EquipmentTable
                    columns={columns1 || []}
                    data={filteredCustomersEquipment || []}
                    // allCompany={allCompany}
                    // showInactive={showInactive}
                    // setShowInactive={setShowInactive}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="servicios">
              <Card className="w-full">
                <CardContent className="p-0">
                  <div className="flex gap-2 justify-center m-2 ml-auto">
                    <span className="mt-1 text-lg">Filas por página: </span>

                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}
                    >
                      <SelectTrigger className="w-[70px]">
                        <SelectValue placeholder="Seleccionar cantidad" />
                      </SelectTrigger>
                      <SelectContent className="w-auto min-w-[70px] absolute">
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="40">40</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="60">60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[25%]">Nombre del Servicio</TableHead>
                          <TableHead className="w-[25%]">Estado</TableHead>
                          <TableHead className="w-[25%]">Inicio del Servicio</TableHead>
                          <TableHead className="w-[25%]">Validez del Servicio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentReports?.map((service: any) => (
                          <TableRow
                            key={service.id}
                            onClick={() => handleOpenModal(service)}
                            className="cursor-pointer"
                          >
                            <TableCell className="font-medium">{service.service_name}</TableCell>
                            <TableCell>
                              <Badge variant={service.is_active ? 'success' : 'default'}>
                                {service.is_active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                            <TableCell>{moment(service.service_start).format('DD/MM/YYYY')}</TableCell>
                            <TableCell>{moment(service.service_validity).format('DD/MM/YYYY')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-center mt-4">
                    {Array.from({ length: totalPages }, (_, index) => (
                      <Button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        variant={currentPage === index + 1 ? 'default' : 'outline'}
                        className="mx-1"
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invitados">
              <Card>
                <CardContent className="p-4">
                  <DataTableInvited data={guestsData || []} columns={columnsGuests} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      ) : (
        renderCard()
      )}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-5xl w-full flex flex-col">
          {' '}
          {/* Limitar el ancho máximo del modal */}
          <DialogHeader>
            <DialogTitle>Items del servicio: {selectedService?.service_name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto w-full max-h-[500px]">
            {' '}
            {/* max-h para limitar la altura del contenido */}
            <Table className="w-full table-auto">
              {' '}
              {/* Asegurar que la tabla ocupe el ancho máximo posible */}
              <TableHeader className="bg-header-background">
                <TableRow>
                  <TableCell className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nombre
                  </TableCell>
                  <TableCell className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estado
                  </TableCell>
                  <TableCell className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Descripción
                  </TableCell>
                  <TableCell className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    UDM
                  </TableCell>
                  {/* <TableCell className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Precio
                  </TableCell> */}
                  {/* <TableCell className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cliente
            </TableCell> */}
                </TableRow>
              </TableHeader>
              <TableBody className="bg-background divide-y">
                {filteredItems?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-sm font-medium text-muted-foreground">
                      {item.item_name}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-muted-foreground">
                      <Badge variant={item.is_active ? 'success' : 'default'}>
                        {item.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-muted-foreground">
                      {item.item_description}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-muted-foreground">
                      {item.item_measure_units?.unit}
                    </TableCell>
                    {/* <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-muted-foreground">
                      ${item.item_price}
                    </TableCell> */}
                    {/* <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-muted-foreground">
                {item.customer_service_id?.customer_id?.name}
              </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
