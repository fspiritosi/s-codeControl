'use server';

/**
 * Documentos del registro de capacitación (tsk-540): registro grupal,
 * constancia individual, hoja de evaluación y archivado en el legajo.
 *
 * Va aparte de actions.server.ts, que ya tiene 1500 líneas y sigue en Supabase;
 * lo nuevo se escribe con Prisma.
 */

import { fetchCurrentUser } from '@/shared/actions/auth';
import { prisma } from '@/shared/lib/prisma';
import { storageServer } from '@/shared/lib/storage-server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { TrainingCertificateData } from './components/pdf/TrainingCertificateLayout';
import type { TrainingEvaluationData } from './components/pdf/TrainingEvaluationLayout';
import type { TrainingRecordHeader, TrainingRecordRow } from './components/pdf/TrainingRecordLayout';

/**
 * Las firmas viven en el bucket `documents` bajo este prefijo. No se creó un
 * bucket nuevo a propósito: evita un paso manual de configuración en producción.
 */
const SIGNATURES_PREFIX = 'training-signatures';

/** Nombre único del tipo de documento donde se archivan todas las constancias. */
const CERTIFICATE_DOCUMENT_TYPE = 'Capacitación';

const getCompanyId = async () => (await cookies()).get('actualComp')?.value ?? null;

/**
 * URL de una imagen de firma para embeber en el PDF.
 *
 * Va firmada y no pública por dos razones: `documents` es un bucket privado, y
 * una firma manuscrita es un dato personal que no debería quedar accesible a
 * quien tenga la URL. Diez minutos alcanzan de sobra: @react-pdf/renderer
 * descarga la imagen mientras genera el documento.
 *
 * Si la firma no se puede resolver devuelve null y el layout muestra "Sin
 * firma", en lugar de romper la generación del registro entero.
 */
const SIGNED_URL_TTL_SECONDS = 600;

const toSignatureUrl = async (path: string | null | undefined) =>
  path ? await storageServer.getSignedUrl('documents', path, SIGNED_URL_TTL_SECONDS) : null;

const toIsoDate = (value: Date | null | undefined) => (value ? value.toISOString().split('T')[0] : null);

// ============================================================
// Registro grupal
// ============================================================

export type TrainingRecordPayload = {
  header: TrainingRecordHeader;
  rows: TrainingRecordRow[];
  logoUrl: string | null;
  draft: boolean;
  companyName: string | null;
};

/**
 * Arma el registro grupal. `draft` sale de si la capacitación está cerrada: una
 * capacitación abierta siempre produce un registro provisorio, porque todavía
 * puede sumarse gente.
 */
export const buildTrainingRecord = async (trainingId: string): Promise<TrainingRecordPayload | null> => {
  const company_id = await getCompanyId();
  if (!company_id) return null;

  const training = await prisma.trainings.findFirst({
    where: { id: trainingId, company_id },
    include: {
      instructor: true,
      company: { select: { company_name: true, company_logo: true } },
    },
  });

  if (!training) return null;

  const attempts = await prisma.training_attempts.findMany({
    where: { training_id: trainingId, passed: true },
    include: {
      employee: {
        select: { firstname: true, lastname: true, hierarchy_rel: { select: { name: true } } },
      },
    },
    orderBy: [{ completed_at: 'asc' }],
  });

  // Un empleado puede tener varios intentos aprobados si rehizo la
  // capacitación: en la planilla va solo el último, que es el definitivo.
  const latestByEmployee = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    const previous = latestByEmployee.get(attempt.employee_id);
    if (!previous || attempt.attempt_number >= previous.attempt_number) {
      latestByEmployee.set(attempt.employee_id, attempt);
    }
  }

  const rows: TrainingRecordRow[] = await Promise.all(
    [...latestByEmployee.values()].map(async (attempt, index) => ({
      number: index + 1,
      // Nombre y puesto salen del snapshot tomado al firmar. El dato actual del
      // empleado es solo un fallback para capacitaciones anteriores a la firma.
      full_name:
        attempt.signer_full_name ??
        `${attempt.employee.lastname ?? ''} ${attempt.employee.firstname ?? ''}`.trim(),
      position: attempt.signer_position ?? attempt.employee.hierarchy_rel?.name ?? '',
      signature_url: await toSignatureUrl(attempt.signature_path),
      result: `${attempt.score ?? 0}/${attempt.max_score} – Aprobado`,
    }))
  );

  const header: TrainingRecordHeader = {
    title: training.title,
    dictated_at: toIsoDate(training.dictated_at),
    deadline_at: toIsoDate(training.deadline_at),
    estimated_duration_minutes: training.estimated_duration_minutes,
    location: training.location,
    instructor_name: training.instructor?.full_name ?? null,
    instructor_position: training.instructor?.position ?? null,
    instructor_licenses: training.instructor?.license_numbers ?? null,
    instructor_signature_url: await toSignatureUrl(training.instructor?.signature_path),
    topics: training.topics,
    teaching_resources: training.teaching_resources,
    material_delivered: training.material_delivered,
    material_delivered_detail: training.material_delivered_detail,
    evaluation_methods: training.evaluation_methods,
    effectiveness_method: training.effectiveness_method,
    requires_new_actions: training.requires_new_actions,
    new_actions_detail: training.new_actions_detail,
  };

  return {
    header,
    rows,
    logoUrl: training.company.company_logo,
    draft: training.status !== 'Cerrada',
    companyName: training.company.company_name,
  };
};

