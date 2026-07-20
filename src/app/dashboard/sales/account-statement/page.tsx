import { Suspense } from 'react';

import { getCustomersWithBalance } from '@/modules/sales/features/account-statement/actions.server';
import { CustomersBalanceList } from '@/modules/sales/features/account-statement';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

async function AccountStatementContent() {
  const data = await getCustomersWithBalance();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuentas corrientes de clientes</CardTitle>
        <CardDescription>
          Saldo actual de cada cliente. Ingresá a un cliente para ver su estado de cuenta detallado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CustomersBalanceList data={data} />
      </CardContent>
    </Card>
  );
}

export default function SalesAccountStatementPage() {
  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <AccountStatementContent />
    </Suspense>
  );
}
