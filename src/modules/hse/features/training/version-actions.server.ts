'use server';

/**
 * Versionado de capacitaciones (TKT-827).
 *
 * Una capacitación publicada que ya tiene intentos no se edita: se crea una
 * versión nueva en Borrador, copiando la anterior. Al publicarla, en una sola
 * transacción, la anterior se cierra por cambio de versión, sus constancias en
 * el legajo se vencen y la nueva queda publicada con todos los empleados en 0.
 *
 * Va aparte de actions.server.ts y con Prisma, igual que record-actions.server.ts.
 */

import { fetchCurrentUser } from '@/shared/actions/auth';
import { prisma } from '@/shared/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { validateForPublish, type TrainingRecordData } from './shared/record-fields';
import { buildSupersedeUpdate, canCreateVersion, certificatePathsForAttempts } from './shared/versioning';

const getCompanyId = async () => (await cookies()).get('actualComp')?.value ?? null;

const toIsoDate = (value: Date | null | undefined) => (value ? value.toISOString().split('T')[0] : null);

const toRecordData = (training: {
  dictated_at: Date | null;
  deadline_at: Date | null;
  location: string | null;
  instructor_id: string | null;
  estimated_duration_minutes: number | null;
  topics: TrainingRecordData['topics'];
  teaching_resources: string | null;
  material_delivered: boolean | null;
  material_delivered_detail: string | null;
  evaluation_methods: TrainingRecordData['evaluation_methods'];
  effectiveness_method: string | null;
  requires_new_actions: boolean | null;
  new_actions_detail: string | null;
  validity_months: number | null;
}): TrainingRecordData => ({
  ...training,
  dictated_at: toIsoDate(training.dictated_at),
  deadline_at: toIsoDate(training.deadline_at),
});

const revalidateTraining = (...ids: string[]) => {
  revalidatePath('/dashboard/hse');
  for (const id of ids) revalidatePath(`/dashboard/hse/detail/${id}`);
};

type Result<T = {}> = ({ success: true } & T) | { success: false; error: string };

/**
 * Crea la versión siguiente como Borrador. Si ya hay una en preparación,
 * devuelve esa: previous_version_id es UNIQUE y no puede haber dos.
 */
export const createTrainingVersion = async (
  trainingId: string
): Promise<Result<{ id: string; existing: boolean }>> => {
  try {
    const company_id = await getCompanyId();
    if (!company_id) return { success: false, error: 'No se ha seleccionado una empresa' };

    const source = await prisma.trainings.findFirst({
      where: { id: trainingId, company_id },
      include: {
        training_materials: true,
        training_questions: { where: { is_active: true }, include: { training_question_options: true } },
        training_tag_assignments: true,
        next_version: { select: { id: true } },
        _count: { select: { training_attempts: true } },
      },
    });

    if (!source) return { success: false, error: 'No se encontró la capacitación' };

    if (source.next_version) {
      return { success: true, id: source.next_version.id, existing: true };
    }

    if (!canCreateVersion({ status: source.status, attemptsCount: source._count.training_attempts })) {
      return {
        success: false,
        error: 'Solo se puede versionar una capacitación publicada que ya tiene intentos',
      };
    }

    const created = await prisma.$transaction(async (tx) => {
      const version = await tx.trainings.create({
        data: {
          company_id,
          status: 'Borrador',
          version_number: source.version_number + 1,
          root_training_id: source.root_training_id ?? source.id,
          previous_version_id: source.id,
          title: source.title,
          description: source.description,
          passing_score: source.passing_score,
          test_limit_time: source.test_limit_time,
          dictated_at: source.dictated_at,
          deadline_at: source.deadline_at,
          location: source.location,
          instructor_id: source.instructor_id,
          estimated_duration_minutes: source.estimated_duration_minutes,
          topics: source.topics,
          teaching_resources: source.teaching_resources,
          material_delivered: source.material_delivered,
          material_delivered_detail: source.material_delivered_detail,
          evaluation_methods: source.evaluation_methods,
          validity_months: source.validity_months,
          // Los campos de cierre de HSE no se copian: se cargan al terminar
          // el período de la versión nueva.
          updated_at: new Date(),
        },
      });

      // Mismo archivo en Storage: las versiones comparten los materiales que
      // no cambian. El borrado de archivos respeta esto (materialPathsSafeToDelete).
      if (source.training_materials.length) {
        await tx.training_materials.createMany({
          data: source.training_materials.map((material) => ({
            training_id: version.id,
            name: material.name,
            type: material.type,
            file_url: material.file_url,
            file_size: material.file_size,
            order_index: material.order_index,
            is_required: material.is_required,
          })),
        });
      }

      for (const question of source.training_questions) {
        await tx.training_questions.create({
          data: {
            training_id: version.id,
            question_text: question.question_text,
            question_type: question.question_type,
            points: question.points,
            order_index: question.order_index,
            is_active: true,
            training_question_options: {
              create: question.training_question_options
                .filter((option) => option.is_active !== false)
                .map((option) => ({
                  option_text: option.option_text,
                  is_correct: option.is_correct,
                  order_index: option.order_index,
                  is_active: true,
                })),
            },
          },
        });
      }

      if (source.training_tag_assignments.length) {
        await tx.training_tag_assignments.createMany({
          data: source.training_tag_assignments.map((assignment) => ({
            training_id: version.id,
            tag_id: assignment.tag_id,
          })),
        });
      }

      return version;
    });

    revalidateTraining(source.id);

    return { success: true, id: created.id, existing: false };
  } catch (error: any) {
    console.error('Error al crear la versión de la capacitación:', error);
    return { success: false, error: `Error al crear la versión: ${error.message}` };
  }
};

