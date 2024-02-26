import { DocumentationDrawer } from '@/components/DocumentationDrawer'
import VehiclesForm2 from '../../../../components/VehiclesForm2'

export default function EmployeeFormAction({
  searchParams,
}: {
  searchParams: any
}) {
  return (
    <main className="flex w-full justify-between">
      <VehiclesForm2 />
      {searchParams.action === 'new' ? false : <DocumentationDrawer />}
    </main>
  )
}
