import { fetchAllEquipment } from '@/app/server/GET/actions';
import { cn } from '@/lib/utils';
import BackButton from '../../../../../../components/BackButton';
import CustomerComponent from '../../../../../../components/CustomerComponent';

export default async function CustomerFormAction({ searchParams, params }: { searchParams: any; params: any }) {
  const equipment = await fetchAllEquipment();

  return (
    <section className="grid grid-cols-2 xl:grid-cols-2 gap-2 py-4 justify-start">
      <div className="flex gap-2 col-start-2 justify-end mr-6">
        <BackButton />
      </div>

      <div
        className={cn(
          'col-span-6 flex flex-col justify-between overflow-hidden',
          searchParams.action === 'new' && 'col-span-8'
        )}
      >
        <CustomerComponent equipment={equipment} id={searchParams.id} />
      </div>
    </section>
  );
}
