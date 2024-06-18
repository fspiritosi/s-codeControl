"use client"
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { supabaseServer } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { createdCustomer, updateCustomer } from "../app/dashboard/company/customers/action/create"
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLoggedUserStore } from '@/store/loggedUser'
import { supabase } from "../../supabase/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { DataTable } from '@/app/dashboard/company/customers/action/data-table'
import { columns } from '../app/dashboard/company/customers/action/columnsCustomers'
import { DataEquipment } from '@/app/dashboard/equipment/data-equipment'
import {columns as columns1} from "../app/dashboard/equipment/columns"

export default function clientRegister({ id }: { id: string }) {
    const functionAction = id ? updateCustomer : createdCustomer;
    const searchParams = useSearchParams()
    // const id = params

    const pathname = usePathname()
    const actualCompany = useLoggedUserStore(state => state.actualCompany)
    const [action, setAction] = useState(searchParams.get('action'));
    const [readOnly, setReadOnly] = useState(action === 'edit' ? false : true)
    const [clientData, setClientData] = useState<any>(null);
    const [contactData, setContactData] = useState<any>(null);
    const customersEmployees = useLoggedUserStore(state => state.employees)
    const employees = useLoggedUserStore(state => state.employeesToShow)
    const equipment = useLoggedUserStore(state => state.vehiclesToShow)
    console.log(customersEmployees)
    const filteredCustomersEmployees = employees?.filter((customer: any) =>
        customer.allocated_to && customer.allocated_to.includes(clientData?.id)
    );
    const filteredCustomersEquipment = equipment?.filter((customer: any) =>
        customer.allocated_to && customer.allocated_to.includes(clientData?.id)
    );
    console.log(filteredCustomersEmployees)
    const setActivesEmployees = useLoggedUserStore(
        state => state.setActivesEmployees,
    )
    const setInactiveEmployees = useLoggedUserStore(
        state => state.setInactiveEmployees,
      )
      const showDeletedEmployees = useLoggedUserStore(
        state => state.showDeletedEmployees,
      )
      const setShowDeletedEmployees = useLoggedUserStore(
        state => state.setShowDeletedEmployees,
      )
    const allCompany = useLoggedUserStore(state => state.allCompanies)
    const [showInactive, setShowInactive] = useState(false)
    const useSearch = useSearchParams()
    //revalidatePath('/dashboard/company/customer/action')

    useEffect(() => {
        // Verificar si se está editando o creando un nuevo cliente
        console.log("action: ", action)
        if (action === 'view') {
            setReadOnly(true)
        }
        if (action === 'edit') {
            setReadOnly(false)
        }
        if (action === 'new') {
            setReadOnly(false)
        }
        // Obtener los datos del cliente con el ID proporcionado
        const id = searchParams.get('id');
        const fetchCustomers = async () => {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)

            if (error) {
                console.error('Error fetching customers:', error)
            } else {
                setClientData(data[0])
            }
        }
        const fetchContact = async () => {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('customer_id', id)

            if (error) {
                console.error('Error fetching contact:', error)
            } else {
                setContactData(data[0])
            }
        }

        fetchCustomers()
        fetchContact()



    }, [action, id]);

    console.log("contactData: ", contactData)
    console.log("ID: ", id)
    const renderCard = () => (
        <Card className="mt-6 p-8">
            <CardTitle className="text-4xl mb-3">
                {action === "view" ? "" : (action === "edit" ? "Editar Cliente" : "Registrar Cliente")}
                {action === "view" ? (
                    <div className="flex flex-grap gap-2 ">
                        <Button className="px-4 py-2 bg-blue-500 text-white rounded-md min-w-[100px]"
                            variant="primary"
                            onClick={() => {
                                setReadOnly(!readOnly)

                            }}
                        >
                            {!readOnly ? "No editar" : "  Editar "}
                        </Button>

                    </div>
                ) : null}
            </CardTitle>
            <CardDescription>
                {action === "view" ? "" : (action === "edit" ? "Edita este formulario con los datos de tu Cliente" : "Completa este formulario con los datos de tu nuevo Cliente")}
            </CardDescription>
            <div className="mt-6 rounded-xl flex w-full">
                <form action={functionAction}>
                    <input type="hidden" name="id" value={id} />
                    <div className=" flex flex-wrap gap-3 items-center w-full">
                        <div>
                            <Label htmlFor="company_name">Nombre de la compañía</Label>
                            <Input
                                id="company_name"
                                name="company_name"
                                className="max-w-[350px] w-[300px]"
                                placeholder="nombre de la compañía"
                                defaultValue={clientData?.name || ''}
                                readOnly={readOnly}
                            />
                            <CardDescription
                                id="company_name_error"
                                className="max-w-[300px]"
                            />
                        </div>
                        <div>
                            <Label htmlFor="client_cuit">CUIT de la compañía</Label>
                            <Input
                                name="client_cuit"
                                id="client_cuit"
                                className="max-w-[350px] w-[300px]"
                                placeholder="número de cuit"
                                defaultValue={clientData?.cuit || ''}
                                readOnly={readOnly}
                            />
                            <CardDescription
                                id="client_cuit_error"
                                className="max-w-[300px]"
                            />
                        </div>
                        <div>
                            <Label htmlFor="client_email">Email</Label>
                            <Input
                                id="client_email"
                                name="client_email"
                                className="max-w-[350px] w-[300px]"
                                placeholder="email"
                                defaultValue={clientData?.client_email || ''}
                                readOnly={readOnly}
                            />
                            <CardDescription
                                id="client_email_error"
                                className="max-w-[300px]"
                            />
                        </div>
                        <div>
                            <Label htmlFor="client_phone">Número de teléfono</Label>
                            <Input
                                id="client_phone"
                                name="client_phone"
                                className="max-w-[350px] w-[300px]"
                                placeholder="teléfono"
                                defaultValue={clientData?.client_phone || ''}
                                readOnly={readOnly}
                            />
                            <CardDescription
                                id="client_phone_error"
                                className="max-w-[300px]"
                            />
                        </div>
                        <div>
                            <Label htmlFor="address">Dirección</Label>
                            <Input
                                id="address"
                                name="address"
                                className="max-w-[350px] w-[300px]"
                                placeholder="dirección"
                                defaultValue={clientData?.address || ''}
                                readOnly={readOnly}
                            />
                        </div>
                    </div>
                    <br />
                    {(action === "view" && readOnly === true) ? null : (
                        <Button type="submit" className="mt-5">
                            {id ? " Guardar " : "Registrar"}
                        </Button>
                    )}
                </form>
            </div>
        </Card>
    )


    return (

        <section className={cn('md:mx-7 max-w-full')}>

            {action === "view" ? (
                <section className={cn('md:mx-7 mt-8')}>
                    <Accordion type="single" collapsible className="border-2 pl-4 rounded-lg">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-lg hover:no-underline p-2 border-b-2 ">{clientData?.name}</AccordionTrigger>
                            <AccordionContent>
                                {renderCard()}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    <h1>Acá va el resto de los datos</h1>
                    
                    <Tabs defaultValue="empleados" className=" h-full flex-1 flex-col ">
                        <TabsList>
                            <TabsTrigger value="empleados">Empleados</TabsTrigger>
                            <TabsTrigger value="equipos">Equipos</TabsTrigger>
                        </TabsList>
                        <TabsContent value="empleados" >
                        <div className=" h-full flex-1 flex-col space-y-8  md:flex">
                        <DataTable
                                columns={columns}
                                data={filteredCustomersEmployees || []}
                                setActivesEmployees={setActivesEmployees}
                                setInactiveEmployees={setInactiveEmployees}
                                showDeletedEmployees={showDeletedEmployees}
                                setShowDeletedEmployees={setShowDeletedEmployees}
                            />
                        </div>
                        </TabsContent>
                        <TabsContent value="equipos">
                        <DataEquipment
                                columns={columns1}
                                data={filteredCustomersEquipment || []}
                                allCompany={allCompany}
                                showInactive={showInactive}
                                setShowInactive={setShowInactive}
                        
                        />
                        </TabsContent>
                    </Tabs>

                </section>
            ) : (
                renderCard()
            )}
        </section>

    )



}