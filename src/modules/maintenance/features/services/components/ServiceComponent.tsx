import { prisma } from '@/shared/lib/prisma';
import { cookies } from 'next/headers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import ServiceItemsTable from './ServiceItemsTable';
import ServiceTable from './ServiceTable';
interface customer {
  id: string;
  name: string;
  is_active: boolean;
}

export default async function ServiceComponent() {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;

  const cookiesStore = await cookies();
  const company_id = cookiesStore.get('actualComp')?.value || '';

  const customersRes = await fetch(`${URL}/api/company/customers?actual=${company_id}`).then((e) => e.json());
  const customers = customersRes?.data?.customers ?? [];
  const filterCustomers = customers.filter((client: customer) => client.is_active === true);

  const servicesRes = await fetch(`${URL}/api/services?actual=${company_id}`).then((e) => e.json());
  const services = servicesRes?.data?.services ?? [];

  const itemsRes = await fetch(`${URL}/api/services/items?actual=${company_id}`).then((e) => e.json());
  const items = itemsRes?.data?.items ?? [];

  const measure_units = await prisma.measure_units.findMany();

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
      <TabsList>
        <TabsTrigger value="services">Cargar Servicio</TabsTrigger>
        <TabsTrigger value="servicesItems">Cargar Items</TabsTrigger>
      </TabsList>
      <TabsContent value="services">
        <ServiceTable services={services} customers={filterCustomers} company_id={company_id} />
      </TabsContent>
      <TabsContent value="servicesItems">
        <ServiceItemsTable
          measure_units={measure_units as any}
          customers={filterCustomers}
          services={services}
          company_id={company_id}
          items={items}
        />
      </TabsContent>
    </Tabs>
  );
}
