
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { supabaseServer } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { createdCustomer } from "../app/dashboard/customers/action/create"
import { useState } from 'react';
//import {supabase} from "../../supabase/supabase"
//import { useRouter} from "next/navigation"

export default async function clientRegister() {

    //const router = useRouter()
    // const supabase = supabaseServer()

    // const { data: { session }, } = await supabase.auth.getSession()

    // const { data } = await supabase
    //     .from('profile')
    //     .select('*')
    //     .eq('email', session?.user.email)
    // console.log(data)
    // const { data: Companies, error } = await supabase
    //     .from('company')
    //     .select(`*`)
    //     .eq('owner_id', data?.[0]?.id)
    // console.log(Companies)
    // let { data: share_company_users, error: sharedError } = await supabase
    //     .from('share_company_users')
    //     .select(`*`)
    //     .eq('profile_id', data?.[0]?.id)
    // console.log(share_company_users)
    //revalidatePath('/dashboard/company/new')

    



    return (
        <section className={cn('md:mx-7')}>


            <Card className="mt-6 p-8">
                <CardTitle className="text-4xl mb-3">Registrar Cliente</CardTitle>
                <CardDescription>
                    Completa este formulario con los datos de tu nuevo Cliente
                </CardDescription>
                <div className="mt-6 rounded-xl flex w-full">
                    <form action={createdCustomer}>
                        <div className=" flex flex-wrap gap-3 items-center w-full">
                            <div>
                                <Label htmlFor="company_name">Nombre de la compañía</Label>
                                <Input
                                    id="company_name"
                                    name="company_name"
                                    className="max-w-[350px] w-[300px]"
                                    placeholder="nombre de la compañía"
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
                                    placeholder="nombre de la compañía"
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
                                />

                                <CardDescription
                                    id="contact_charge_error"
                                    className="max-w-[300px]"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            //formAction={formData => onSubmit(formData)}
                            className="mt-5"
                        >
                            Registrar Cliente
                        </Button>
                    </form>
                </div>
            </Card >
        </section >
    )


}