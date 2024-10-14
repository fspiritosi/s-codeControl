import { cn } from '@/lib/utils';
import BackButton from '../../../../../components/BackButton';
import ContactComponent from '../../../../../components/ContactComponent';
export default async function ContactFormAction({ searchParams, params }: { searchParams: any; params: any }) {
  // const { data } = await supabase
  //   .from('customers')
  //   .select('*')
  //   .eq('id', searchParams.id)
  // revalidatePath('/dashboard/company/customer/action')

  return (
    <section className="grid grid-cols-2 xl:grid-cols-2 gap-2 py-4 justify-start">
      <div className=" flex gap-2">
        <BackButton />
      </div>

      <div
        className={cn(
          'col-span-6 flex flex-col justify-between overflow-hidden',
          searchParams.action === 'new' && 'col-span-8'
        )}
      >
        <ContactComponent id={searchParams.id} />
      </div>
    </section>
  );
}
