import React from 'react'
import { supabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ServiceTable from './ServiceTable';
import ServiceItemsTable from './ServiceItemsTable';
interface measure_unit {
  id: number;
  unit: string;
  simbol: string;
  tipo: string;
}

export default async function ServiceComponent() {
  
    const URL = process.env.NEXT_PUBLIC_BASE_URL;
  
    const supabase = supabaseServer();
  
    const {data: { user }, error} = await supabase.auth.getUser();
    const cookiesStore = cookies();
    const company_id = cookiesStore.get('actualComp')?.value || '';
    const { customers } = await fetch(`${URL}/api/company/customers?actual=${company_id}`).then((e) => e.json());
    const { services } = await fetch(`${URL}/api/services?actual=${company_id}`).then((e) => e.json());
    // const {measure_units}= await fetch(`${URL}/api/meassure`).then((e) => e.json());
    
    const {data: measure_units} = await supabase
        .from('measure_units')
        .select('*');
    
//     const channels = supabase.channel('custom-all-channel')
// .on(
//   'postgres_changes',
//   { event: '*', schema: 'public', table: 'customer_services' },
//   async (payload) => {
   
   
//     const { services } = await fetch(`${URL}/api/services?actual=${company_id}`).then((e) => e.json());
//   }
// )
// .subscribe()

   
  return (
    <Tabs defaultValue="services">
    <TabsList >
      <TabsTrigger value="services">Cargar Servicio</TabsTrigger>
      <TabsTrigger value="servicesItems">Cargar Items</TabsTrigger>
    </TabsList>
    <TabsContent value="services">
      <ServiceTable services={services} customers={customers} company_id={company_id} />
    </TabsContent>
    <TabsContent value="servicesItems">
      <ServiceItemsTable  measure_units={measure_units as any} customers={customers} services={services} company_id={company_id}/>
    </TabsContent>
  </Tabs>
  );
}
