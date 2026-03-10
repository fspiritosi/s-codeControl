'use server';
import { prisma } from '@/lib/prisma';
// TODO: Phase 8 — migrate auth to NextAuth
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

export const fetchAllCompanies = async () => {
  try {
    const data = await prisma.company.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching all companies:', error);
    return [];
  }
};

export const fetchAllWorkDiagramsAdmin = async () => {
  try {
    const data = await prisma.work_diagram.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching work diagrams:', error);
    return [];
  }
};

export const fetchAllIndustryTypes = async () => {
  try {
    const data = await prisma.industry_type.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching industry types:', error);
    return [];
  }
};

export const fetchAllTypesOfVehicles = async () => {
  try {
    const data = await prisma.types_of_vehicles.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching types of vehicles:', error);
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

export const fetchProfileById = async (userId: string) => {
  if (!userId) return null;
  try {
    const data = await prisma.profile.findUnique({
      where: { id: userId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
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

export const fetchEmployeeByCuil = async (cuil: string) => {
  try {
    const data = await prisma.employees.findMany({
      where: { cuil },
    });
    return data;
  } catch (error) {
    console.error('Error fetching employee by cuil:', error);
    return [];
  }
};

export const fetchProfileBySupabaseUserId = async (userId: string) => {
  try {
    const data = await prisma.profile.findMany({
      where: { id: userId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching profile by user id:', error);
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

export const fetchActiveDocumentTypesGlobal = async () => {
  try {
    const data = await prisma.document_types.findMany({
      where: { is_active: true, company_id: null },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching document types:', error);
    return [];
  }
};

export const fetchPresentedDocumentsForAuditor = async () => {
  try {
    const equipmentDocs = await prisma.documents_equipment.findMany({
      where: { state: 'presentado' },
      include: {
        document_type: true,
        vehicle: {
          include: {
            type_rel: true,
            type_of_vehicle_rel: true,
            model_rel: true,
            brand_rel: true,
            company: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const employeeDocs = await prisma.documents_employees.findMany({
      where: { state: 'presentado' },
      include: {
        document_type: true,
        employee: {
          include: {
            contractor_employee: {
              include: { contractor: true },
            },
            company: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return { equipmentDocs, employeeDocs };
  } catch (error) {
    console.error('Error fetching presented documents:', error);
    return { equipmentDocs: [], employeeDocs: [] };
  }
};
