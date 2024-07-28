import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseServer } from '@/lib/supabase/server';
import { mapVehicle } from '@/lib/utils/utils';
import { cookies } from 'next/headers';
import { ExpiredColums } from '../../colums';
import { ColumnsMonthly } from '../../columsMonthly';
import { ExpiredDataTable } from '../../data-table';

async function EquipmentTabs() {
  const supabase = supabaseServer();
  const cookiesStore = cookies();
  const actualCompany = cookiesStore.get('actualComp')?.value;
  let { data, error: equipmentError } = await supabase
    .from('documents_equipment')
    .select(
      `*,
  document_types:document_types(*),
  applies(*,type(*),type_of_vehicle(*),model(*),brand(*),contractor_equipment(customers(*)))
  `
    )
    .eq('applies.company_id', actualCompany)
    .not('applies', 'is', null);
  const URL = process.env.NEXT_PUBLIC_BASE_URL;

  const response = await fetch(`${URL}/api/equipment`, { cache: 'no-store' });
  const response2 = await response.json();

  console.log(response2);

  const vehicles = data?.map(mapVehicle);

  console.log(vehicles);
  return (
    <Tabs defaultValue="permanentes">
      <CardContent>
        <TabsList>
          <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
          <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
        </TabsList>
      </CardContent>
      <TabsContent value="permanentes">
        <ExpiredDataTable
          data={vehicles?.filter((e) => !e.isItMonthly) || []}
          columns={ExpiredColums}
          pending={true}
          vehicles
          defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
          localStorageName={'dashboardVehiculosPermanentes'}
          permanent
        />
      </TabsContent>
      <TabsContent value="mensuales">
        <ExpiredDataTable
          data={vehicles?.filter((e) => e.isItMonthly) || []}
          columns={ColumnsMonthly}
          pending={true}
          vehicles
          defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
          localStorageName={'dashboardVehiculosMensuales'}
          monthly
        />
      </TabsContent>
    </Tabs>
  );
}

export default EquipmentTabs;
