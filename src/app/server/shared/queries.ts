'use server';
import { prisma } from '@/lib/prisma';
import { supabaseServer } from '@/lib/supabase/server';
import { getActionContext } from '@/lib/server-action-context';
import { getActualRole } from '@/lib/utils';

// Custom forms and shared queries

export const fetchCustomForms = async (id_company?: string) => {
  const { companyId } = await getActionContext();
  if (!companyId && !id_company) return [];

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);

  if (role === 'Invitado') {
    try {
      const share_company_users = await prisma.share_company_users.findMany({
        where: {
          profile_id: user?.id || '',
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

      const equipments_id = (share_company_users as any[])?.flatMap((uc) =>
        uc.customer?.contractor_equipment?.map((ce: any) => ce.vehicle.id)
      );

      // For filtering form_answers by JSON field, we need to fetch all and filter in JS
      const data = await prisma.custom_form.findMany({
        where: { company_id: companyId || id_company || '' },
        include: { form_answers: true },
      });

      // Filter form_answers where answer.movil is in equipments_id
      const filtered = data.map((form: any) => ({
        ...form,
        form_answers: form.form_answers.filter((answer: any) =>
          equipments_id?.includes((answer.answer as any)?.movil)
        ),
      }));

      return filtered as any[];
    } catch (error) {
      console.error('Error fetching custom forms:', error);
      return [];
    }
  }

  try {
    const data = await prisma.custom_form.findMany({
      where: { company_id: companyId || id_company || '' },
      include: { form_answers: true },
    });
    return data as any[];
  } catch (error) {
    console.error('Error fetching custom forms:', error);
    return [];
  }
};

export const fetchCustomFormById = async (formId: string) => {
  try {
    const data = await prisma.custom_form.findMany({
      where: { id: formId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching custom form by ID:', error);
    return [];
  }
};

export const fetchFormsAnswersByFormId = async (formId: string) => {
  const { companyId } = await getActionContext();

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);

  if (role === 'Invitado') {
    try {
      const share_company_users = await prisma.share_company_users.findMany({
        where: {
          profile_id: user?.id || '',
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
        (share_company_users as any[])?.flatMap((uc) =>
          uc.customer?.contractor_equipment?.map((ce: any) => ce.vehicle.id)
        ) || [];

      // Fetch all form answers and filter by JSON field in JS
      const allAnswers = await prisma.form_answers.findMany({
        where: { form_id: formId },
      });

      const data = allAnswers.filter((answer: any) =>
        equipments_id.includes((answer.answer as any)?.movil)
      );

      return data as any[];
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
    return data as any[];
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
