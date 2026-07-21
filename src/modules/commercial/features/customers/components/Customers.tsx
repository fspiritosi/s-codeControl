
import { prisma } from '@/shared/lib/prisma';
import { columns } from './columns';
import { DataCustomers } from './data-table';
import { cookies } from 'next/headers';

export default async function Customers() {
  const coockiesStore = await cookies();
  const actualCompany = coockiesStore.get('actualComp')?.value;

  let customers: any[] = [];
  try {
    customers = await prisma.customers.findMany({
      where: { company_id: actualCompany },
    });
  } catch (error) {
    console.error('Error al obtener los contratistas:', error);
  }

  return (
    <div>
      <DataCustomers
        columns={columns}
        data={customers || []}
        localStorageName="customersColumns"
      />
    </div>
  );
}
