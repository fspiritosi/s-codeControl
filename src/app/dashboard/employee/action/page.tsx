import DocumentTable from '@/app/dashboard/document/DocumentTable';
import {
  fetchDiagramsByEmployeeId,
  fetchDiagramsHistoryByEmployeeId,
  fetchDiagramsTypes,
} from '@/app/server/GET/actions';
import EmployeeComponent from '@/components/EmployeeComponent';
import { Card, CardFooter } from '@/components/ui/card';
import { supabaseServer } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { getRole } from '@/lib/utils/getRole';
import { setEmployeesToShow } from '@/lib/utils/utils';
import moment from 'moment';
import { cookies } from 'next/headers';
export default async function EmployeeFormAction({ searchParams }: { searchParams: any }) {
  // const { data } = await supabase

  //   .from('documents_employees')
  //   .select('*,applies(*),id_document_types(*)')
  //   .eq('applies.document_number', searchParams.document)
  //   .not('applies', 'is', null)
  const role = await getRole()

  const supabase = supabaseServer();
  const user = await supabase.auth.getUser();

  // const { data: userShared } = await supabase
  //   .from('share_company_users')
  //   .select('*')
  //   .eq('profile_id', user?.data?.user?.id || '');

  const URL = process.env.NEXT_PUBLIC_BASE_URL;

  const coockiesStore = cookies();
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
    const { employee } = await fetch(
      `${URL}/api/employees/${searchParams.employee_id}?actual=${company_id}&user=${user?.data?.user?.id}`
    ).then((e) => e.json());

    formattedEmployee = setEmployeesToShow(employee)?.[0];
  }

  let { data: guilds, error } = await supabase
    .from('guild')
    .select('*')
    .eq('company_id', company_id || '')
    .eq('is_active', true);

  const guildIds = guilds?.map((guild: any) => guild.id);

  let { data: covenantsData, error: covenantserror } = await supabase
    .from('covenant')
    .select('*')
    .in('guild_id', guildIds || []);

  const covenantsIds = covenantsData?.map((covenant) => covenant.id);

  let { data: categoriesData, error: categorieserror } = await supabase
    .from('category')
    .select('*')
    .in('covenant_id', covenantsIds || []);

  guild = guilds?.map((guild) => {
    return {
      value: guild.id as string,
      label: guild.name as string,
    };
  });
  covenants = covenantsData?.map((covenant) => {
    return {
      id: covenant.id as string,
      name: covenant.name as string,
      guild_id: covenant.guild_id as string,
    };
  });
  categories = categoriesData?.map((category) => {
    return {
      id: category.id as string,
      name: category.name as string,
      covenant_id: category.covenant_id as string,
    };
  });

  const historyData = (await fetchDiagramsHistoryByEmployeeId(searchParams.employee_id)).map((item) => ({
    date: moment.utc(item.prev_date).format('DD/MM/YYYY'),
    description: item.description,
    status: item.state,
    previousStatus: item.prev_state,
    modifiedBy: item.modified_by?.fullname
      ?.split(' ')
      .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
      .join(' '), // Mapear las iniciales a mayúsculas
    modifiedAt: moment(item.created_at).local().format('DD/MM/YYYY HH:mm'), // Formatear a la hora local
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
          diagrams={diagrams2}
          diagrams_types={diagrams_types2}
          activeEmploees={[formattedEmployee]}
          historyData={historyData}
        >
          <DocumentTable role={role} employee_id={formattedEmployee?.id || ''} />
        </EmployeeComponent>
        <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
      </Card>
    </section>
  );
}
