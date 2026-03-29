'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { getSession } from '@/shared/lib/session';

// --- Queries ---

export const fetchFormsAnswersByFormId = async (formId: string) => {
  const { companyId } = await getActionContext();

  const session = await getSession();
  const role = session.role;
  const userId = session.user?.id;

  if (role === 'Invitado') {
    try {
      const share_company_users = await prisma.share_company_users.findMany({
        where: {
          profile_id: userId || '',
          company_id: companyId || '',
        },
        include: {
          customer: {
            include: {
              contractor_equipment: {
                include: {
                  vehicle: {
                    include: {
                      brand_rel: true,
                      model_rel: true,
                      type_rel: true,
                      type_of_vehicle_rel: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const equipments_id =
        (share_company_users)?.flatMap((uc) =>
          uc.customer?.contractor_equipment?.map((ce) => ce.vehicle?.id)
        ) || [];

      // Fetch all form answers and filter by JSON field in JS
      const allAnswers = await prisma.form_answers.findMany({
        where: { form_id: formId },
      });

      const data = allAnswers.filter((answer) =>
        equipments_id.includes((answer.answer as Record<string, unknown>)?.movil as string)
      );

      return data;
    } catch (error) {
      console.error('Error fetching form answers:', error);
      return [];
    }
  }

  // If not invitado, return all form answers
  try {
    const data = await prisma.form_answers.findMany({
      where: { form_id: formId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching form answers:', error);
    return [];
  }
};

export const fetchAnswerById = async (answerId: string) => {
  try {
    const data = await prisma.form_answers.findMany({
      where: { id: answerId },
      include: { form: true },
      orderBy: { created_at: 'desc' },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching form answers:', error);
    return [];
  }
};

export const fetchFormAnswersByFormId = async (formId: string) => {
  try {
    const data = await prisma.form_answers.findMany({
      where: { form_id: formId },
      include: { form: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching form answers:', error);
    return [];
  }
};

// --- Mutations ---

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
