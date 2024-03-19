import { DocumentationDrawer } from '@/components/DocumentationDrawer'
import VehiclesForm from '../../../../components/VehiclesForm'

export default function EmployeeFormAction({
  searchParams,
}: {
  searchParams: any
}) {
  return (
    <main className="flex w-full justify-between">
      <VehiclesForm />
      {searchParams.action === 'new' ? false : <DocumentationDrawer />}
    </main>
  )
}
