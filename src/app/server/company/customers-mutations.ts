'use server';
import { prisma } from '@/lib/prisma';

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

export const reactivateEmployeeByDocNumber = async (documentNumber: string) => {
  try {
    await prisma.employees.updateMany({
      where: { document_number: documentNumber },
      data: {
        is_active: true,
        termination_date: null,
        reason_for_termination: null,
      },
    });
    return { error: null };
  } catch (error) {
    console.error('Error reactivating employee:', error);
    return { error: String(error) };
  }
};

export const deactivateEmployeeByDocNumber = async (
  documentNumber: string,
  terminationDate: string,
  reason: string
) => {
  try {
    await prisma.employees.updateMany({
      where: { document_number: documentNumber },
      data: {
        is_active: false,
        termination_date: terminationDate,
        reason_for_termination: reason as any,
      },
    });
    return { error: null };
  } catch (error) {
    console.error('Error deactivating employee:', error);
    return { error: String(error) };
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
