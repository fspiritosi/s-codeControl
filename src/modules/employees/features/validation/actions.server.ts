'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

export const validateEmployeeFileExists = async (legajo: string, companyId?: string) => {
  const ctx = await getActionContext();
  const cid = companyId || ctx.companyId;
  if (!cid) return true; // Allow if no company context

  try {
    const employee = await prisma.employees.findFirst({
      where: { company_id: cid, file: legajo },
    });
    return !employee; // true = valid (no duplicate), false = duplicate exists
  } catch (error) {
    console.error('Error validating employee file:', error);
    return true;
  }
};

export const validateEmployeeFileExistsForUpdate = async (legajo: string, employeeId: string, companyId?: string) => {
  const ctx = await getActionContext();
  const cid = companyId || ctx.companyId;
  if (!cid) return true;

  try {
    const employee = await prisma.employees.findFirst({
      where: { company_id: cid, file: legajo, NOT: { id: employeeId } },
    });
    return !employee;
  } catch (error) {
    console.error('Error validating employee file for update:', error);
    return true;
  }
};

export const validateDuplicatedCompanyCuitServer = async (cuit: string) => {
  try {
    const company = await prisma.company.findFirst({
      where: { company_cuit: cuit },
    });
    return !company; // true = valid (no duplicate)
  } catch (error) {
    console.error('Error validating company cuit:', error);
    return true;
  }
};

export const validateDuplicatedCuilServer = async (cuil: string, companyId?: string) => {
  const ctx = await getActionContext();
  const cid = companyId || ctx.companyId;
  if (!cid) return true;

  try {
    const employee = await prisma.employees.findFirst({
      where: { cuil, company_id: cid },
    });
    return !employee;
  } catch (error) {
    console.error('Error validating cuil:', error);
    return true;
  }
};

export const validateDuplicatedCuilForUpdateServer = async (cuil: string, employeeId: string, companyId?: string) => {
  const ctx = await getActionContext();
  const cid = companyId || ctx.companyId;
  if (!cid) return true;

  try {
    const employee = await prisma.employees.findFirst({
      where: { cuil, company_id: cid, NOT: { id: employeeId } },
    });
    return !employee;
  } catch (error) {
    console.error('Error validating cuil for update:', error);
    return true;
  }
};