/**
 * Publica una versión nueva y reemplaza la anterior, todo o nada: cierra la
 * anterior por cambio de versión, vence sus constancias archivadas en el legajo
 * y publica la nueva.
 */
export const publishTrainingVersion = async (trainingId: string): Promise<Result> => {
  try {
    const company_id = await getCompanyId();
    if (!company_id) return { success: false, error: 'No se ha seleccionado una empresa' };

    const version = await prisma.trainings.findFirst({ where: { id: trainingId, company_id } });
    if (!version) return { success: false, error: 'No se encontró la capacitación' };
    if (!version.previous_version_id) {
      return { success: false, error: 'La capacitación no es una versión de otra' };
    }

    const errors = validateForPublish(toRecordData(version));
    if (errors.length) {
      return { success: false, error: `No se puede publicar la capacitación: ${errors.join('. ')}` };
    }

    const previous = await prisma.trainings.findFirst({
      where: { id: version.previous_version_id, company_id },
      select: {
        id: true,
        status: true,
        effectiveness_method: true,
        requires_new_actions: true,
        new_actions_detail: true,
        training_attempts: { where: { passed: true }, select: { id: true, employee_id: true } },
      },
    });
    if (!previous) return { success: false, error: 'No se encontró la versión anterior' };

    // El trigger log_document_employee_changes exige usuario para modificar
    // documents_employees (ver archiveCertificateInEmployeeFile).
    const user = await fetchCurrentUser();
    if (!user?.id) {
      return { success: false, error: 'No se pudo identificar al usuario que publica' };
    }

    const now = new Date();
    const certificatePaths = certificatePathsForAttempts(company_id, previous.training_attempts);

    await prisma.$transaction(async (tx) => {
      await tx.trainings.update({
        where: { id: previous.id },
        data: buildSupersedeUpdate(
          {
            status: previous.status,
            close: {
              effectiveness_method: previous.effectiveness_method,
              requires_new_actions: previous.requires_new_actions,
              new_actions_detail: previous.new_actions_detail,
            },
          },
          version.version_number,
          now,
          user.id
        ),
      });

      if (certificatePaths.length) {
        await tx.documents_employees.updateMany({
          where: { document_path: { in: certificatePaths } },
          // validity es string en esta tabla, no date.
          data: { state: 'vencido', validity: now.toISOString(), user_id: user.id },
        });
      }

      await tx.trainings.update({
        where: { id: version.id },
        data: { status: 'Publicado', published_at: now, updated_at: now },
      });
    });

    revalidateTraining(previous.id, version.id);
    revalidatePath('/dashboard/document');
    revalidatePath('/dashboard/employee');

    return { success: true };
  } catch (error: any) {
    console.error('Error al publicar la versión de la capacitación:', error);
    return { success: false, error: `Error al publicar la versión: ${error.message}` };
  }
};

export type TrainingVersionRow = {
  id: string;
  version_number: number;
  status: string | null;
  created_at: string | null;
  published_at: string | null;
  closed_at: string | null;
  superseded: boolean;
  approved: number;
  total: number;
};

/** Todas las versiones de la capacitación, de la más nueva a la más vieja. */
export const fetchTrainingVersions = async (trainingId: string): Promise<TrainingVersionRow[]> => {
  const company_id = await getCompanyId();
  if (!company_id) return [];

  const training = await prisma.trainings.findFirst({
    where: { id: trainingId, company_id },
    select: { id: true, root_training_id: true },
  });
  if (!training) return [];

  const group = training.root_training_id ?? training.id;

  const [versions, total] = await Promise.all([
    prisma.trainings.findMany({
      where: { company_id, OR: [{ id: group }, { root_training_id: group }] },
      orderBy: { version_number: 'desc' },
      select: {
        id: true,
        version_number: true,
        status: true,
        created_at: true,
        published_at: true,
        closed_at: true,
        superseded_at: true,
        training_attempts: { where: { passed: true }, select: { employee_id: true } },
      },
    }),
    prisma.employees.count({ where: { company_id, is_active: true } }),
  ]);

  return versions.map((version) => ({
    id: version.id,
    version_number: version.version_number,
    status: version.status,
    created_at: version.created_at?.toISOString() ?? null,
    published_at: version.published_at?.toISOString() ?? null,
    closed_at: version.closed_at?.toISOString() ?? null,
    superseded: version.superseded_at !== null,
    approved: new Set(version.training_attempts.map((attempt) => attempt.employee_id)).size,
    total,
  }));
};
