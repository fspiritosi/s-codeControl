import { Card } from '@/components/ui/card'
import { supabaseServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { FormCustomContainer } from './components/FormCustomContainer'

export default async function MailPage() {
  const supabase = supabaseServer()
  const cookiesStore = cookies()
  const companyId = cookiesStore.get('actualComp')
  const { data, error } = await supabase
    .from('custom_form')
    .select('*')
    .eq('company_id', companyId?.value)
  return (
    <div className="hidden flex-col md:flex mt-6 md:mx-7 overflow-hidden max-h-full">
      <Card className="p-0">
        <FormCustomContainer createdForms={data} />
      </Card>
    </div>
  )
}
