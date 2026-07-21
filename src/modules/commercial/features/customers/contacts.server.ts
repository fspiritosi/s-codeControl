'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { revalidatePath } from 'next/cache';

const REVALIDATE = '/dashboard/commercial/customers';

type ContactInput = {
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  contact_charge?: string;
};

function parsePhone(value?: string): bigint | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits ? BigInt(digits) : null;
}

/** Contactos activos del cliente. */
export async function getCustomerContacts(customerId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const contacts = await prisma.contacts.findMany({
    where: { customer_id: customerId, company_id: companyId, is_active: true },
    orderBy: { created_at: 'asc' },
  });

  return contacts.map((c) => ({
    id: c.id,
    contact_name: c.contact_name ?? '',
    contact_email: c.constact_email ?? '',
    contact_phone: c.contact_phone !== null && c.contact_phone !== undefined ? String(c.contact_phone) : '',
    contact_charge: c.contact_charge ?? '',
  }));
}

export async function createContact(customerId: string, input: ContactInput) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };
  if (!input.contact_name?.trim()) return { error: 'El nombre del contacto es requerido' };

  try {
    const customer = await prisma.customers.findFirst({ where: { id: customerId, company_id: companyId }, select: { id: true } });
    if (!customer) return { error: 'Cliente no encontrado' };

    await prisma.contacts.create({
      data: {
        customer_id: customerId,
        company_id: companyId,
        contact_name: input.contact_name.trim(),
        constact_email: input.contact_email?.trim() || null,
        contact_phone: parsePhone(input.contact_phone),
        contact_charge: input.contact_charge?.trim() || null,
        is_active: true,
      },
    });
    revalidatePath(REVALIDATE);
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

export async function updateContact(id: string, input: Partial<ContactInput>) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    const contact = await prisma.contacts.findFirst({ where: { id, company_id: companyId }, select: { id: true } });
    if (!contact) return { error: 'Contacto no encontrado' };

    await prisma.contacts.update({
      where: { id },
      data: {
        ...(input.contact_name !== undefined ? { contact_name: input.contact_name.trim() } : {}),
        ...(input.contact_email !== undefined ? { constact_email: input.contact_email.trim() || null } : {}),
        ...(input.contact_phone !== undefined ? { contact_phone: parsePhone(input.contact_phone) } : {}),
        ...(input.contact_charge !== undefined ? { contact_charge: input.contact_charge.trim() || null } : {}),
      },
    });
    revalidatePath(REVALIDATE);
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

export async function deactivateContact(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    const contact = await prisma.contacts.findFirst({ where: { id, company_id: companyId }, select: { id: true } });
    if (!contact) return { error: 'Contacto no encontrado' };
    await prisma.contacts.update({ where: { id }, data: { is_active: false } });
    revalidatePath(REVALIDATE);
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}
