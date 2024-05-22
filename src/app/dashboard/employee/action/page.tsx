import { DocumentationDrawer } from '@/components/DocumentationDrawer'
import EmployeeAccordion from '@/components/EmployeeAccordion'
import { Card, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { supabase } from '../../../../../supabase/supabase'

export default async function EmployeeFormAction({
  searchParams,
}: {
  searchParams: any
}) {

  // const { data } = await supabase

  //   .from('documents_employees')
  //   .select('*,applies(*),id_document_types(*)')
  //   .eq('applies.document_number', searchParams.document)
  //   .not('applies', 'is', null)

  revalidatePath('/dashboard/employee/action')

  console.log('render',searchParams)

  return (
    <section className="grid grid-cols-1 xl:grid-cols-8 gap-3 md:mx-7 py-4">
      <Card
        className={cn(
          'col-span-6 flex flex-col justify-between overflow-hidden',
          searchParams.action === 'new' && 'col-span-8',
        )}
      >
        <EmployeeAccordion />
        <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
      </Card>
      {searchParams.action === 'new' ? (
        false
      ) : (
        <Card className="xl:max-w-[40vw]  col-span-2 flex flex-col justify-center w-full overflow-hidden">
          <DocumentationDrawer document={searchParams.document}  resource="empleado" />
          <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
        </Card>
      )}
    </section>
  )
}
