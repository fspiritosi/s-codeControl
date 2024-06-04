"use client"
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { supabaseServer } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { createdCustomer, updateCustomer } from "../app/dashboard/customers/action/create"
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLoggedUserStore } from '@/store/loggedUser'
import {supabase} from "../../supabase/supabase"
//import { useRouter} from "next/navigation"

export default  function clientRegister({ id }: { id: string }) {
    const functionAction = id ? updateCustomer : createdCustomer;
    const searchParams = useSearchParams()
  // const id = params
  const [accion, setAccion] = useState(searchParams.get('action'))
  const pathname = usePathname()
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const [action, setAction] = useState(searchParams.get('action'));
  const [readOnly, setReadOnly] = useState(accion === 'edit' ? false : true)
  const [clientData, setClientData] = useState<any>(null);
  const [contactData, setContactData] = useState<any>(null);
    //revalidatePath('/dashboard/customer/action')
    
    useEffect(() => {
        // Verificar si se está editando o creando un nuevo cliente
        if (action === 'edit') {
            setReadOnly(false)
            
            // Obtener los datos del cliente con el ID proporcionado
            const id = searchParams.get('id');
            const fetchCustomers = async () => {
                const { data , error } = await supabase
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
                const { data , error } = await supabase
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
            
        }
    }, [action, id]);
    
    console.log("contactData: ", contactData)
    console.log("ID: ", id)
    

    return (
        <section className={cn('md:mx-7')}>


            <Card className="mt-6 p-8">
                <CardTitle className="text-4xl mb-3">Registrar Cliente</CardTitle>
                <CardDescription>
                    Completa este formulario con los datos de tu nuevo Cliente
                </CardDescription>
                <div className="mt-6 rounded-xl flex w-full">
                <form action={functionAction} >
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
                                    // readOnly={readOnly}
                                   
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
                                    //readOnly={readOnly}
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
                                    //readOnly={readOnly}
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
                                    //readOnly={readOnly}
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
                                    //readOnly={readOnly}
                                />

                            </div>






                        </div>
                        <br />

                        <CardTitle className="text-2xl mb-3">Contacto</CardTitle>
                        <CardDescription className="mb-4" >
                            Completa este formulario con los datos de Conatcto de tu Cliente
                        </CardDescription>
                        <div className=" flex flex-wrap gap-3 items-center w-full">
                            <div>
                                <Label htmlFor="contact_name">Nombre del Contacto</Label>
                                <Input
                                    id="contact_name"
                                    name="contact_name"
                                    className="max-w-[350px] w-[300px]"
                                    placeholder="nombre del contacto"
                                    defaultValue={contactData?.contact_name || ''}
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
                                />

                                <CardDescription
                                    id="contact_phone_error"
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
                                />

                                <CardDescription
                                    id="contact_charge_error"
                                    className="max-w-[300px]"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="mt-5"
                        >
                            {id ? "Editar Cliente"  :"Registrar Cliente"}
                        </Button>
                    </form>
                </div>
            </Card >
        </section >
    )


}