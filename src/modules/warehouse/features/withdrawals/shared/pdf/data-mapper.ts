/**
 * Mapea datos de orden de retiro del DB (Prisma, snake_case) al formato PDF (camelCase)
 */

import type { WithdrawalOrderPDFData } from './types';
import type { CompanyPDFData } from '@/shared/actions/export';

/**
 * Tipo que representa los datos crudos de Prisma para una ORM.
 * El campo quantity es Decimal y viene como `any`.
 */
type WithdrawalOrderRaw = {
  id: string;
  number: number;
  full_number: string;
  request_date: Date;
  status: string;
  notes: string | null;
  warehouse: {
    name: string;
    code: string;
  };
  employee: {
    firstname: string;
    lastname: string;
  } | null;
  vehicle: {
    domain: string;
    intern_number: string;
  } | null;
  lines: Array<{
    description: string;
    quantity: any; // Prisma Decimal
    notes: string | null;
    product: {
      code: string;
      name: string;
      unit_of_measure: string;
    } | null;
  }>;
};

/**
 * Convierte datos de orden de retiro (Prisma snake_case) + company a formato PDF (camelCase).
 * Convierte todos los Decimal de Prisma a Number.
 */
export function mapWithdrawalOrderDataForPDF(
  order: WithdrawalOrderRaw,
  company: CompanyPDFData,
  pdfSettings?: WithdrawalOrderPDFData['pdfSettings']
): WithdrawalOrderPDFData {
  return {
    company: {
      name: company.name,
      logo: company.logo,
      cuit: company.cuit || '',
      address: company.address || '',
      phone: company.phone || undefined,
      email: company.email || undefined,
    },

    withdrawalOrder: {
      fullNumber: order.full_number,
      number: order.number,
      requestDate: order.request_date,
      status: order.status,
    },

    warehouse: {
      name: order.warehouse.name,
      code: order.warehouse.code,
    },

    employee: order.employee
      ? {
          firstName: order.employee.firstname,
          lastName: order.employee.lastname,
        }
      : undefined,

    vehicle: order.vehicle
      ? {
          domain: order.vehicle.domain || '',
          internNumber: order.vehicle.intern_number || '',
        }
      : undefined,

    lines: order.lines.map((line) => ({
      productCode: line.product?.code || '-',
      productName: line.product?.name || line.description,
      quantity: Number(line.quantity),
      unitOfMeasure: line.product?.unit_of_measure || '-',
      notes: line.notes || undefined,
    })),

    notes: order.notes || undefined,
    pdfSettings,
  };
}
