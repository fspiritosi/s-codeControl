import DocumentEquipmentComponent from '@/components/DocumentEquipmentComponent';
import RepairTypes from '@/components/Tipos_de_reparaciones/RepairTypes';
import { Card, CardFooter } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getRole } from '@/lib/utils/getRole';
import VehiclesForm, { generic } from '../../../../components/VehiclesForm';

export default async function EquipmentFormAction({ searchParams: searchParamsPromise }: { searchParams: Promise<any> }) {
  const searchParams = await searchParamsPromise;
  revalidatePath('/dashboard/equipment/action');

  const cookiesStore = await cookies();
  const company_id = cookiesStore.get('actualComp');

  let vehicle;

  if (searchParams.id) {
    try {
      const vehicleData = await prisma.vehicles.findMany({
        where: { id: searchParams.id },
        include: {
          brand_rel: { select: { name: true } },
          model_rel: { select: { name: true } },
          type_of_vehicle_rel: { select: { name: true } },
          type_rel: { select: { name: true } },
        },
      });

      vehicle = vehicleData?.map((item: any) => ({
        ...item,
        type_of_vehicle: item.type_of_vehicle_rel?.name,
        brand: item.brand_rel?.name,
        model: item.model_rel?.name,
        type: item.type_rel?.name,
      }));
    } catch (error) {
      console.error(error);
    }
  }

  let types: any[] = [];
  let brand_vehicles: any[] = [];
  try {
    types = await prisma.type.findMany({
      where: {
        OR: [
          { company_id: company_id?.value },
          { company_id: null },
        ],
      },
    });

    brand_vehicles = await prisma.brand_vehicles.findMany({
      where: {
        OR: [
          { company_id: company_id?.value },
          { company_id: null },
        ],
      },
    });
  } catch (error) {
    console.error(error);
  }

  const role = await getRole();
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
