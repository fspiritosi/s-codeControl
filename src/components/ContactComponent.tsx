"use client"
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { supabaseServer } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { createdContact, updateContact } from "../app/dashboard/company/contact/action/create"
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLoggedUserStore } from '@/store/loggedUser'
import { supabase } from "../../supabase/supabase"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Value } from '@radix-ui/react-select'

//import { useRouter} from "next/navigation"

export default function contactRegister({ id }: { id: string }) {
    const functionAction = id ? updateContact : createdContact;
    const searchParams = useSearchParams()
    // const id = params

    const pathname = usePathname()
    const actualCompany = useLoggedUserStore(state => state.actualCompany?.id)
    const [action, setAction] = useState(searchParams.get('action'));
    const [readOnly, setReadOnly] = useState(action === 'edit' ? false : true)
    const [clientData, setClientData] = useState<any>(null);
    const [contactData, setContactData] = useState<any>(null);
    //revalidatePath('/dashboard/customer/action')
    console.log("ACTUAL COMPANY: ", actualCompany)
    useEffect(() => {
        // Verificar si se está editando o creando un nuevo cliente
        console.log("action: ", action)
        const id = searchParams.get('id');
        if (action === 'view') {
            setReadOnly(true)
        }
        if (action === 'edit') {
            setReadOnly(false)
        }
        if (!id) {
            setReadOnly(false)
        }
        // Obtener los datos del cliente con el ID proporcionado


        const fetchCustomers = async () => {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('company_id', actualCompany)
            console.log("data: ", data)
            if (error) {
                console.error('Error fetching customers:', error)
            } else {
                setClientData(data)
            }
        }


        const fetchContact = async () => {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('id', id)

            if (error) {
                console.error('Error fetching contact:', error)
            } else {
                setContactData(data[0])
            }
        }

        fetchCustomers()
        fetchContact()



    }, [action, id]);
    console.log("clientData: ", clientData)
    console.log("contactData: ", contactData)
    console.log("ID: ", id)


    return (
        <section className={cn('md:mx-7')}>


            <Card className="mt-6 p-8">
                <CardTitle className="text-4xl mb-3">{action === "view" ? "" : (action === "edit" ? "Editar Contacto" : "Registrar Contacto")}</CardTitle>
                <CardDescription>
                    {action === "view" ? "" : (action === "edit" ? "Edita este formulario con los datos de tu Contacto" : "Completa este formulario con los datos de tu nuevo Contacto")}
                </CardDescription>
                <div className="mt-6 rounded-xl flex w-full">
                    <form action={action === "view" ? undefined : (functionAction)} >
                        <input type="hidden" name="id" value={id} />

                        {/* <CardTitle className="text-2xl mb-3">Contacto</CardTitle>
                        <CardDescription className="mb-4" >
                            Completa este formulario con los datos de tu Contacto
                        </CardDescription> */}
                        <div className=" flex flex-wrap gap-3 items-center w-full">
                            <div>
                                <Label htmlFor="contact_name">Nombre del Contacto</Label>
                                <Input
                                    id="contact_name"
                                    name="contact_name"
                                    className="max-w-[350px] w-[300px]"
                                    placeholder="nombre del contacto"
                                    defaultValue={contactData?.contact_name || ''}
                                    readOnly={readOnly}
                                />

                                <CardDescription
                                    id="contact_name_error"
                                    className="max-w-[300px]"
                                />
                            </div>
                            <div>
                                <Label htmlFor="contact_email">Email</Label>
                                <Input
                                    id="contact_email"
                                    name="contact_email"
                                    className="max-w-[350px] w-[300px]"
                                    placeholder="email"
                                    defaultValue={contactData?.constact_email || ''}
                                    readOnly={readOnly}
                                />
                                <CardDescription
                                    id="contact_email_error"
                                    className="max-w-[300px]"
                                />
                            </div>
                            <div>
                                <Label htmlFor="contact_phone">Número de teléfono</Label>
                                <Input
                                    id="contact_phone"
                                    name="contact_phone"
                                    className="max-w-[350px] w-[300px]"
                                    placeholder="teléfono"
                                    defaultValue={contactData?.contact_phone || ''}
                                    readOnly={readOnly}
                                />

                                <CardDescription
                                    id="contact_phone_error"
                                    className="max-w-[300px]"
                                />
                            </div>

                            <div>
                                <Label htmlFor="customer" >Seleccione un cliente</Label>
                                <Select defaultValue={contactData?.customer_id} name="customer" disabled={readOnly}  >
                                    <SelectTrigger

                                        id="customer"
                                        name="customer"
                                        className="max-w-[350px] w-[300px]"
                                    >
                                        <SelectValue

                                            id="customer"
                                            //placeholder="Seleccionar un cliente"
                                            placeholder={contactData?.customer_id ? clientData?.find((cli: any) => cli.id === contactData?.customer_id)?.name : "Seleccionar un cliente"}
                                        />
                                    </SelectTrigger>
                                    <SelectContent  >
                                        {clientData?.map((client: any) => (
                                            <SelectItem key={client?.id} value={client?.id} >
                                                {client?.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <CardDescription
                                    id="industry_error"
                                    className="max-w-[300px]"
                                />
                            </div>
                            <div>
                                <Label htmlFor="contact_charge">Cargo</Label>
                                <Input
                                    id="contact_charge"
                                    name="contact_charge"
                                    className="max-w-[350px] w-[300px]"
                                    placeholder="cargo en la empresa"
                                    defaultValue={contactData?.contact_charge || ''}
                                    readOnly={readOnly}
                                />


                                <CardDescription
                                    id="contact_charge_error"
                                    className="max-w-[300px]"
                                />

                            </div>
                        </div>
                        {action === "view" ? null : (
                            <Button
                                type="submit"
                                className="mt-5"
                            >

                                {id ? "Editar Contacto" : "Registrar Contacto"}

                            </Button>
                        )}
                    </form>
                </div>
            </Card >
        </section >
    )


}