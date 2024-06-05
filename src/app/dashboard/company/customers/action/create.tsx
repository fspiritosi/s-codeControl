"use server"
// import { Card, CardDescription, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Button } from '@/components/ui/button'
import { supabaseServer } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { redirect } from "next/navigation";
//import {supabase} from "../../supabase/supabase"
//import { useRouter} from "next/navigation"

// export default async function registerCostumer() {
//     //const router = useRouter()
export async function createdCustomer(formData: FormData) {
    const supabase = supabaseServer()

    const { data: { session }, } = await supabase.auth.getSession()

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
    revalidatePath('/dashboard/company/customers')




    const clientData = {
        name: formData.get('company_name'),
        cuit: formData.get('client_cuit'),
        client_email: formData.get('client_email'),
        client_phone: formData.get('client_phone'),
        address: formData.get('address'),
        company_id: Companies?.[0].id
    }
    console.log("client Data: ", clientData)

    const contactData = {
        contact_name: formData.get('contact_name'),
        constact_email: formData.get('contact_email'),
        contact_phone: formData.get('contact_phone'),
        contact_charge: formData.get('contact_charge'),
        company_id: Companies?.[0].id
    }
    console.log("contact Data: ", contactData)

    try {
        // Guardar datos en la tabla 'customer'
        const newClient = await supabase.from('customers').insert(clientData).select()
        //await new Promise(resolve => setTimeout(resolve, 10000));
        console.log("new client: ", newClient)

        //     // Guardar datos en la tabla 'contacts'
        const customer_id = newClient?.data ? newClient?.data[0]?.id : null;

        console.log("customer_id: ", customer_id)
        const contactDataWithCustomerId = {
            ...contactData,
            customer_id: customer_id
        };

        const createdContact = await supabase.from('contacts').insert(contactDataWithCustomerId).select();

        console.log('Cliente creado:', createdCustomer);
        console.log('Contacto creado:', createdContact);
        //return {
        //newClient,
        //createdContact
        //};


    } catch (error) {
        console.error(error);
    };
    redirect("/dashboard/company/actualCompany")
}

export async function updateCustomer(formData: FormData) {
    const supabase = supabaseServer()

    const { data: { session }, } = await supabase.auth.getSession()

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
    revalidatePath('/dashboard/company/actualCompany')


    const id = formData.get("id")
    console.log("id de formulario: ", id)
    const clientData = {
        name: formData.get('company_name'),
        cuit: formData.get('client_cuit'),
        client_email: formData.get('client_email'),
        client_phone: formData.get('client_phone'),
        address: formData.get('address'),
        company_id: Companies?.[0].id
    }
    console.log("client Data Update: ", clientData)

    const contactData = {
        contact_name: formData.get ('contact_name') ,
        constact_email: formData.get('contact_email'),
        contact_phone: formData.get('contact_phone'),
        contact_charge: formData.get('contact_charge'),
        company_id: Companies?.[0].id
    }
    console.log("contact Data Update: ", contactData)
    try {
        // Guardar datos en la tabla 'customer'

        const editClient = await supabase
        .from('customers')
        .update([clientData])
        .eq("id",id)
        .select()
        
        console.log("edit client: ", editClient)

            // Guardar datos en la tabla 'contacts'
        const customer_id = editClient?.data ? editClient?.data[0]?.id : null;

        console.log("customer_id: ", customer_id)
        const contactDataWithCustomerId = {
            ...contactData,
            customer_id: customer_id
        };

        const editContact = await supabase
        .from('contacts')
        .update(contactDataWithCustomerId)
        .eq("customer_id",id)
        .select();

        console.log('Cliente editado:', editClient);
        console.log('Contacto editado:', editContact);
        

    } catch (error) {
        console.error(error);
    };
    
    redirect("/dashboard/company/actualCompany")
}