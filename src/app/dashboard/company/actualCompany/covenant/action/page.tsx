import { cn } from '@/shared/lib/utils';
import BackButton from '@/shared/components/common/BackButton';
import ConvenantComponent from '@/modules/company/features/covenants/components/CovenantComponent';
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
