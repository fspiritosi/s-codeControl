'use server';

import { prisma } from '@/shared/lib/prisma';
import { customersSchema } from '@/shared/zodSchemas/schemas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export async function createdCustomer(formData: FormData) {
  try {
    revalidatePath('/dashboard/company/customers');

    const form = Object.fromEntries(formData.entries());

    const client = customersSchema.parse(form);

    const clientData = {
      name: client.company_name,
      cuit: client.client_cuit as unknown as number,
      client_email: client.client_email,
      client_phone: client.client_phone as unknown as number,
      address: client.address,
      company_id: formData.get('company_id') as string | null,
    };

    const existingClient = await prisma.customers.findFirst({
      where: {
        name: clientData.name,
        cuit: clientData.cuit,
        client_email: clientData.client_email || '',
        client_phone: clientData.client_phone || 0,
        address: clientData.address || '',
        company_id: clientData.company_id || '',
      },
    });

    if (existingClient) {
      return { status: 400, body: 'El cliente ya existe en esta empresa' };
    }

    await prisma.customers.create({ data: clientData as any });
    return { status: 201, body: 'Cliente creado satisfactoriamente.' };
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
  revalidatePath('/dashboard/company/actualCompany');

  const id = formData.get('id') as string | null;

  const clientData = {
    name: formData.get('company_name') as string | null,
    cuit: formData.get('client_cuit') as string | null,
    client_email: formData.get('client_email') as string | null,
    client_phone: formData.get('client_phone') as string | null,
    address: formData.get('address') as string | null,
    company_id: formData.get('company_id') as string | null,
  };

  try {
    await prisma.customers.update({
      where: { id: id || '' },
      data: clientData as any,
    });

    return { status: 200, body: 'Cliente actualizado satisfactoriamente' };
  } catch (error) {
    console.error(error);
    return { status: 500, body: 'Internal Server Error' };
  }

  redirect('/dashboard/company/actualCompany');
}
