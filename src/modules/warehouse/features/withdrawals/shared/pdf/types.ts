/**
 * Tipos para generacion de PDFs de Ordenes de Retiro de Mercaderia (ORM)
 */

export interface WithdrawalOrderPDFData {
  // Datos de la empresa
  company: {
    name: string;
    logo: string | null;
    cuit: string;
    address: string;
    phone?: string;
    email?: string;
  };

  // Datos de la orden de retiro
  withdrawalOrder: {
    fullNumber: string;
    number: number;
    requestDate: Date;
    status: string;
  };

  // Almacen de origen
  warehouse: {
    name: string;
    code: string;
  };

  // Empleado que retira (opcional)
  employee?: {
    firstName: string;
    lastName: string;
  };

  // Vehiculo destino (opcional)
  vehicle?: {
    domain: string;
    internNumber: string;
  };

  // Lineas de materiales
  lines: Array<{
    productCode: string;
    productName: string;
    quantity: number;
    unitOfMeasure: string;
    notes?: string;
  }>;

  // Observaciones generales
  notes?: string;

  // Configuración de PDF de la empresa (opcional)
  pdfSettings?: {
    headerText?: string | null;
    footerText?: string | null;
    signatureUrl?: string | null;
  };
}
