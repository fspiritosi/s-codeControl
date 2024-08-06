import React from 'react'
import { supabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import ServiceForm from './ServicesForm';
import ServiceTable from './ServiceTable';

export default async function ServiceComponent() {
  
    const URL = process.env.NEXT_PUBLIC_BASE_URL;
  
    const supabase = supabaseServer();
  
    const {data: { user }, error} = await supabase.auth.getUser();
    const cookiesStore = cookies();
    const company_id = cookiesStore.get('actualComp')?.value || '';
    // console.log(company_id)
    const { customers } = await fetch(`${URL}/api/company/customers?actual=${company_id}`).then((e) => e.json());
    const { services } = await fetch(`${URL}/api/services?actual=${company_id}`).then((e) => e.json());
    // console.log(services);
    // console.log(customers);
    const channels = supabase.channel('custom-all-channel')
.on(
  'postgres_changes',
  { event: '*', schema: 'public', table: 'customer_services' },
  async (payload) => {
    console.log('Change received!', payload)
    // Actualizar la lista de servicios con el servicio editado
    const { services } = await fetch(`${URL}/api/services?actual=${company_id}`).then((e) => e.json());
  }
)
.subscribe()

   
  return (
    <Tabs defaultValue="services">
    <TabsList >
      <TabsTrigger value="services">Cargar Servicio</TabsTrigger>
      <TabsTrigger value="servicesTable">Servicios Cargados</TabsTrigger>
    </TabsList>
    <TabsContent value="services">
      <h1>Cargar Servicios</h1>
      <ServiceForm customers={customers} company_id={String(company_id)}/>
    </TabsContent>
    <TabsContent value="servicesTable">
      <h1>Servicios Cargados</h1>
      <ServiceTable services={services} customers={customers} />
    </TabsContent>
  </Tabs>
  );
}
