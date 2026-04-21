'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { getSession } from '@/shared/lib/session';

// --- Queries ---

export const fetchCustomForms = async (id_company?: string) => {
  const { companyId } = await getActionContext();
  if (!companyId && !id_company) return [];

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

      const equipments_id = (share_company_users)?.flatMap((uc) =>
        uc.customer?.contractor_equipment?.map((ce) => ce.vehicle?.id)
      );

      // For filtering form_answers by JSON field, we need to fetch all and filter in JS
      const data = await prisma.custom_form.findMany({
        where: { company_id: companyId || id_company || '' },
        include: { form_answers: true },
      });

      // Filter form_answers where answer.movil is in equipments_id
      const filtered = data.map((form) => ({
        ...form,
        form_answers: form.form_answers.filter((answer) =>
          equipments_id?.includes((answer.answer as Record<string, unknown>)?.movil as string)
        ),
      }));

      return filtered;
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
    return data;
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

export const fetchCustomFormsByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.custom_form.findMany({
      where: { company_id: companyId },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching custom forms by company:', error);
    return [];
  }
};

export const fetchCustomFormsByCompanyWithAnswers = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.custom_form.findMany({
      where: { company_id: companyId },
      include: { form_answers: { select: { form_id: true } } },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching custom forms with answers:', error);
    return [];
  }
};

// --- Mutations ---

export const createCustomForm = async (formData: Record<string, unknown>) => {
  try {
    const data = await prisma.custom_form.create({ data: formData as any });
    return { data, error: null };
  } catch (error) {
    console.error('Error creating custom form:', error);
    return { data: null, error: String(error) };
  }
};
