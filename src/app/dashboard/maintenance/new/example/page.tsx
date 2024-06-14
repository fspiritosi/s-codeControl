import { supabaseServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { SubmitCustomForm } from '../../components/SubmitCustomForm'

async function page() {
  const supabase = supabaseServer()
  const cookiesStore = cookies()
  const company_id = cookiesStore.get('actualComp')

  const { data, error } = await supabase
    .from('custom_form')
    .select('*')
    .eq('company_id', company_id?.value)

  return (
    <div>
      <SubmitCustomForm campos={[data?.[8]]} />
    </div>
  )
}

export default page
