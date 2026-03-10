'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export async function createdContact(formData: FormData) {
  revalidatePath('/dashboard/company/customers');

  const contactData = {
    contact_name: formData.get('contact_name') as string | null,
    constact_email: formData.get('contact_email') as string | null,
    contact_phone: formData.get('contact_phone') as string | null,
    contact_charge: formData.get('contact_charge') as string | null,
    company_id: formData.get('company_id') as string | null,
    customer_id: formData.get('customer') as string | null,
  };

  const existingContact = await prisma.contacts.findFirst({
    where: {
      contact_name: contactData.contact_name || '',
      constact_email: contactData.constact_email || '',
      contact_phone: Number(contactData.contact_phone) || 0,
      contact_charge: contactData.contact_charge || '',
      company_id: contactData.company_id || '',
      customer_id: contactData.customer_id || '',
    },
  });

  if (existingContact) {
    return { status: 400, body: 'El contacto ya existe en esta empresa' };
  }
  try {
    await prisma.contacts.create({ data: contactData as any });
    return { status: 201, body: 'Contacto creado satisfactoriamente.' };
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
  revalidatePath('/dashboard/company/actualCompany');

  const id = formData.get('id') as string | null;

  const contactData = {
    contact_name: formData.get('contact_name') as string | null,
    constact_email: formData.get('contact_email') as string | null,
    contact_phone: formData.get('contact_phone') as string | null,
    contact_charge: formData.get('contact_charge') as string | null,
    company_id: formData.get('company_id') as string | null,
    customer_id: formData.get('customer') as string | null,
  };

  try {
    await prisma.contacts.update({
      where: { id: id || '' },
      data: contactData as any,
    });

    return { status: 200, body: 'Contacto actualizado satisfactoriamente' };
  } catch (error) {
    console.error(error);
    return { status: 500, body: 'Internal Server Error' };
  }

  redirect('/dashboard/company/actualCompany');
}
