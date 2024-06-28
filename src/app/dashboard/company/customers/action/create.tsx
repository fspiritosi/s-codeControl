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
  const { data: Companies, error } = await supabase.from('company').select(`*`).eq('owner_id', data?.[0]?.id);
  let { data: share_company_users, error: sharedError } = await supabase
    .from('share_company_users')
    .select(`*`)
    .eq('profile_id', data?.[0]?.id);
  revalidatePath('/dashboard/company/customers');

  const form = Object.fromEntries(formData.entries());
  const client = customersSchema.parse(form);

  const clientData = {
    name: client.company_name,
    cuit: client.client_cuit,
    client_email: client.client_email,
    client_phone: client.client_phone,
    address: client.address,
    company_id: Companies?.[0].id,
  };

  try {
    // Guardar datos en la tabla 'customer'
    const newClient = await supabase.from('customers').insert(clientData).select();
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
  const { data: Companies, error } = await supabase.from('company').select(`*`).eq('owner_id', data?.[0]?.id);
  let { data: share_company_users, error: sharedError } = await supabase
    .from('share_company_users')
    .select(`*`)
    .eq('profile_id', data?.[0]?.id);
  revalidatePath('/dashboard/company/actualCompany');

  const id = formData.get('id');
  const clientData = {
    name: formData.get('company_name'),
    cuit: formData.get('client_cuit'),
    client_email: formData.get('client_email'),
    client_phone: formData.get('client_phone'),
    address: formData.get('address'),
    company_id: Companies?.[0].id,
  };

  const editClient = await supabase.from('customers').update([clientData]).eq('id', id).select();

  redirect('/dashboard/company/actualCompany');
}
