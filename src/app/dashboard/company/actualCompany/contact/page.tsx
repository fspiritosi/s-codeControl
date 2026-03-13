import { cn } from '@/shared/lib/utils';
import BackButton from '@/shared/components/common/BackButton';
import ContactComponent from '@/modules/company/features/contacts/components/ContactComponent';
export default async function ContactFormAction({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedSearchParams = await searchParams;
  // const { data } = await supabase
  //   .from('customers')
  //   .select('*')
  //   .eq('id', resolvedSearchParams.id)
  // revalidatePath('/dashboard/company/customer/action')

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
        <ContactComponent id={resolvedSearchParams.id} />
      </div>
    </section>
  );
}
