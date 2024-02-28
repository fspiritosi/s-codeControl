import { DocumentationDrawer } from '@/components/DocumentationDrawer'
import EmployeeAccordion from '@/components/EmployeeAccordion'

export default function EmployeeFormAction({
  searchParams,
}: {
  searchParams: any
}) {
  return (
    <main className="flex w-full justify-between">
      <EmployeeAccordion />
      {searchParams.action === 'new' ? false : <DocumentationDrawer />}
    </main>
  )
}
