import { DocumentationDrawer } from '@/components/DocumentationDrawer'
import EmployeeAccordionCopy from '@/components/EmployeeAccordionCopy'

export default function EmployeeFormAction({
  searchParams,
}: {
  searchParams: any
}) {

  return (
    <main className="flex w-full justify-between">
      <EmployeeAccordionCopy />
      {searchParams.action === 'new' ? false : <DocumentationDrawer />}
    </main>
  )
}