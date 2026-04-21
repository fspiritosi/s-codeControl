import WithdrawalOrderForm from '@/modules/warehouse/features/withdrawals/create/components/WithdrawalOrderForm';
import { getWarehousesByCompany } from '@/modules/warehouse/features/list/actions.server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

export default async function NewWithdrawalPage() {
  const { companyId } = await getActionContext();

  const [warehouses, employees, vehicles] = await Promise.all([
    getWarehousesByCompany(),
    prisma.employees.findMany({
      where: { company_id: companyId || '', is_active: true },
      select: { id: true, firstname: true, lastname: true },
      orderBy: { lastname: 'asc' },
    }),
    prisma.vehicles.findMany({
      where: { company_id: companyId || '', is_active: true },
      select: { id: true, domain: true, intern_number: true },
      orderBy: { intern_number: 'asc' },
    }),
  ]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Nueva orden de retiro</h1>
      <WithdrawalOrderForm warehouses={warehouses} employees={employees} vehicles={vehicles as any} />
    </div>
  );
}
