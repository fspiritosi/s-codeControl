import { prisma } from '@/lib/prisma';
import { FormData } from '@/types/types';
import { cookies } from 'next/headers';
import FormCardContainer from './FormCardContainer';

export async function FormCustomContainer({
  employees,
  documents,
  equipment,
  company,
  showAnswers,
}: {
  employees?: boolean;
  documents?: boolean;
  equipment?: boolean;
  company?: boolean;
  showAnswers?: boolean;
}) {
  const cookiesStore = await cookies();
  const company_id = cookiesStore.get('actualComp');
  const createdFormsState = await prisma.custom_form.findMany({
    where: { company_id: company_id?.value || '' },
    include: { form_answers: { select: { form_id: true } } },
  }) as unknown as FormData[] | undefined;
  return (
    <FormCardContainer
      form={createdFormsState || []}
      employees={employees}
      documents={documents}
      equipment={equipment}
      company={company}
      showAnswers={showAnswers}
    />
  );
}