// ============================================================
// Constancia individual
// ============================================================

export const buildTrainingCertificate = async (
  attemptId: string
): Promise<{ data: TrainingCertificateData; logoUrl: string | null } | null> => {
  const company_id = await getCompanyId();
  if (!company_id) return null;

  const attempt = await prisma.training_attempts.findFirst({
    where: { id: attemptId, passed: true, training: { company_id } },
    include: {
      employee: {
        select: {
          firstname: true,
          lastname: true,
          document_number: true,
          hierarchy_rel: { select: { name: true } },
        },
      },
      training: {
        include: {
          instructor: true,
          company: { select: { company_name: true, company_logo: true } },
        },
      },
    },
  });

  if (!attempt?.training) return null;

  const training = attempt.training;

  // El vencimiento se cuenta desde que el empleado aprobó, no desde que se
  // dictó: cada persona arrastra su propia fecha.
  let validUntil: string | null = null;
  if (training.validity_months && attempt.completed_at) {
    const expiry = new Date(attempt.completed_at);
    expiry.setMonth(expiry.getMonth() + training.validity_months);
    validUntil = toIsoDate(expiry);
  }

  return {
    logoUrl: training.company.company_logo,
    data: {
      employee_full_name:
        attempt.signer_full_name ??
        `${attempt.employee.lastname ?? ''} ${attempt.employee.firstname ?? ''}`.trim(),
      employee_document: attempt.employee.document_number,
      employee_position: attempt.signer_position ?? attempt.employee.hierarchy_rel?.name ?? null,
      training_title: training.title,
      topics: training.topics,
      dictated_at: toIsoDate(training.dictated_at),
      completed_at: toIsoDate(attempt.completed_at),
      estimated_duration_minutes: training.estimated_duration_minutes,
      location: training.location,
      score: attempt.score,
      max_score: attempt.max_score,
      valid_until: validUntil,
      instructor_name: training.instructor?.full_name ?? null,
      instructor_position: training.instructor?.position ?? null,
      instructor_licenses: training.instructor?.license_numbers ?? null,
      instructor_signature_url: await toSignatureUrl(training.instructor?.signature_path),
      employee_signature_url: await toSignatureUrl(attempt.signature_path),
      company_name: training.company.company_name,
    },
  };
};

// ============================================================
// Hoja de evaluación
// ============================================================

export const buildTrainingEvaluation = async (
  attemptId: string
): Promise<{ data: TrainingEvaluationData; logoUrl: string | null } | null> => {
  const company_id = await getCompanyId();
  if (!company_id) return null;

  const attempt = await prisma.training_attempts.findFirst({
    where: { id: attemptId, training: { company_id } },
    include: {
      employee: { select: { firstname: true, lastname: true, document_number: true } },
      training: {
        select: { title: true, passing_score: true, company: { select: { company_logo: true } } },
      },
      training_attempt_answers: {
        include: {
          question: { include: { training_question_options: true } },
          option: true,
        },
      },
    },
  });

  if (!attempt?.training) return null;

  const answers = attempt.training_attempt_answers.map((answer) => {
    const correctOption = answer.question?.training_question_options.find((option) => option.is_correct);
    return {
      question: answer.question?.question_text ?? '',
      // Las preguntas abiertas guardan text_answer; las de opción, la opción elegida.
      answer: answer.option?.option_text ?? answer.text_answer ?? '',
      correct_answer: correctOption?.option_text ?? null,
      is_correct: answer.is_correct,
    };
  });

  return {
    logoUrl: attempt.training.company.company_logo,
    data: {
      employee_full_name: `${attempt.employee.lastname ?? ''} ${attempt.employee.firstname ?? ''}`.trim(),
      employee_document: attempt.employee.document_number,
      training_title: attempt.training.title,
      completed_at: toIsoDate(attempt.completed_at),
      attempt_number: attempt.attempt_number,
      score: attempt.score,
      max_score: attempt.max_score,
      passed: attempt.passed,
      passing_score: attempt.training.passing_score,
      answers,
    },
  };
};

// ============================================================
// Archivado de la constancia en el legajo
// ============================================================

/**
 * Devuelve el tipo de documento "Capacitación" de la empresa, creándolo si hace
 * falta.
 *
 * Dos cuidados:
 *  - `document_types.name` tiene UNIQUE global, no por empresa: si el nombre ya
 *    está tomado por otra empresa, se reutiliza el de la nuestra o se cae con un
 *    error explícito en vez de romper con una violación de constraint.
 *  - `mandatory` va en false a propósito. Con mandatory = true el circuito de
 *    documentos hace UPDATE del pendiente en lugar de INSERT, así que un
 *    empleado no podría acumular varias constancias; además generaría una fila
 *    "pendiente" por cada empleado de la empresa.
 */
