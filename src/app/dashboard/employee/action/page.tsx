import { DocumentationDrawer } from '@/components/DocumentationDrawer'
import EmployeeAccordion from '@/components/EmployeeAccordion'
import { revalidatePath } from 'next/cache'

export default function EmployeeFormAction({
  searchParams,
}: {
  searchParams: any
}) {
  revalidatePath('/dashboard/employee/action')
  return (
    <section className="flex w-full justify-between">
      <EmployeeAccordion />
      {searchParams.action === 'new' ? false : <DocumentationDrawer />}
    </section>
  )
}
