import { prisma } from '@/shared/lib/prisma';
import { cookies } from 'next/headers';
import { SubmitCustomForm } from '@/modules/forms/features/custom-forms/components/SubmitCustomForm';

async function page({ searchParams }: { searchParams: Promise<{ formid: string }> }) {
  const { formid } = await searchParams;
  const cookiesStore = await cookies();
  const company_id = cookiesStore.get('actualComp');
  const form = formid;
  const data = await prisma.custom_form.findMany({
    where: { company_id: company_id?.value || '' },
  });

  const dataForm = data?.find((e) => e.id === form);
  return (
    <div>
      <SubmitCustomForm campos={[dataForm]} />
    </div>
  );
}

export default page;
