"use server"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { supabaseServer } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
//import {supabase} from "../../supabase/supabase"
//import { useRouter} from "next/navigation"

export default async function clientRegister() {
    //const router = useRouter()
    const supabase = supabaseServer()

    const {data: { session },} = await supabase.auth.getSession()

    const { data } = await supabase
    .from('profile')
    .select('*')
    .eq('email', session?.user.email)
    console.log(data)
    const { data: Companies, error } = await supabase
    .from('company')
    .select(`*`)
    .eq('owner_id', data?.[0]?.id)
    console.log(Companies)
    let { data: share_company_users, error: sharedError } = await supabase
    .from('share_company_users')
    .select(`*`)
    .eq('profile_id', data?.[0]?.id)
        // console.log(share_company_users)
    //revalidatePath('/dashboard/company/new')


    
    async function createdCustomer(formData : formData){

       "use server";
        //event.preventDefault();

        //const formData = new FormData(event.currentTarget);

       const clientData = {
          name: formData.get('company_name'),
          cuit: formData.get('client_cuit'),
          // client_email: formData.get('client_email'),
          // client_phone: formData.get('client_phone'),
          address: formData.get('address'),
      };
      console.log("client Data: ", clientData)
      const contactData = {
          name: formData.get('contact_name'),
          email: formData.get('contact_email',
          // phone: formData.get('contact_phone'),
      };
      console.log("contact Data: ", contactData)

      try {
            // Guardar datos en la tabla 'customer'





        const newClient = await supabase
        .from('customer')
        .insert(clientData)
        .select()

        //     // Guardar datos en la tabla 'contacts'
        contactData.customer_id = newClient.data[0].id;
        const createdContact = await supabase.from('contacts').insert([contactData]);

        console.log('Cliente creado:', createdCustomer);
        console.log('Contacto creado:', createdContact);
        return {
            newClient,
            createdContact
        };

        
    } catch (error) {
        console.error(error);



    };
    

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
