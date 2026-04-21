'use server';
import { prisma } from '@/shared/lib/prisma';

export const fetchContactById = async (id: string) => {
  try {
    const data = await prisma.contacts.findMany({ where: { id } });
    return data;
  } catch (error) {
    console.error('Error fetching contact by id:', error);
    return [];
  }
};

export const fetchContactsWithCustomers = async () => {
  try {
    const data = await prisma.contacts.findMany({
      include: { customer: { select: { id: true, name: true } } },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
};

export const fetchContactsByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.contacts.findMany({
      where: { company_id: companyId },
      include: { customer: { select: { id: true, name: true } } },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching contacts by company:', error);
    return [];
  }
};

export const updateContactById = async (id: string, updateData: Record<string, unknown>) => {
  try {
    const data = await prisma.contacts.update({
      where: { id },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating contact:', error);
    return { data: null, error: String(error) };
  }
};

export const updateContactDeactivate = async (id: string, companyId: string, terminationDate: string, reason: string) => {
  try {
    const data = await prisma.contacts.updateMany({
      where: { id, company_id: companyId },
      data: {
        is_active: false,
        termination_date: terminationDate,
        reason_for_termination: reason,
      } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error deactivating contact:', error);
    return { data: null, error: String(error) };
  }
};

export const reactivateContact = async (id: string) => {
  try {
    const data = await prisma.contacts.update({
      where: { id },
      data: {
        is_active: true,
        termination_date: null,
        reason_for_termination: null,
      } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error reactivating contact:', error);
    return { data: null, error: String(error) };
  }
};
