'use server';

import { supabaseServer } from '@/lib/supabase/server';
import { customersSchema } from '@/zodSchemas/schemas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export async function createdCustomer(formData: FormData) {
  const supabase = supabaseServer();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data } = await supabase.from('profile').select('*').eq('email', session?.user.email);
  console.log(data);
  const { data: Companies, error } = await supabase.from('company').select(`*`).eq('owner_id', data?.[0]?.id);
  console.log(Companies);
  let { data: share_company_users, error: sharedError } = await supabase
    .from('share_company_users')
    .select(`*`)
    .eq('profile_id', data?.[0]?.id);
  // console.log(share_company_users)
  revalidatePath('/dashboard/company/customers');

  const form = Object.fromEntries(formData.entries());
  console.log(form);
  const client = customersSchema.parse(form);
  //console.log(client)

  const clientData = {
    name: client.company_name,
    cuit: client.client_cuit,
    client_email: client.client_email,
    client_phone: client.client_phone,
    address: client.address,
    company_id: Companies?.[0].id,
  };
  //console.log("client Data: ", clientData)

  try {
    // Guardar datos en la tabla 'customer'
    const newClient = await supabase.from('customers').insert(clientData).select();

    console.log('new client: ', newClient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 400, body: JSON.stringify(error.errors) };
    }
    console.error(error);
    return { status: 500, body: 'Internal Server Error' };
  }
  redirect('/dashboard/company/actualCompany');
}

export async function updateCustomer(formData: FormData) {
  const supabase = supabaseServer();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data } = await supabase.from('profile').select('*').eq('email', session?.user.email);
  console.log(data);
  const { data: Companies, error } = await supabase.from('company').select(`*`).eq('owner_id', data?.[0]?.id);
  console.log(Companies);
  let { data: share_company_users, error: sharedError } = await supabase
    .from('share_company_users')
    .select(`*`)
    .eq('profile_id', data?.[0]?.id);
  // console.log(share_company_users)
  revalidatePath('/dashboard/company/actualCompany');

  const id = formData.get('id');
  console.log('id de formulario: ', id);
  const clientData = {
    name: formData.get('company_name'),
    cuit: formData.get('client_cuit'),
    client_email: formData.get('client_email'),
    client_phone: formData.get('client_phone'),
    address: formData.get('address'),
    company_id: Companies?.[0].id,
  };
  console.log('client Data Update: ', clientData);

  try {
    // Guardar datos en la tabla 'customer'

    const editClient = await supabase.from('customers').update([clientData]).eq('id', id).select();

    console.log('edit client: ', editClient);

    console.log('Cliente editado:', editClient);
    // console.log('Contacto editado:', editContact);
  } catch (error) {
    console.error(error);
  }

  redirect('/dashboard/company/actualCompany');
}
