import EmployeeAccordion from '@/components/EmployeeAccordion';
import { Card, CardFooter } from '@/components/ui/card';
import { supabaseServer } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { setEmployeesToShow } from '@/lib/utils/utils';
import { cookies } from 'next/headers';

export default async function EmployeeFormAction({ searchParams }: { searchParams: any }) {
  // const { data } = await supabase

  //   .from('documents_employees')
  //   .select('*,applies(*),id_document_types(*)')
  //   .eq('applies.document_number', searchParams.document)
  //   .not('applies', 'is', null)


  const supabase = supabaseServer();
  const user = await supabase.auth.getUser();

  const { data: userShared } = await supabase
    .from('share_company_users')
    .select('*')
    .eq('profile_id', user?.data?.user?.id);

  const role: string | null = userShared?.[0]?.role || null;

  const URL = process.env.NEXT_PUBLIC_BASE_URL;

  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value;

  let formattedEmployee;
  if (searchParams.employee_id) {
    const { employee } = await fetch(
      `${URL}/api/employees/${searchParams.employee_id}?actual=${company_id}&user=${user?.data?.user?.id}`
    ).then((e) => e.json());

    formattedEmployee = setEmployeesToShow(employee)?.[0];
  }


  return (
    <section className="grid grid-cols-1 xl:grid-cols-8 gap-3 md:mx-7 py-4">
      <Card
        className={cn(
          'col-span-8 flex flex-col justify-between overflow-hidden'
          // searchParams.action === 'new' && 'col-span-8'
        )}
      >
        <EmployeeAccordion user={formattedEmployee} role={role} />
        <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
      </Card>
    </section>
  );
}
