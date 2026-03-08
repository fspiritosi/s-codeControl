import { cn } from '@/lib/utils';
import BackButton from '@/components/BackButton';
import ConvenantComponent from '@/components/CovenantComponent';
export default async function CovenantFormAction({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedSearchParams = await searchParams;

  return (
    <section className="grid grid-cols-2 xl:grid-cols-2 gap-2 py-4 justify-start">
      <div className=" flex gap-2">
        <BackButton />
      </div>

      <div
        className={cn(
          'col-span-6 flex flex-col justify-between overflow-hidden',
          resolvedSearchParams.action === 'new' && 'col-span-8'
        )}
      >
        <ConvenantComponent id={resolvedSearchParams.id} />
      </div>
    </section>
  );
}
