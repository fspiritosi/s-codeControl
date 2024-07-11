import { DocumentationDrawer } from '@/components/DocumentationDrawer';
import EmployeeAccordion from '@/components/EmployeeAccordion';
import { Card, CardFooter } from '@/components/ui/card';
import { supabaseServer } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export default async function EmployeeFormAction({ searchParams }: { searchParams: any }) {
  // const { data } = await supabase

  //   .from('documents_employees')
  //   .select('*,applies(*),id_document_types(*)')
  //   .eq('applies.document_number', searchParams.document)
  //   .not('applies', 'is', null)

  revalidatePath('/dashboard/employee/action');
  const supabase = supabaseServer()
  const user = await supabase.auth.getUser();

  const { data: userShared } = await supabase
  .from('share_company_users')
  .select('*')
  .eq('profile_id', user?.data?.user?.id);
const role: string | null = userShared?.[0]?.role || null;

  return (
    <section className="grid grid-cols-1 xl:grid-cols-8 gap-3 md:mx-7 py-4">
      <Card
        className={cn(
          'col-span-8 flex flex-col justify-between overflow-hidden',
          // searchParams.action === 'new' && 'col-span-8'
        )}
      >
        <EmployeeAccordion role={role} />
        <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
      </Card>
    </section>
  );
}
