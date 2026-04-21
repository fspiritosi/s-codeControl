/**
 * Mapea datos de orden de compra del DB (Prisma, snake_case) al formato PDF (camelCase)
 */

import type { PurchaseOrderPDFData } from './types';
import type { CompanyPDFData } from '@/shared/actions/export';
import type { LinkedDocumentsData } from '@/shared/components/pdf/linked-documents-types';

/**
 * Tipo que representa los datos crudos de Prisma para una OC.
 * Los campos Decimal vienen como `any` porque Prisma.Decimal no es serializable.
 */
type PurchaseOrderRaw = {
  id: string;
  number: number;
  full_number: string;
  issue_date: Date;
  expected_delivery_date: Date | null;
  subtotal: any; // Prisma Decimal
  vat_amount: any;
  total: any;
  status: string;
  payment_conditions: string | null;
  delivery_address: string | null;
  delivery_notes: string | null;
  notes: string | null;
  supplier: {
    business_name: string;
    trade_name: string | null;
    tax_id: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  lines: Array<{
    description: string;
    quantity: any;
    unit_cost: any;
    vat_rate: any;
    subtotal: any;
    total: any;
    product: {
      code: string;
      name: string;
    } | null;
  }>;
  installments: Array<{
    number: number;
    due_date: Date;
    amount: any;
    notes: string | null;
  }>;
};

/**
 * Convierte datos de orden de compra (Prisma snake_case) + company a formato PDF (camelCase).
 * Convierte todos los Decimal de Prisma a Number.
 */
export function mapPurchaseOrderDataForPDF(
  order: PurchaseOrderRaw,
  company: CompanyPDFData,
  linkedDocuments?: LinkedDocumentsData
): PurchaseOrderPDFData {
  return {
    company: {
      name: company.name,
      logo: company.logo,
      cuit: company.cuit || '',
      address: company.address || '',
      phone: company.phone || undefined,
      email: company.email || undefined,
    },

    purchaseOrder: {
      fullNumber: order.full_number,
      number: order.number,
      issueDate: order.issue_date,
      expectedDeliveryDate: order.expected_delivery_date || undefined,
      status: order.status,
    },

    supplier: {
      businessName: order.supplier.business_name,
      tradeName: order.supplier.trade_name || undefined,
      taxId: order.supplier.tax_id || '',
      address: order.supplier.address || undefined,
      phone: order.supplier.phone || undefined,
      email: order.supplier.email || undefined,
    },

    lines: order.lines.map((line) => ({
      description: line.description,
      productCode: line.product?.code || undefined,
      quantity: Number(line.quantity),
      unitCost: Number(line.unit_cost),
      vatRate: Number(line.vat_rate),
      subtotal: Number(line.subtotal),
      total: Number(line.total),
    })),

    subtotal: Number(order.subtotal),
    vatAmount: Number(order.vat_amount),
    total: Number(order.total),

    installments:
      order.installments && order.installments.length > 0
        ? order.installments.map((inst) => ({
            number: inst.number,
            dueDate: inst.due_date,
            amount: Number(inst.amount),
            notes: inst.notes || undefined,
          }))
        : undefined,

    paymentConditions: order.payment_conditions || undefined,
    deliveryAddress: order.delivery_address || undefined,
    deliveryNotes: order.delivery_notes || undefined,
    notes: order.notes || undefined,
    linkedDocuments,
  };
}
