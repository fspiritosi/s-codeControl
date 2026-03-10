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

export const createCustomForm = async (formData: Record<string, unknown>) => {
  try {
    const data = await prisma.custom_form.create({ data: formData as any });
    return { data, error: null };
  } catch (error) {
    console.error('Error creating custom form:', error);
    return { data: null, error: String(error) };
  }
};

export const insertFormAnswer = async (formId: string, answer: any) => {
  try {
    const data = await prisma.form_answers.create({
      data: { form_id: formId, answer },
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting form answer:', error);
    return { data: null, error: String(error) };
  }
};
