'use server';

import { supabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export async function createdContact(formData: FormData) {
  const supabase = supabaseServer();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data } = await supabase
    .from('profile')
    .select('*')
    .eq('email', session?.user.email || '');

  const { data: Companies, error } = await supabase
    .from('company')
    .select(`*`)
    .eq('owner_id', data?.[0]?.id || '');

  let { data: share_company_users, error: sharedError } = await supabase
    .from('share_company_users')
    .select(`*`)
    .eq('profile_id', data?.[0]?.id || '');

  revalidatePath('/dashboard/company/customers');

  const contactData = {
    contact_name: formData.get('contact_name'),
    constact_email: formData.get('contact_email'),
    contact_phone: formData.get('contact_phone'),
    contact_charge: formData.get('contact_charge'),
    company_id: formData.get('company_id'),
    customer_id: formData.get('customer'),
  };

  const { data: existingContact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('contact_name', contactData.contact_name || '')
    .eq('constact_email', contactData.constact_email || '')
    .eq('contact_phone', contactData.contact_phone || '')
    .eq('contact_charge', contactData.contact_charge || '')
    .eq('company_id', contactData.company_id || '')
    .eq('customer_id', contactData.customer_id || '')
    .single();

  if (existingContact) {
    return { status: 400, body: 'El contacto ya existe en esta empresa' };
  }
  try {
    const createdContact = await supabase
      .from('contacts')
      .insert(contactData as any)
      .select();
    if (createdContact) {
      return { status: 201, body: 'Contacto creado satisfactoriamente.' };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 400, body: JSON.stringify(error.errors) };
    }
    console.error(error);
    return { status: 500, body: 'Internal Server Error' };
  }
  redirect('/dashboard/company/actualCompany');
}

export async function updateContact(formData: FormData) {
  const supabase = supabaseServer();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data } = await supabase
    .from('profile')
    .select('*')
    .eq('email', session?.user.email || '');

  const { data: Companies, error } = await supabase
    .from('company')
    .select(`*`)
    .eq('owner_id', data?.[0]?.id || '');

  let { data: share_company_users, error: sharedError } = await supabase
    .from('share_company_users')
    .select(`*`)
    .eq('profile_id', data?.[0]?.id || '');

  revalidatePath('/dashboard/company/actualCompany');

  const id = formData.get('id');

  const contactData = {
    contact_name: formData.get('contact_name'),
    constact_email: formData.get('contact_email'),
    contact_phone: formData.get('contact_phone'),
    contact_charge: formData.get('contact_charge'),
    company_id: formData.get('company_id'),
    // company_id: Companies?.[0].id,
    customer_id: formData.get('customer'),
  };

  try {
    const editContact = await supabase
      .from('contacts')
      .update(contactData as any)
      .eq('id', id || '')
      .select();

    return { status: 200, body: 'Contacto actualizado satisfactoriamente' };
  } catch (error) {
    console.error(error);
    return { status: 500, body: 'Internal Server Error' };
  }

  redirect('/dashboard/company/actualCompany');
}
