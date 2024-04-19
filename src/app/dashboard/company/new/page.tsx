'use client'
import { CompanyRegister } from '@/components/CompanyRegister'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useSidebarOpen } from '@/store/sidebar'
export default function companyRegister() {

  const { expanded } = useSidebarOpen()
  return (
    <section  className={cn(
      'md:mx-7',
      expanded ? 'md:max-w-[calc(100vw-198px)]' : 'md:max-w-[calc(100vw-70px)]',
    )}>
      <Card className="mt-6 p-8">
        <CardTitle className="text-4xl mb-3">Registrar Compañía</CardTitle>
        <CardDescription>
          Completa este formulario con los datos de tu nueva compañia
        </CardDescription>
        {/* <h2 className=" text-3xl pb-5 pl-10"></h2> */}
        {/* <p className="pl-10 max-w-1/2">
        </p> */}
        <div className="mt-6 rounded-xl flex w-full">
          <CompanyRegister company={null} formEnabled={true} />
        </div>
      </Card>
    </section>
  )
}
