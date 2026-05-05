'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion';
import { Badge } from '@/shared/components/ui/badge';
import { InvoicesSection } from './sections/InvoicesSection';
import { PurchaseOrdersSection } from './sections/PurchaseOrdersSection';
import { ReceivingNotesSection } from './sections/ReceivingNotesSection';
import { PaymentOrdersSection } from './sections/PaymentOrdersSection';

interface Props {
  invoices: { rows: any[]; summary: any };
  purchaseOrders: { rows: any[]; summary: any };
  receivingNotes: { rows: any[]; summary: any };
  paymentOrders: { rows: any[]; summary: any };
}

export function AccountStatementAccordion({ invoices, purchaseOrders, receivingNotes, paymentOrders }: Props) {
  return (
    <Accordion type="multiple" defaultValue={['invoices']} className="space-y-2">
      <AccordionItem value="invoices" className="border rounded-md px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <span className="font-medium">Facturas de compra</span>
            <Badge variant="secondary">{invoices.summary?.total ?? 0}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <InvoicesSection rows={invoices.rows} summary={invoices.summary} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="purchase-orders" className="border rounded-md px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <span className="font-medium">Órdenes de compra</span>
            <Badge variant="secondary">{purchaseOrders.summary?.total ?? 0}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <PurchaseOrdersSection rows={purchaseOrders.rows} summary={purchaseOrders.summary} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="receiving-notes" className="border rounded-md px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <span className="font-medium">Remitos de recepción</span>
            <Badge variant="secondary">{receivingNotes.summary?.total ?? 0}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <ReceivingNotesSection rows={receivingNotes.rows} summary={receivingNotes.summary} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="payment-orders" className="border rounded-md px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <span className="font-medium">Órdenes de pago</span>
            <Badge variant="secondary">{paymentOrders.summary?.total ?? 0}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <PaymentOrdersSection rows={paymentOrders.rows} summary={paymentOrders.summary} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
