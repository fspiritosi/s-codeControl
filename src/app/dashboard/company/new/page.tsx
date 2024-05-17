import { CompanyRegister } from '@/components/CompanyRegister'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { supabaseServer } from '@/lib/supabase/server'

import { cn } from '@/lib/utils'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { revalidatePath } from 'next/cache'
export default async function companyRegister() {
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
            Parece que no tienes ninguna Compañía registrada.
          </AlertTitle>
          <AlertDescription>
            Para utilizar la aplicación debes registrar tu compañía
          </AlertDescription>
        </Alert>
      )}

      <Card className="mt-6 p-8">
        <CardTitle className="text-4xl mb-3">Registrar Compañía</CardTitle>
        <CardDescription>
          Completa este formulario con los datos de tu nueva compañia
        </CardDescription>
        <div className="mt-6 rounded-xl flex w-full">
          <CompanyRegister company={null} formEnabled={true} />
        </div>
      </Card>
    </section>
  )
}
