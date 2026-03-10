'use server';
import { prisma } from '@/lib/prisma';

export const CreateNewFormAnswer = async (formId: string, formAnswer: any) => {
  // getActionContext not needed — no companyId guard in original
  const data = await prisma.form_answers.create({
    data: {
      form_id: formId,
      answer: formAnswer,
    },
  });

  return data;
};
