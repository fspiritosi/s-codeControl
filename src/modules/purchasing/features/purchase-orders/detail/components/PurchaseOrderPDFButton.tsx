'use client';

import { Package, FileText } from 'lucide-react';
import { format } from 'date-fns';
import {
  PDFOptionsDialog,
  type LinkedRecordGroup,
} from '@/shared/components/pdf/PDFOptionsDialog';
import {
  RECEIVING_NOTE_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
} from '@/modules/purchasing/shared/types';
import type { ReactNode } from 'react';

interface ReceivingNote {
  id: string;
  full_number: string;
  status: string;
  reception_date: string | Date;
}

interface PurchaseInvoice {
  id: string;
  full_number: string;
  status: string;
  total: number;
}

interface Order {
  id: string;
  full_number: string;
  receiving_notes?: ReceivingNote[];
  purchase_invoices?: PurchaseInvoice[];
}

interface Props {
  order: Order;
  trigger?: ReactNode;
}

function getStatusVariant(
  status: string
): 'default' | 'outline' | 'destructive' {
  if (status === 'CONFIRMED' || status === 'PAID') return 'default';
  if (status === 'CANCELLED') return 'destructive';
  return 'outline';
}

export function PurchaseOrderPDFButton({ order, trigger }: Props) {
  const groups: LinkedRecordGroup[] = [];

  // Remitos de recepcion
  if (order.receiving_notes && order.receiving_notes.length > 0) {
    groups.push({
      key: 'receivingNotes',
      label: 'Remitos de Recepcion',
      icon: Package,
      items: order.receiving_notes.map((rn) => ({
        label: rn.full_number,
        detail: format(new Date(rn.reception_date), 'dd/MM/yyyy'),
        status: RECEIVING_NOTE_STATUS_LABELS[rn.status] || rn.status,
        statusVariant: getStatusVariant(rn.status),
      })),
    });
  }

  // Facturas vinculadas
  if (order.purchase_invoices && order.purchase_invoices.length > 0) {
    groups.push({
      key: 'purchaseInvoices',
      label: 'Facturas de Compra',
      icon: FileText,
      items: order.purchase_invoices.map((inv) => ({
        label: inv.full_number,
        detail: `$${inv.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        status: INVOICE_STATUS_LABELS[inv.status] || inv.status,
        statusVariant: getStatusVariant(inv.status),
      })),
    });
  }

  return (
    <PDFOptionsDialog
      documentLabel={`Orden de Compra ${order.full_number}`}
      pdfUrl={`/api/purchase-orders/${order.id}/pdf`}
      linkedGroups={groups}
      trigger={trigger}
    />
  );
}
