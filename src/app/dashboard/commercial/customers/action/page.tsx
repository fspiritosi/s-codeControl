import { fetchAllEquipment } from '@/modules/equipment/features/list/actions.server';
import { cn } from '@/shared/lib/utils';
import BackButton from '@/shared/components/common/BackButton';
import CustomerComponent from '@/modules/commercial/features/customers/components/CustomerComponent';
import CustomerServicesManager from '@/modules/commercial/features/customers/components/CustomerServicesManager';

export default async function CustomerFormAction({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedSearchParams = await searchParams;
  const equipment = await fetchAllEquipment();
  const customerId = resolvedSearchParams.id as string | undefined;
  const showServices = !!customerId && resolvedSearchParams.action !== 'new';

  return (
    <section className="grid grid-cols-2 xl:grid-cols-2 gap-2 py-4 justify-start">
      <div className="flex gap-2 col-start-2 justify-end mr-6">
        <BackButton />
      </div>

      <div
        className={cn(
          'col-span-6 flex flex-col justify-between overflow-hidden',
          resolvedSearchParams.action === 'new' && 'col-span-8'
        )}
      >
        <CustomerComponent equipment={equipment as unknown as VehicleWithBrand[]} id={resolvedSearchParams.id} />
      </div>

      {showServices && (
        <div className="col-span-2 mr-6">
          <CustomerServicesManager customerId={customerId!} />
        </div>
      )}
    </section>
  );
}