const ensureCertificateDocumentType = async (company_id: string) => {
  const existing = await prisma.document_types.findFirst({
    where: { name: CERTIFICATE_DOCUMENT_TYPE, company_id },
  });
  if (existing) return existing;

  const takenByOtherCompany = await prisma.document_types.findFirst({
    where: { name: CERTIFICATE_DOCUMENT_TYPE },
    select: { company_id: true },
  });

  if (takenByOtherCompany) {
    throw new Error(
      `El tipo de documento "${CERTIFICATE_DOCUMENT_TYPE}" ya existe para otra empresa. ` +
        'El nombre es único a nivel sistema: hay que renombrarlo o ajustar el esquema.'
    );
  }

  return prisma.document_types.create({
    data: {
      name: CERTIFICATE_DOCUMENT_TYPE,
      applies: 'Persona',
      multiresource: false,
      mandatory: false,
      explired: true,
      special: false,
      private: false,
      is_it_montlhy: false,
      company_id,
      description: 'Constancias de capacitaciones aprobadas, generadas automáticamente.',
      conditions: [],
    },
  });
};

/**
 * Sube la constancia al storage y la archiva en el legajo del empleado.
 *
 * Idempotente: si la constancia de ese intento ya está archivada, no duplica.
 * El registro grupal NO se archiva — el cliente pidió que quede solo para
 * administradores.
 */
export const archiveCertificateInEmployeeFile = async (attemptId: string, pdf: Blob) => {
  try {
    const company_id = await getCompanyId();
    if (!company_id) return { success: false as const, error: 'No se ha seleccionado una empresa' };

    const attempt = await prisma.training_attempts.findFirst({
      where: { id: attemptId, passed: true, training: { company_id } },
      include: { training: { select: { title: true, validity_months: true } } },
    });

    if (!attempt?.training) {
      return { success: false as const, error: 'No se encontró un intento aprobado para esa constancia' };
    }

    // El trigger log_document_employee_changes copia NEW.user_id a
    // documents_employees_logs.modified_by, que es NOT NULL: sin usuario el
    // insert falla con un error de constraint que no dice nada.
    const user = await fetchCurrentUser();
    if (!user?.id) {
      return { success: false as const, error: 'No se pudo identificar al usuario para archivar la constancia' };
    }

    const documentType = await ensureCertificateDocumentType(company_id);

    // document_path es UNIQUE: el id del intento garantiza que no colisione
    // entre capacitaciones ni entre reintentos del mismo empleado.
    const path = `capacitaciones/${company_id}/${attempt.employee_id}/${attemptId}.pdf`;

    const already = await prisma.documents_employees.findFirst({ where: { document_path: path } });
    if (already) return { success: true as const, alreadyArchived: true, documentId: already.id };

    let validity: string | null = null;
    if (attempt.training.validity_months && attempt.completed_at) {
      const expiry = new Date(attempt.completed_at);
      expiry.setMonth(expiry.getMonth() + attempt.training.validity_months);
      validity = expiry.toISOString();
    }

    await storageServer.upload('documents', path, pdf, { upsert: true });

    const document = await prisma.documents_employees.create({
      data: {
        id_document_types: documentType.id,
        applies: attempt.employee_id,
        document_path: path,
        state: 'presentado',
        // validity es string en esta tabla, no date.
        validity,
        user_id: user.id,
        is_active: true,
      },
    });

    revalidatePath('/dashboard/document');
    revalidatePath('/dashboard/employee');

    return { success: true as const, alreadyArchived: false, documentId: document.id };
  } catch (error: any) {
    console.error('Error al archivar la constancia:', error);
    return { success: false as const, error: `Error al archivar la constancia: ${error.message}` };
  }
};

// ============================================================
// Reporte de tiempos reales
// ============================================================

/**
 * Tiempo real que tardó cada empleado. El cliente pidió expresamente que este
 * dato NO vaya en la planilla grupal y quede disponible solo para consulta de
 * HSE y los administradores.
 */
export const fetchTrainingTimeReport = async (trainingId: string) => {
  const company_id = await getCompanyId();
  if (!company_id) return [];

  const attempts = await prisma.training_attempts.findMany({
    where: { training_id: trainingId, training: { company_id } },
    include: { employee: { select: { firstname: true, lastname: true } } },
    orderBy: [{ employee_id: 'asc' }, { attempt_number: 'asc' }],
  });

  return attempts.map((attempt) => ({
    employee: `${attempt.employee.lastname ?? ''} ${attempt.employee.firstname ?? ''}`.trim(),
    attempt_number: attempt.attempt_number,
    completed_at: toIsoDate(attempt.completed_at),
    time_spent_seconds: attempt.time_spent_seconds,
    score: attempt.score,
    max_score: attempt.max_score,
    passed: attempt.passed,
  }));
};

export { SIGNATURES_PREFIX };
