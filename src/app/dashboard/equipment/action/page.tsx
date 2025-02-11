import DocumentEquipmentComponent from '@/components/DocumentEquipmentComponent';
import RepairTypes from '@/components/Tipos_de_reparaciones/RepairTypes';
import { Card, CardFooter } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
// import { supabase } from '../../../../../supabase/supabase';
import { supabaseServer } from '@/lib/supabase/server';
import { getRole } from '@/lib/utils/getRole';
import VehiclesForm, { generic } from '../../../../components/VehiclesForm';

export default async function EquipmentFormAction({ searchParams }: { searchParams: any }) {
  const supabase = supabaseServer();
  // const { data } = await supabase
  //   .from('documents_equipment')
  //   .select('*,id_document_types(*)')
  //   .eq('applies', searchParams.id);

  revalidatePath('/dashboard/equipment/action');

  const cookiesStore = cookies();
  const company_id = cookiesStore.get('actualComp');

  let vehicle;

  //console.log(searchParams.id, 'searchParams.id');

  if (searchParams.id) {
    //const newVehicle = await fetchEquipmentById(searchParams.id);
    const { data: vehicleData, error } = await supabase
      .from('vehicles')
      .select('*, brand_vehicles(name), model_vehicles(name),types_of_vehicles(name),type(name)')
      .eq('id', searchParams.id);
    // .eq('company_id', actualCompany?.value);

    if (error) console.log('eroor', error);

    vehicle = vehicleData?.map((item: any) => ({
      ...item,
      type_of_vehicle: item.types_of_vehicles.name,
      brand: item.brand_vehicles.name,
      model: item.model_vehicles.name,
      type: item.type.name,
    }));
    console.log('vehicle-old-fetch', vehicle);
    //console.log('vehicle-new-fetch', newVehicle);
  }

  let { data: types, error } = await supabase
    .from('type')
    .select('*')
    .or(`company_id.eq.${company_id?.value},company_id.is.null`);

  let { data: brand_vehicles, error: errorError } = await supabase
    .from('brand_vehicles')
    .select('*')
    .or(`company_id.eq.${company_id?.value},company_id.is.null`);

  const role = await getRole();
  console.log('role action equipment', role);
  return (
    <section className="grid grid-cols-1 xl:grid-cols-8 gap-3 md:mx-7 py-4">
      <Card
        className={cn(
          'col-span-8 flex flex-col justify-between overflow-hidden',
          searchParams.action === 'new' && 'col-span-8'
        )}
      >
        <VehiclesForm
          role={role as string}
          vehicle={vehicle?.[0]}
          types={types as generic[]}
          brand_vehicles={brand_vehicles}
        >
          <TabsContent value="documents">
            <DocumentEquipmentComponent id={vehicle?.[0]?.id} role={role as string} />
          </TabsContent>
          <TabsContent value="repairs" className="px-3 py-2">
            <RepairTypes
              equipment_id={searchParams.id}
              type_of_repair_new_entry
              created_solicitudes
              defaultValue="created_solicitudes"
            />
          </TabsContent>
        </VehiclesForm>
        <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
      </Card>
    </section>
  );
}
