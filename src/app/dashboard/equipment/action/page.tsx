import { DocumentationDrawer } from '@/components/DocumentationDrawer'
import { Card } from '@/components/ui/card'
import VehiclesForm from '../../../../components/VehiclesForm'

export default function EmployeeFormAction({
  searchParams,
}: {
  searchParams: any
}) {
  return (
    <Card className="md:mx-7 py-4 px-6">
      <section className="grid grid-cols-1 xl:grid-cols-5">
        <div className=" col-span-4">
          <VehiclesForm />
        </div>
        <div className="xl:max-w-[40vw]  col-span-1 flex justify-center w-full">
          {searchParams.action === 'new' ? false : <DocumentationDrawer />}
        </div>
      </section>
    </Card>
  )
}
