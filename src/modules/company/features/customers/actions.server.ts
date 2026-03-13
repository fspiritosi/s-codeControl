'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

export const fetchCustomers = async () => {
  const { companyId } = await getActionContext();

  try {
    const data = await prisma.customers.findMany({
      where: { is_active: true, company_id: companyId || '' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};

export const fetchCustomerById = async (id: string) => {
  try {
    const data = await prisma.customers.findUnique({ where: { id } });
    return data;
  } catch (error) {
    console.error('Error fetching customer by id:', error);
    return null;
  }
};

export const fetchCustomersByCompanyActive = async (companyId: string) => {
  try {
    const data = await prisma.customers.findMany({
      where: { is_active: true, company_id: companyId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching customers by company:', error);
    return [];
  }
};

export const fetchCustomersByCompanyAll = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.customers.findMany({
      where: { company_id: companyId },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};

export const fetchCustomersByCompany = async (companyId: string) => {
  try {
    const data = await prisma.customers.findMany({ where: { company_id: companyId } });
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching customers:', error);
    return { data: null, error: String(error) };
  }
};

export const reactivateCustomer = async (id: string, companyId: string) => {
  try {
    await prisma.customers.updateMany({
      where: { id, company_id: companyId },
      data: { is_active: true },
    });
    return { error: null };
  } catch (error) {
    console.error('Error reactivating customer:', error);
    return { error: String(error) };
  }
};

export const reactivateContactsByCustomer = async (customerId: string, companyId: string) => {
  try {
    await prisma.contacts.updateMany({
      where: { customer_id: customerId, company_id: companyId },
      data: { is_active: true },
    });
    return { error: null };
  } catch (error) {
    console.error('Error reactivating contacts by customer:', error);
    return { error: String(error) };
  }
};

export const deactivateCustomer = async (
  id: string,
  companyId: string,
  terminationDate: string,
  reason: string
) => {
  try {
    await prisma.customers.updateMany({
      where: { id, company_id: companyId },
      data: {
        is_active: false,
        termination_date: terminationDate,
        reason_for_termination: reason,
      },
    });
    return { error: null };
  } catch (error) {
    console.error('Error deactivating customer:', error);
    return { error: String(error) };
  }
};

export const deactivateContactsByCustomer = async (customerId: string, companyId: string) => {
  try {
    await prisma.contacts.updateMany({
      where: { customer_id: customerId, company_id: companyId },
      data: { is_active: false },
    });
    return { error: null };
  } catch (error) {
    console.error('Error deactivating contacts by customer:', error);
    return { error: String(error) };
  }
};
