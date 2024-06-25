"use server"

import { supabaseServer } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { redirect } from "next/navigation";
import { toast } from 'sonner'

export async function createdContact(formData: FormData) {
    const supabase = supabaseServer()

    const { data: { session }, } = await supabase.auth.getSession()

    const { data } = await supabase
        .from('profile')
        .select('*')
        .eq('email', session?.user.email)
    // // // console.log(data)
    const { data: Companies, error } = await supabase
        .from('company')
        .select(`*`)
        .eq('owner_id', data?.[0]?.id)
    // // // console.log(Companies)
    let { data: share_company_users, error: sharedError } = await supabase
        .from('share_company_users')
        .select(`*`)
        .eq('profile_id', data?.[0]?.id)
    // // // // console.log(share_company_users)
    revalidatePath('/dashboard/company/customers')

    const contactData = {
        contact_name: formData.get('contact_name'),
        constact_email: formData.get('contact_email'),
        contact_phone: formData.get('contact_phone'),
        contact_charge: formData.get('contact_charge'),
        company_id: Companies?.[0].id,
        customer_id: formData.get('customer'),
    }
    // console.log("contact Data: ", contactData)

    try {

        
        const createdContact = await supabase.from('contacts').insert(contactData).select();
        
    } catch (error) {
        console.error(error);
        
    };
    redirect("/dashboard/company/actualCompany")
}

export async function updateContact(formData: FormData) {
    const supabase = supabaseServer()

    const { data: { session }, } = await supabase.auth.getSession()

    const { data } = await supabase
        .from('profile')
        .select('*')
        .eq('email', session?.user.email)
    // console.log(data)
    const { data: Companies, error } = await supabase
        .from('company')
        .select(`*`)
        .eq('owner_id', data?.[0]?.id)
    // console.log(Companies)
    let { data: share_company_users, error: sharedError } = await supabase
        .from('share_company_users')
        .select(`*`)
        .eq('profile_id', data?.[0]?.id)
    // console.log(share_company_users)
    revalidatePath('/dashboard/company/actualCompany')


    const id = formData.get("id")
    // console.log("id de formulario: ", id)


    const contactData = {
        contact_name: formData.get('contact_name'),
        constact_email: formData.get('contact_email'),
        contact_phone: formData.get('contact_phone'),
        contact_charge: formData.get('contact_charge'),
        company_id: Companies?.[0].id,
        customer_id: formData.get('customer'),
    }
    // console.log("contact Data Update: ", contactData)
    try {
        
        const editContact = await supabase
            .from('contacts')
            .update(contactData)
            .eq("id", id)
            .select();


        // console.log('Contacto editado:', editContact);


    } catch (error) {
        console.error(error);
    };

    redirect("/dashboard/company/actualCompany")
}





