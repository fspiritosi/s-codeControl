import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Eye, Plus } from 'lucide-react';
import { getPaymentOrdersPaginated, getSuppliersForOrder } from '../actions.server';
import {
  PAYMENT_ORDER_STATUS_LABELS,
  PAYMENT_ORDER_STATUSES,
} from '../../../shared/validators';
import { PaymentOrdersFilters } from './PaymentOrdersFilters';

interface ListFilters {
  status?: string;
  supplier_id?: string;
  scheduled_from?: string;
  scheduled_to?: string;
}

export default async function PaymentOrdersList({
  filters = {},
}: {
  filters?: ListFilters;
}) {
  const [{ data }, suppliers] = await Promise.all([
    getPaymentOrdersPaginated(
      { pageSize: '100' },
      {
        status: filters.status || null,
        supplier_id: filters.supplier_id || null,
        scheduled_from: filters.scheduled_from || null,
        scheduled_to: filters.scheduled_to || null,
      }
    ),
    getSuppliersForOrder(),
  ]);

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

      <PaymentOrdersFilters
        suppliers={suppliers.map((s) => ({ id: s.id, label: `${s.code} — ${s.business_name}` }))}
        statuses={PAYMENT_ORDER_STATUSES.map((s) => ({
          value: s,
          label: PAYMENT_ORDER_STATUS_LABELS[s],
        }))}
        initial={{
          status: filters.status ?? '',
          supplier: filters.supplier_id ?? '',
          from: filters.scheduled_from ?? '',
          to: filters.scheduled_to ?? '',
        }}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Nº</TableHead>
              <TableHead className="w-[110px]">Fecha</TableHead>
              <TableHead className="w-[130px]">Pago programado</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="w-[70px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  Sin órdenes de pago. Creá la primera con &quot;Nueva orden&quot;.
                </TableCell>
              </TableRow>
            ) : (
              data.map((po) => {
                const variant =
                  po.status === 'PAID'
                    ? 'success'
                    : po.status === 'CONFIRMED'
                      ? 'default'
                      : po.status === 'CANCELLED'
                        ? 'destructive'
                        : 'outline';
                return (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono font-medium">{po.full_number}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(po.date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {po.scheduled_payment_date
                        ? format(new Date(po.scheduled_payment_date), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {po.supplier?.business_name ?? (
                        <span className="text-muted-foreground">Sin proveedor</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${po.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={variant as any}>
                        {PAYMENT_ORDER_STATUS_LABELS[po.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="size-8" asChild>
                        <Link href={`/dashboard/treasury/payment-orders/${po.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
