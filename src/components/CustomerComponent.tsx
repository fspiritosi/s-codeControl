'use client';

import { columnsGuests } from '@/app/dashboard/company/actualCompany/components/columnsGuests';
import { DataTable as DataTableInvited } from '@/app/dashboard/company/actualCompany/components/data-table';
import { createdCustomer, updateCustomer } from '@/app/dashboard/company/customers/action/create';
import { DataTable } from '@/app/dashboard/company/customers/action/data-table';
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
import { columns } from '../app/dashboard/company/customers/action/columnsCustomers';
import { EquipmentColums as columns1 } from '../app/dashboard/equipment/columns';
import { EmployeesTable } from '@/app/dashboard/employee/data-table';
import { EmployeesListColumns } from '@/app/dashboard/employee/columns';

export default function ClientRegister({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const functionAction = id ? updateCustomer : createdCustomer;
  const [errors, setErrors] = useState<any>({});
  const actualCompany = useLoggedUserStore((state) => state.actualCompany?.id);
  const [action, setAction] = useState(searchParams.get('action'));
  const [readOnly, setReadOnly] = useState(action === 'edit' ? false : true);
  const [clientData, setClientData] = useState<any>(null);
  const [contactData, setContactData] = useState<any>(null);
  const employees = useLoggedUserStore((state) => state.employeesToShow);
  const equipment = useLoggedUserStore((state) => state.vehiclesToShow);
  // const filteredCustomersEmployees = employees?.filter(
  //   (customer: any) => customer.allocated_to && customer.allocated_to.includes(clientData?.id)
  // );
  const filteredCustomersEmployees = employees
  ?.filter((customer: any) => customer.allocated_to && customer.allocated_to.includes(clientData?.id))
  .map((customer: any) => ({
    ...customer,
    guild: customer.guild?.name
  }));


  const filteredCustomersEquipment = equipment?.filter(
    (customer: any) => customer.allocated_to && customer.allocated_to.includes(clientData?.id)
  );
  console.log(filteredCustomersEquipment);
  // const setActivesEmployees = useLoggedUserStore((state) => state.setActivesEmployees);
  // const setInactiveEmployees = useLoggedUserStore((state) => state.setInactiveEmployees);
  // const showDeletedEmployees = useLoggedUserStore((state) => state.showDeletedEmployees);
  // const setShowDeletedEmployees = useLoggedUserStore((state) => state.setShowDeletedEmployees);
  // const allCompany = useLoggedUserStore((state) => state.allCompanies);
  // const [showInactive, setShowInactive] = useState(false);
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
              className="px-4 py-2 bg-blue-500 text-white rounded-md min-w-[100px]"
              variant="primary"
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
      <div className="mt-6 rounded-xl flex w-full">
        <form onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" name="id" value={id} />
          <div className="flex flex-wrap gap-3 items-center w-full">
            <div>
              <Label htmlFor="company_name">Nombre de la compañía</Label>
              <Input
                id="company_name"
                {...register('company_name')}
                className="max-w-[350px] w-[300px]"
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
                className="max-w-[350px] w-[300px]"
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
                className="max-w-[350px] w-[300px]"
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
                className="max-w-[350px] w-[300px]"
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
                className="max-w-[350px] w-[300px]"
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

          <Tabs defaultValue="empleados" className="h-full flex-1 flex-col mt-6">
            <TabsList>
              <TabsTrigger value="empleados">Empleados</TabsTrigger>
              <TabsTrigger value="equipos">Equipos</TabsTrigger>
              <TabsTrigger value="invitados">invitados</TabsTrigger>
            </TabsList>
            <TabsContent value="empleados">
              <div className="h-full flex-1 flex-col space-y-8 md:flex">
                <Card>
                  <CardContent>
                    {/* <DataTable
                      columns={columns}                      
                      data={filteredCustomersEmployees || []}
                      setActivesEmployees={setActivesEmployees}
                      setInactiveEmployees={setInactiveEmployees}
                      showDeletedEmployees={showDeletedEmployees}
                      setShowDeletedEmployees={setShowDeletedEmployees}
                    /> */}
                    <EmployeesTable
                      columns={EmployeesListColumns}
                      data={filteredCustomersEmployees || []}
                      // allCompany={allCompany}
                      // showInactive={showInactive}
                      // setShowInactive={setShowInactive}
                      />
                  </CardContent>

                </Card>
              </div>
            </TabsContent>
            <TabsContent value="equipos">
              <Card>
                <CardContent>
                  <EquipmentTable
                    columns={columns1}
                    data={filteredCustomersEquipment || []}
                    // allCompany={allCompany}
                    // showInactive={showInactive}
                    // setShowInactive={setShowInactive}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="invitados">
                <Card>
                  <CardContent className='p-4'>
                    <DataTableInvited data={guestsData || []} columns={columnsGuests} />
                  </CardContent>
                </Card>
              
            </TabsContent>
          </Tabs>
        </section>
      ) : (
        renderCard()
      )}
    </section>
  );
}
