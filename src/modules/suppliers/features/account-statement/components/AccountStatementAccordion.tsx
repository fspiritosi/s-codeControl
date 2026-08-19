'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion';
import { Badge } from '@/shared/components/ui/badge';
import { InvoicesSection } from './sections/InvoicesSection';
import { PurchaseOrdersSection } from './sections/PurchaseOrdersSection';
import { ReceivingNotesSection } from './sections/ReceivingNotesSection';
import { PaymentOrdersSection } from './sections/PaymentOrdersSection';
import { ExpensesSection } from './sections/ExpensesSection';
import { CreditSection } from './sections/CreditSection';

interface Props {
  supplierId: string;
  invoices: { rows: any[]; summary: any };
  purchaseOrders: { rows: any[]; summary: any };
  receivingNotes: { rows: any[]; summary: any };
  paymentOrders: { rows: any[]; summary: any };
  expenses: { rows: any[]; summary: any };
  creditBalance: any;
  applicableInvoices: any[];
  creditNotes?: any[];
  creditNoteApplications?: any[];
}

export function AccountStatementAccordion({
  supplierId,
  invoices,
  purchaseOrders,
  receivingNotes,
  paymentOrders,
  expenses,
  creditBalance,
  applicableInvoices,
  creditNotes = [],
  creditNoteApplications = [],
}: Props) {
  // El badge muestra la plata a favor completa: pagos a cuenta + notas de
  // crédito sin imputar (TKT-586).
  const creditAvailable =
    (creditBalance?.available ?? 0) +
    creditNotes.reduce((acc: number, n: any) => acc + (n.available ?? 0), 0);
  return (
    <Accordion type="multiple" defaultValue={['invoices']} className="space-y-2">
      <AccordionItem value="invoices" className="border rounded-md px-4 bg-card shadow-sm">
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

      <AccordionItem value="credit" className="border rounded-md px-4 bg-card shadow-sm">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <span className="font-medium">Saldo a favor</span>
            {creditAvailable > 0 && (
              <Badge variant="success">
                $
                {creditAvailable.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <CreditSection
            supplierId={supplierId}
            balance={creditBalance}
            applicableInvoices={applicableInvoices}
            creditNotes={creditNotes}
            creditNoteApplications={creditNoteApplications}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="expenses" className="border rounded-md px-4 bg-card shadow-sm">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <span className="font-medium">Gastos</span>
            <Badge variant="secondary">{expenses.summary?.total ?? 0}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <ExpensesSection rows={expenses.rows} summary={expenses.summary} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="purchase-orders" className="border rounded-md px-4 bg-card shadow-sm">
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

      <AccordionItem value="receiving-notes" className="border rounded-md px-4 bg-card shadow-sm">
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

      <AccordionItem value="payment-orders" className="border rounded-md px-4 bg-card shadow-sm">
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
