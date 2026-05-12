import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';
import { getPaymentOrdersPaginated } from '../actions.server';
import { PaymentOrdersDataTable } from './_PaymentOrdersDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';

interface Props {
  searchParams: Record<string, string | undefined>;
}

export default async function PaymentOrdersList({ searchParams }: Props) {
  const { data, total } = await getPaymentOrdersPaginated(
    searchParams as DataTableSearchParams
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Órdenes de pago</h2>
        <Button size="sm" asChild>
          <Link href="/dashboard/treasury/payment-orders/new">
            <Plus className="size-4 mr-1" />
            Nueva orden
          </Link>
        </Button>
      </div>

      <PaymentOrdersDataTable
        data={data}
        totalRows={total}
        searchParams={searchParams}
      />
    </div>
  );
}
