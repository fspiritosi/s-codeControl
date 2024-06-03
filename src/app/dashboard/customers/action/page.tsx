import { DocumentationDrawer } from '@/components/DocumentationDrawer'
import { Card, CardFooter, CardTitle, CardHeader, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { supabase } from '../../../../../supabase/supabase'
import VehiclesForm from '../../../../components/VehiclesForm'
import CustomerComponent from "../../../../components/CustomerComponent"
export default async function EquipmentFormAction({
  searchParams,
  params,
}: {
  searchParams: any
  params: any
}) {
  const { data } = await supabase
    .from('documents_equipment')
    .select('*,id_document_types(*)')
    .eq('applies', searchParams.id)
  revalidatePath('/dashboard/equipment/action')

  

  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-2 md:mx-7 py-4">
     
        
              <div className={cn(
          'col-span-6 flex flex-col justify-between overflow-hidden',
          searchParams.action === 'new' && 'col-span-8',
        )} >
                <CustomerComponent/>
              
              </div>
          
        {/* <VehiclesForm id={searchParams.id} /> */}
        
    
      
        
         
      
    </section>
  )
}
