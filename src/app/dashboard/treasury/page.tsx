import { Suspense } from 'react';
import {
  UrlTabs,
  UrlTabsContent,
  UrlTabsList,
  UrlTabsTrigger,
} from '@/shared/components/ui/url-tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import CashRegistersList from '@/modules/treasury/features/cash-registers/components/CashRegistersList';
import BankAccountsList from '@/modules/treasury/features/bank-accounts/components/BankAccountsList';
import ChecksList from '@/modules/treasury/features/checks/components/ChecksList';
import PaymentOrdersList from '@/modules/treasury/features/payment-orders/components/PaymentOrdersList';
import RetentionsView from '@/modules/treasury/features/retentions/components/RetentionsView';
import {
  listPendingInvoices,
  getSuppliersWithPendingInvoices,
  PendingBalancesView,
} from '@/modules/treasury/features/pending-balances';

const VALID_TABS = [
  'cash-registers',
  'bank-accounts',
  'checks',
  'payment-orders',
  'retentions',
  'pending-balances',
] as const;
type TreasuryTab = (typeof VALID_TABS)[number];

export default async function TreasuryPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    status?: string;
    supplier?: string;
    from?: string;
    to?: string;
    op_status?: string;
    search?: string;
    page?: string;
    [key: string]: string | string[] | undefined;
  }>;
}) {
  const resolved = await searchParams;
  const tab: TreasuryTab = VALID_TABS.includes(resolved.tab as TreasuryTab)
    ? (resolved.tab as TreasuryTab)
    : 'cash-registers';
  const poFilters = {
    status: resolved.status,
    supplier_id: resolved.supplier,
    scheduled_from: resolved.from,
    scheduled_to: resolved.to,
  };

  return (
    <div className="p-6">
      <UrlTabs value={tab} paramName="tab" baseUrl="/dashboard/treasury">
        <UrlTabsList>
          <UrlTabsTrigger value="cash-registers">Cajas</UrlTabsTrigger>
          <UrlTabsTrigger value="bank-accounts">Cuentas bancarias</UrlTabsTrigger>
          <UrlTabsTrigger value="checks">Cheques</UrlTabsTrigger>
          <UrlTabsTrigger value="payment-orders">Órdenes de pago</UrlTabsTrigger>
          <UrlTabsTrigger value="retentions">Retenciones</UrlTabsTrigger>
          <UrlTabsTrigger value="pending-balances">Saldos pendientes</UrlTabsTrigger>
        </UrlTabsList>

        <UrlTabsContent value="cash-registers">
          <Card>
            <CardHeader>
              <CardTitle>Cajas físicas</CardTitle>
              <CardDescription>
                Gestioná las cajas de la empresa, sus sesiones y movimientos diarios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<PageTableSkeleton />}>
                <CashRegistersList />
              </Suspense>
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="bank-accounts">
          <Card>
            <CardHeader>
              <CardTitle>Cuentas bancarias</CardTitle>
              <CardDescription>
                Cuentas bancarias, movimientos y conciliación con extracto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<PageTableSkeleton />}>
                <BankAccountsList />
              </Suspense>
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="checks">
          <Card>
            <CardHeader>
              <CardTitle>Cheques</CardTitle>
              <CardDescription>
                Cheques propios emitidos y de terceros recibidos con máquina de estados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<PageTableSkeleton />}>
                <ChecksList />
              </Suspense>
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="payment-orders">
          <Card>
            <CardHeader>
              <CardTitle>Órdenes de pago</CardTitle>
              <CardDescription>
                Pagos a proveedores con imputación a facturas de compra y múltiples métodos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<PageTableSkeleton />}>
                <PaymentOrdersList filters={poFilters} />
              </Suspense>
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="retentions">
          {tab === 'retentions' && (
            <Suspense fallback={<PageTableSkeleton />}>
              <RetentionsView searchParams={resolved as any} />
            </Suspense>
          )}
        </UrlTabsContent>

        <UrlTabsContent value="pending-balances">
          {tab === 'pending-balances' && (
            <Suspense fallback={<PageTableSkeleton />}>
              <PendingBalancesTabContent
                supplier={resolved.supplier}
                opStatus={resolved.op_status}
                search={resolved.search}
                page={resolved.page}
              />
            </Suspense>
          )}
        </UrlTabsContent>
      </UrlTabs>
    </div>
  );
}

async function PendingBalancesTabContent({
  supplier,
  opStatus,
  search,
  page: pageParam,
}: {
  supplier?: string;
  opStatus?: string;
  search?: string;
  page?: string;
}) {
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const pageSize = 25;
  const validOpStatus =
    opStatus === 'NONE' || opStatus === 'SCHEDULED' ? opStatus : null;

  const [result, suppliers] = await Promise.all([
    listPendingInvoices({
      supplier_id: supplier ?? null,
      op_status: validOpStatus,
      search: search ?? null,
      page,
      pageSize,
    }),
    getSuppliersWithPendingInvoices(),
  ]);

  return (
    <PendingBalancesView
      rows={result.rows}
      total={result.total}
      summary={result.summary}
      suppliers={suppliers}
      page={page}
      pageSize={pageSize}
      initialFilters={{
        supplier_id: supplier,
        op_status: opStatus,
        search,
      }}
    />
  );
}
