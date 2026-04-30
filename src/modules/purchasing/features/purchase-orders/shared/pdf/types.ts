/**
 * Tipos para generacion de PDFs de Ordenes de Compra
 */

import type { LinkedDocumentsData } from '@/shared/components/pdf/linked-documents-types';

export interface PurchaseOrderPDFData {
  // Datos de la empresa
  company: {
    name: string;
    logo: string | null;
    cuit: string;
    address: string;
    phone?: string;
    email?: string;
  };

  // Datos de la orden de compra
  purchaseOrder: {
    fullNumber: string;
    number: number;
    issueDate: Date;
    expectedDeliveryDate?: Date;
    status: string;
  };

  // Datos del proveedor
  supplier: {
    businessName: string;
    tradeName?: string;
    taxId: string;
    address?: string;
    phone?: string;
    email?: string;
  };

  // Lineas de productos
  lines: Array<{
    description: string;
    productCode?: string;
    quantity: number;
    unitCost: number;
    vatRate: number;
    subtotal: number;
    total: number;
  }>;

  // Totales
  subtotal: number;
  vatAmount: number;
  total: number;

  // Condiciones
  paymentConditions?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;

  // Cuotas / Entregas
  installments?: Array<{
    number: number;
    dueDate: Date;
    amount: number;
    notes?: string;
  }>;

  // Observaciones
  notes?: string;

  // Documentos vinculados (opcional)
  linkedDocuments?: LinkedDocumentsData;

  // Configuración de PDF de la empresa (opcional)
  pdfSettings?: {
    headerText?: string | null;
    footerText?: string | null;
    signatureUrl?: string | null;
  };
}
