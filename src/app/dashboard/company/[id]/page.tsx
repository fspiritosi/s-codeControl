import { CompanyRegister } from '@/components/CompanyRegister'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { supabaseServer } from '@/lib/supabase/server'

import { cn } from '@/lib/utils'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { revalidatePath } from 'next/cache'
export default async function companyRegister({ params }: { params: { id: string } }) {
  const supabase = supabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data } = await supabase
    .from('profile')
    .select('*')
    .eq('email', session?.user.email)

  const { data: Companies, error } = await supabase
    .from('company')
    .select(`*`)
    .eq('owner_id', data?.[0]?.id)

    const { data: companyData, error: companyError } = await supabase
    .from('company')
    .select('*')
    .eq('owner_id', data?.[0]?.id)
    .eq('id', params.id)
    .single()

  let { data: share_company_users, error: sharedError } = await supabase
    .from('share_company_users')
    .select(`*`)
    .eq('profile_id', data?.[0]?.id)
  revalidatePath('/dashboard/company/new')

  const showAlert = !Companies?.[0] && !share_company_users?.[0]

  return (
    <section className={cn('md:mx-7')}>
      {showAlert && (
        <Alert variant={'info'} className="w-fit">
          <AlertTitle className="flex justify-center items-center">
            <InfoCircledIcon className="inline size-5 mr-2 text-blue-500" />
            Editar Compañía registrada.
          </AlertTitle>
          <AlertDescription>
            Aquí podras editar tu compañía
          </AlertDescription>
        </Alert>
      )}

      <Card className="mt-6 p-8">
        <CardTitle className="text-4xl mb-3">Editar Compañía</CardTitle>
        <CardDescription>
          Edita este formulario con los datos que desees modificar
        </CardDescription>
        <div className="mt-6 rounded-xl flex w-full">
          <CompanyRegister company={companyData} formEnabled={true} />
        </div>
      </Card>
    </section>
  )
}