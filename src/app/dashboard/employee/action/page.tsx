'use client'
import { DocumentationDrawer } from '@/components/DocumentationDrawer'
import EmployeeAccordion from '@/components/EmployeeAccordion'
import { Card, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useSidebarOpen } from '@/store/sidebar'

export default function EmployeeFormAction({
  searchParams,
}: {
  searchParams: any
}) {
  const { expanded } = useSidebarOpen()
  return (
    <Card
      className={cn(
        'md:mx-7 py-4 px-6',
        expanded ? 'md:max-w-[calc(100vw-198px)]' : 'md:max-w-[calc(100vw)]',
      )}
    >
      <CardTitle className="text-4xl mb-3">Detalle del empleado</CardTitle>
      <section className="grid grid-cols-1 xl:grid-cols-5 gap-x-6">
        <div className=" col-span-4">
          <EmployeeAccordion />
        </div>
        <div className="xl:max-w-[40vw]  col-span-1 flex justify-center w-full">
          {searchParams.action === 'new' ? false : <DocumentationDrawer />}
        </div>
      </section>
    </Card>
  )
}
