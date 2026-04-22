
import { prisma } from '@/shared/lib/prisma';
import { columns } from './columns';
import { DataContacts } from './data-table';
import { cookies } from 'next/headers';

export default async function Contact() {
  const coockiesStore = await cookies();
  const actualCompany = coockiesStore.get('actualComp')?.value;

  let contacts: any[] = [];
  try {
    contacts = await prisma.contacts.findMany({
      where: { company_id: actualCompany },
      include: { customer: { select: { id: true, name: true } } },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
  }

  const contractorCompanies = contacts?.filter((company: any) => company.company_id?.toString() === actualCompany);

  return (
    <section>
      <DataContacts
        columns={columns}
        data={contractorCompanies || []}
        localStorageName="contactColums"
      />
    </section>
  );
}
