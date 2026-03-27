import DocumentTable from '@/modules/documents/features/list/components/DocumentTable';
import { fetchDiagramsByEmployeeId, fetchDiagramsHistoryByEmployeeId, fetchDiagramsTypes } from '@/modules/employees/features/diagrams/actions.server';
import EmployeeComponent from '@/modules/employees/features/create/components/EmployeeComponent';
import { Card, CardFooter } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';
import { getRole } from '@/shared/lib/utils/getRole';
import { setEmployeesToShow } from '@/shared/lib/utils/utils';
import { prisma } from '@/shared/lib/prisma';
import { format, parseISO } from 'date-fns';
import { cookies } from 'next/headers';

export default async function EmployeeFormAction({ searchParams: searchParamsPromise }: { searchParams: Promise<any> }) {
  const searchParams = await searchParamsPromise;
  const role = await getRole();

  const coockiesStore = await cookies();
  const company_id = coockiesStore.get('actualComp')?.value;

  let formattedEmployee;
  let guild:
    | {
        value: string;
        label: string;
      }[]
    | undefined = undefined;
  let covenants:
    | {
        id: string;
        name: string;
        guild_id: string;
      }[]
    | undefined = undefined;
  let categories:
    | {
        id: string;
        name: string;
        covenant_id: string;
      }[]
    | undefined = undefined;

  if (searchParams.employee_id) {
    const employees = await prisma.employees.findMany({
      where: { company_id: company_id || '', id: searchParams.employee_id },
      include: {
        hierarchy_rel: { select: { name: true } },
        birthplace_rel: { select: { name: true } },
        province_rel: { select: { name: true } },
        city_rel: { select: { name: true } },
        guild_rel: { select: { id: true, name: true } },
        covenants_rel: { select: { id: true, name: true } },
        category_rel: { select: { id: true, name: true } },
        workflow_diagram_rel: { select: { name: true } },
        contractor_employee: {
          include: { contractor: true },
        },
        documents_employees: true,
      },
    });

    // Normalize Prisma relation names to match what setEmployeesToShow expects
    // Convert BigInt FK fields to strings to avoid serialization errors
    const normalized = employees.map((emp: any) => ({
      ...emp,
      // Normalize date fields to yyyy-MM-dd strings (Prisma returns Date objects)
      date_of_admission: emp.date_of_admission instanceof Date
        ? emp.date_of_admission.toISOString().split('T')[0]
        : emp.date_of_admission,
      born_date: emp.born_date instanceof Date
        ? emp.born_date.toISOString().split('T')[0]
        : emp.born_date,
      province: emp.province_rel,
      city: emp.city_rel,
      hierarchical_position: emp.hierarchy_rel,
      birthplace: emp.birthplace_rel,
      guild: emp.guild_rel,
      covenant: emp.covenants_rel,
      category: emp.category_rel,
      workflow_diagram: emp.workflow_diagram_rel,
      contractor_employee: emp.contractor_employee?.map((ce: any) => ({
        ...ce,
        contractors: ce.contractor,
      })),
    }));
    // Sanitize BigInt values for JSON serialization
    const sanitized = JSON.parse(
      JSON.stringify(normalized, (_, v) => (typeof v === 'bigint' ? String(v) : v))
    );

    formattedEmployee = setEmployeesToShow(sanitized)?.[0];
  }

  const guildsData = await prisma.guild.findMany({
    where: { company_id: company_id || '', is_active: true },
  });

  const guildIds = guildsData.map((g) => g.id);

  const covenantsData = await prisma.covenant.findMany({
    where: { guild_id: { in: guildIds } },
  });

  const covenantsIds = covenantsData.map((c) => c.id);

  const categoriesData = await prisma.category.findMany({
    where: { covenant_id: { in: covenantsIds } },
  });

  guild = guildsData.map((g) => ({
    value: g.id as string,
    label: g.name as string,
  }));
  covenants = covenantsData.map((c) => ({
    id: c.id as string,
    name: c.name as string,
    guild_id: c.guild_id as string,
  }));
  categories = categoriesData.map((c) => ({
    id: c.id as string,
    name: c.name as string,
    covenant_id: c.covenant_id as string,
  }));

  const historyData = (await fetchDiagramsHistoryByEmployeeId(searchParams.employee_id)).map((item) => ({
    date: format(parseISO(item.prev_date), 'dd/MM/yyyy'),
    description: item.description,
    status: item.state,
    previousStatus: item.prev_state,
    modifiedBy: (item.modified_by_profile as Record<string, string> | null)?.fullname
      ?.split(' ')
      .map((name: string) => name.charAt(0).toUpperCase() + name.slice(1))
      .join(' '),
    modifiedAt: format(new Date(item.created_at), 'dd/MM/yyyy HH:mm'),
    type: item.prev_state ? 'modified' : 'created',
  }));

  const diagrams2 = await fetchDiagramsByEmployeeId(searchParams.employee_id);
  const diagrams_types2 = await fetchDiagramsTypes();
  return (
    <section className="grid grid-cols-1 xl:grid-cols-8 gap-3 md:mx-7 py-4">
      <Card className={cn('col-span-8 flex flex-col justify-between overflow-hidden')}>
        <EmployeeComponent
          guild={guild}
          covenants={covenants}
          categories={categories}
          user={formattedEmployee}
          role={role}
          diagrams={diagrams2 as unknown as EmployeeDiagramWithDiagramType[]}
          diagrams_types={diagrams_types2}
          activeEmploees={[formattedEmployee]}
          historyData={historyData}
        >
          <DocumentTable user={formattedEmployee} role={role} employee_id={formattedEmployee?.id || ''} />
        </EmployeeComponent>
        <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
      </Card>
    </section>
  );
}
