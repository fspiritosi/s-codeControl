'use server';

import { fetchCurrentUser } from '@/shared/actions/auth';
import { prisma } from '@/shared/lib/prisma';
import { storageServer } from '@/shared/lib/storage-server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { validateForClose, validateForPublish, type TrainingRecordData } from './shared/record-fields';

type TrainingStatusInput = 'Borrador' | 'Archivado' | 'Publicado' | null;

// Los componentes esperan filas planas: fechas en ISO string y BigInt como number.
const toPlain = (value: unknown): any =>
  value === undefined ? undefined : JSON.parse(JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? Number(v) : v)));

// Ejecuta una operación y, si falla, relanza el error con el prefijo de contexto.
const withContext = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    console.error(`${label}:`, error);
    throw new Error(`${label}: ${error.message}`);
  }
};

/**
 * Crea una nueva capacitación
 */
export const createTraining = async (data: { title: string; description: string; passing_score?: number }) => {
  try {
    const user = await fetchCurrentUser();
    const cookiesStore = await cookies();
    const company_id = cookiesStore.get('actualComp')?.value;

    if (!company_id) {
      console.error('No hay company_id en las cookies');
      return { success: false, error: 'No se ha seleccionado una empresa' };
    }

    if (!user) {
      console.error('No hay usuario autenticado');
      return { success: false, error: 'No se ha iniciado sesión' };
    }

    // Crear la capacitación
    const trainingPayload = {
      title: data.title,
      description: data.description || '',
      passing_score: data.passing_score || 0, // 0 indica que no hay requisito mínimo si no hay evaluación
      company_id: company_id,
    };

    let trainingData;
    try {
      trainingData = await prisma.trainings.create({ data: trainingPayload });
    } catch (error: any) {
      console.error('Error al crear la capacitación:', error);
      return {
        success: false,
        error: `Error en la base de datos: ${error.message || 'Error desconocido'}. Código: ${error.code || 'Sin código'}.`,
      };
    }

    revalidatePath('/dashboard/hse');

    return { success: true, data: toPlain(trainingData) };
  } catch (error: any) {
    console.error('Error inesperado al crear la capacitación:', error);
    console.error('Stack trace:', error.stack);
    return {
      success: false,
      error: `Error: ${error.message || 'Error desconocido'}`,
    };
  }
};

/**
 * Añade materiales a una capacitación
 */
export const addTrainingMaterials = async (
  trainingId: string,
  materials: Array<{
    name: string;
    type: string;
    file_url: string;
    file_size?: number;
    order_index: number;
    is_required?: boolean;
  }>
) => {
  try {
    // Añadir los materiales
    const materialsData = await withContext('Error al añadir materiales', () =>
      prisma.training_materials.createManyAndReturn({
        data: materials.map((material) => ({
          training_id: trainingId,
          name: material.name,
          type: material.type,
          file_url: material.file_url,
          file_size: material.file_size || 0,
          order_index: material.order_index,
          is_required: material.is_required !== undefined ? material.is_required : true,
        })),
      })
    );

    return { success: true, data: toPlain(materialsData) };
  } catch (error: any) {
    console.error('Error inesperado al añadir materiales:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Añade preguntas a una capacitación
 */
export const addTrainingQuestions = async (
  trainingId: string,
  questions: Array<{
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'text';
    points: number;
    order_index: number;
    options: Array<{
      option_text: string;
      is_correct: boolean;
      order_index: number;
    }>;
  }>
) => {
  try {
    await prisma.$transaction(async (tx) => {
      // Añadir las preguntas una por una para poder obtener el ID y asociarlo a las opciones
      for (const question of questions) {
        // Añadir la pregunta
        const questionData = await withContext('Error al añadir pregunta', () =>
          tx.training_questions.create({
            data: {
              training_id: trainingId,
              question_text: question.question_text,
              question_type: question.question_type,
              points: question.points,
              order_index: question.order_index,
            },
          })
        );

        // Añadir las opciones
        if (question.options && question.options.length > 0) {
          await withContext('Error al añadir opciones', () =>
            tx.training_question_options.createMany({
              data: question.options.map((option) => ({
                question_id: questionData.id,
                option_text: option.option_text,
                is_correct: option.is_correct,
                order_index: option.order_index,
              })),
            })
          );
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error inesperado al añadir preguntas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Asocia etiquetas a una capacitación
 */
export const addTrainingTags = async (trainingId: string, tagIds: string[]) => {
  try {
    // Asociar las etiquetas
    await withContext('Error al asignar etiquetas', () =>
      prisma.training_tag_assignments.createMany({
        data: tagIds.map((tagId) => ({
          training_id: trainingId,
          tag_id: tagId,
        })),
      })
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error inesperado al asignar etiquetas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene todas las etiquetas de capacitación disponibles
 */
export const fetchTrainingTags = async () => {
  try {
    const data = await prisma.training_tags.findMany({ where: { is_active: true } });

    return { success: true, data: toPlain(data) };
  } catch (error: any) {
    console.error('Error inesperado al obtener etiquetas:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const updateTag = async (dataToUpdate: { id: string; name: string; color: string; is_active: boolean }) => {
  try {
    await withContext('Error al actualizar etiqueta', () =>
      prisma.training_tags.updateMany({
        where: { id: dataToUpdate.id },
        data: { name: dataToUpdate.name, color: dataToUpdate.color, is_active: dataToUpdate.is_active },
      })
    );

    return { success: true, data: null };
  } catch (error: any) {
    console.error('Error inesperado al actualizar etiqueta:', error);
    return { success: false, error: error.message };
  }
};

export const createArea = async (dataToCreate: { name: string; color: string }) => {
  try {
    await withContext('Error al crear etiqueta', () =>
      prisma.training_tags.create({ data: { name: dataToCreate.name, color: dataToCreate.color } })
    );

    return { success: true, data: null };
  } catch (error: any) {
    console.error('Error inesperado al crear etiqueta:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene todas las capacitaciones
 */
export const fetchAllTags = async () => {
  try {
    const data = await prisma.training_tags.findMany();

    return toPlain(data);
  } catch (error: any) {
    console.error('Error inesperado al obtener etiquetas:', error);
    return [];
  }
};
export const fetchTrainings = async () => {
  try {
    const cookiesStore = await cookies();
    const company_id = cookiesStore.get('actualComp')?.value;

    if (!company_id) {
      console.error('No hay company_id en las cookies');
      return [];
    }

    // Obtener capacitaciones con sus etiquetas, materiales y preguntas
    const data = await prisma.trainings.findMany({
      where: { company_id },
      include: {
        training_tag_assignments: { include: { tag: true } },
        training_materials: true,
        training_attempts: true,
        training_questions: { include: { training_question_options: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    // Obtener el total de empleados activos en la empresa
    const totalEmployees = await prisma.employees.count({ where: { company_id, is_active: true } });

    // Procesar los datos para el formato que espera el componente TrainingSection
    const formattedTrainings = data.map((training) => {
      // Por defecto, todas las capacitaciones se aplican a todos los empleados
      const totalEmployeesCount = totalEmployees || 0;

      // Contar cuántos empleados han completado esta capacitación específica
      const completedCount = new Set(
        training.training_attempts.filter((attempt) => attempt.passed).map((attempt) => attempt.employee_id)
      ).size;

      // Extraer las etiquetas
      const tags = toPlain(training.training_tag_assignments.map((tagAssignment) => tagAssignment.tag).filter(Boolean));

      // Extraer los materiales
      const materials = training.training_materials.map((material) => ({
        type: material.type || 'pdf',
        name: material.name,
        url: material.file_url,
      }));

      // Extraer preguntas y opciones y ordenarlas por order_index
      const questions = training.training_questions
        .map((question) => ({
          id: question.id,
          question: question.question_text,
          options: question.training_question_options.map((option) => option.option_text),
          correctAnswer: question.training_question_options.findIndex((option) => option.is_correct) || 0,
          order_index: question.order_index || 0, // Añadir order_index para ordenar
        }))
        .sort((a, b) => a.order_index - b.order_index); // Ordenar por order_index

      return {
        id: training.id,
        title: training.title,
        description: training.description || '',
        createdDate: training.created_at ? training.created_at.toISOString().split('T')[0] : '',
        tags,
        materials,
        attempts: toPlain(training.training_attempts),
        evaluation: {
          questions,
          passingScore: training.passing_score || 0,
        },
        completedCount: Number(completedCount) || 0,
        totalEmployees: Number(totalEmployeesCount) || 0,
        status: training.status || 'draft',
      };
    });

    return formattedTrainings;
  } catch (error: any) {
    console.error('Error inesperado al obtener capacitaciones:', error);
    return [];
  }
};

/**
 * Obtiene los detalles completos de una capacitación por su ID
 * @param id ID de la capacitación a obtener
 * @returns Objeto con los detalles de la capacitación y datos relacionados
 */
export const getEmployeesCount = async () => {
  try {
    const cookiesStore = await cookies();
    const company_id = cookiesStore.get('actualComp')?.value;

    if (!company_id) {
      console.error('No hay company_id en las cookies');
      return 0;
    }

    return await prisma.employees.count({ where: { company_id, is_active: true } });
  } catch (error: any) {
    console.error('Error inesperado al obtener empleados:', error);
    return 0;
  }
};

export const fetchTrainingById = async (id: string) => {
  try {
    const cookiesStore = await cookies();
    const company_id = cookiesStore.get('actualComp')?.value;

    if (!company_id) {
      console.error('No hay company_id en las cookies');
      return null;
    }

    // Obtener la capacitación específica con todos sus datos relacionados
    const trainingData = await prisma.trainings.findFirst({
      where: { id, company_id },
      include: {
        training_tag_assignments: { include: { tag: true } },
        training_materials: true,
        training_attempts: true,
        training_questions: { include: { training_question_options: true } },
      },
    });

    if (!trainingData) {
      console.error('No se encontró la capacitación con ID:', id);
      return null;
    }

    // 1. Obtener TODOS los empleados activos de la empresa
    const activeEmployees = await prisma.employees.findMany({ where: { company_id, is_active: true } });

    // 2. Obtener todos los intentos COMPLETADOS para esta capacitación
    const completedAttempts = await prisma.training_attempts.findMany({
      where: { training_id: id, score: { gte: trainingData.passing_score } },
    });

    // 3. Crear un conjunto de IDs de empleados que completaron la capacitación
    const completedEmployeeIds = new Set<string>();
    const attemptsByEmployeeId = new Map<string, (typeof completedAttempts)[number]>();

    completedAttempts.forEach((attempt) => {
      if (attempt.employee_id) {
        completedEmployeeIds.add(attempt.employee_id);
        attemptsByEmployeeId.set(attempt.employee_id, attempt);
      }
    });

    // 4. Separar empleados en "completados" y "pendientes"
    const completedEmployees: {
      id: string;
      name: string;
      cuil: string;
      department: string | null;
      status: string;
      // Necesario para generar la constancia y la hoja de evaluación, que van
      // por intento y no por capacitación (tsk-540).
      attemptId?: string | null;
      lastAttempt?: {
        date: string;
        score: string;
        result: string;
      } | null;
    }[] = [];

    const pendingEmployees: {
      id: string;
      name: string;
      cuil: string;
      department: string | null;
      status: string;
      email: string;
    }[] = [];

    activeEmployees.forEach((employee) => {
      // Si el ID del empleado está en el conjunto de completados
      if (completedEmployeeIds.has(employee.id)) {
        const attempt = attemptsByEmployeeId.get(employee.id);
        completedEmployees.push({
          id: employee.id,
          name: `${employee.firstname} ${employee.lastname}`,
          cuil: employee.cuil || '',
          department: employee.company_position || null, // Campo correcto según Employee
          status: 'completed',
          attemptId: attempt?.id ?? null,
          lastAttempt: attempt
            ? {
                date: toPlain(attempt.completed_at),
                score: `${attempt.score}/${trainingData.training_questions.length}`,
                result: (attempt.score ?? 0) >= trainingData.passing_score ? 'passed' : 'failed',
              }
            : null,
        });
      } else {
        // Si no está en completados, va a pendientes
        pendingEmployees.push({
          id: employee.id,
          name: `${employee.firstname} ${employee.lastname}`,
          cuil: employee.cuil || '',
          department: employee.company_position || null, // Campo correcto según Employee
          status: 'pending',
          email: employee.email || '',
        });
      }
    });

    // Extraer las etiquetas
    const tags = trainingData.training_tag_assignments
      .map((tagAssignment) => tagAssignment.tag?.name || '')
      .filter(Boolean);

    // Extraer los materiales
    const materials = trainingData.training_materials
      .map((material) => ({
        id: material.id,
        type: material.type || 'pdf',
        name: material.name,
        url: material.file_url,
        order: material.order_index,
        is_required: material.is_required,
        file_size: material.file_size === null ? null : Number(material.file_size),
      }))
      .sort((a, b) => a.order - b.order);

    // Extraer preguntas y opciones y ordenarlas por order_index
    const questions = trainingData.training_questions
      .map((question) => ({
        id: question.id,
        question: question.question_text,
        options: question.training_question_options
          .filter((option) => option.is_active)
          .map((option) => option.option_text),
        correctAnswer: question.training_question_options.findIndex((option) => option.is_correct) || 0,
        points: question.points || 1,
        order_index: question.order_index || 0, // Añadir order_index para ordenar
      }))
      .sort((a, b) => a.order_index - b.order_index); // Ordenar por order_index

    // Formato final para la respuesta
    const formattedTraining = {
      id: trainingData.id,
      title: trainingData.title,
      test_limit_time: trainingData.test_limit_time,
      description: trainingData.description,
      createdDate: trainingData.created_at ? trainingData.created_at.toISOString().split('T')[0] : '',
      tags,
      materials,
      attempts: toPlain(trainingData.training_attempts),
      evaluation: {
        questions,
        passingScore: trainingData.passing_score || 0,
      },
      employees: {
        completed: completedEmployees,
        pending: pendingEmployees,
        total: {
          completedCount: completedEmployees.length,
          totalEmployees: await getEmployeesCount(),
        },
      },
      // Los componentes tipan el estado de forma distinta (con y sin 'Cerrada').
      status: trainingData.status as any,
    };

    return formattedTraining;
  } catch (error) {
    console.error('Error inesperado al obtener detalles de capacitación:', error);
    return null;
  }
};

/**
 * Actualiza la información básica de una capacitación
 */
export const updateTrainingBasicInfo = async (
  trainingId: string,
  data: {
    title: string;
    description: string;
    status: TrainingStatusInput;
    passing_score?: number;
    test_limit_time?: number;
  }
) => {
  try {
    const cookiesStore = await cookies();
    const company_id = cookiesStore.get('actualComp')?.value;

    if (!company_id) {
      console.error('No hay company_id en las cookies');
      return { success: false, error: 'No se ha seleccionado una empresa' };
    }

    // Actualizar la capacitación
    let updatedTraining;
    try {
      updatedTraining = await prisma.$transaction(async (tx) => {
        await tx.trainings.updateMany({
          where: { id: trainingId, company_id },
          data: {
            title: data.title,
            description: data.description,
            updated_at: new Date(),
            status: data.status,
            passing_score: data.passing_score,
            test_limit_time: data.test_limit_time,
          },
        });
        return tx.trainings.findFirst({ where: { id: trainingId, company_id } });
      });
    } catch (error: any) {
      console.error('Error al actualizar la capacitación:', error);
      return { success: false, error: `Error en la base de datos: ${error.message}` };
    }

    revalidatePath('/dashboard/hse');
    revalidatePath(`/dashboard/hse/detail/${trainingId}`);

    return { success: true, data: toPlain(updatedTraining) };
  } catch (error: any) {
    console.error('Error inesperado al actualizar la capacitación:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualiza los materiales de una capacitación
 * Elimina los materiales existentes, sus archivos del storage y añade los nuevos
 */
export const updateTrainingMaterials = async (
  trainingId: string,
  materials?: Array<{
    id?: string;
    name: string;
    type: string;
    url: string;
    order: number;
    is_required?: boolean;
    file_size?: number;
  }>
) => {
  try {
    // Primero obtener todos los materiales existentes para eliminar sus archivos
    const existingMaterials = await withContext('Error al obtener materiales', () =>
      prisma.training_materials.findMany({
        where: { training_id: trainingId },
        select: { file_url: true }, // Solo necesitamos la URL del archivo
      })
    );

    // Eliminar los archivos del storage si existen
    if (existingMaterials.length > 0) {
      const filePathsToDelete = existingMaterials
        .map((material) => {
          // Extraer la ruta del archivo del final de la URL pública
          const parts = material.file_url.split('training-materials/');
          return parts.length > 1 ? parts[1] : null;
        })
        .filter((path): path is string => path !== null && path.trim() !== ''); // Filtrar nulos y vacíos

      if (filePathsToDelete.length > 0) {
        try {
          await storageServer.remove('training-materials', filePathsToDelete);
        } catch (storageError) {
          console.error('Error al eliminar archivos del storage:', storageError);
          // No interrumpimos el proceso si falla la eliminación del storage
          // pero registramos el error para depuración
        }
      }
    }

    // Eliminar los registros existentes y añadir los nuevos
    const newMaterials = await prisma.$transaction(async (tx) => {
      await withContext('Error al eliminar materiales de la DB', () =>
        tx.training_materials.deleteMany({ where: { training_id: trainingId } })
      );

      // Si no hay nuevos materiales para insertar, terminar aquí
      if (!materials || materials.length === 0) return [];

      return withContext('Error al añadir materiales', () =>
        tx.training_materials.createManyAndReturn({
          data: materials.map((material) => ({
            training_id: trainingId,
            name: material.name,
            type: material.type || 'pdf',
            file_url: material.url,
            file_size: material.file_size || 0,
            order_index: material.order,
            is_required: material.is_required !== undefined ? material.is_required : true,
          })),
        })
      );
    });

    revalidatePath(`/training/${trainingId}/detail`); // Revalidar la ruta para mostrar los cambios

    return { success: true, data: toPlain(newMaterials) };
  } catch (error: any) {
    console.error('Error inesperado al actualizar materiales:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualiza las preguntas de evaluación de una capacitación
 * Preserva preguntas/opciones existentes si hay intentos asociados
 */
export const updateTrainingQuestions = async (
  trainingId: string,
  questions: Array<{
    id?: string;
    question: string;
    options: string[];
    correctAnswer: number;
    points?: number;
  }>
) => {
  try {
    await prisma.$transaction(
      async (tx) => {
        // 1. Obtener todas las preguntas actuales para este training
        const existingQuestions = await withContext('Error al obtener preguntas existentes', () =>
          tx.training_questions.findMany({
            where: { training_id: trainingId },
            include: { training_attempt_answers: { select: { id: true } } },
          })
        );

        // 2. Función para actualizar opciones de una pregunta
        const updateQuestionOptions = async (questionId: string, options: string[], correctAnswer: number) => {
          try {
            // Primero obtenemos las opciones existentes y sus posibles respuestas
            const existingOptions = await tx.training_question_options.findMany({
              where: { question_id: questionId },
              select: {
                id: true,
                option_text: true,
                is_correct: true,
                order_index: true,
                training_attempt_answers: { select: { id: true } },
              },
            });

            // Agrupamos opciones existentes por texto normalizado para manejar duplicados
            const existingOptionsGroups: Record<
              string,
              Array<{
                id: string;
                is_correct: boolean;
                order_index: number;
                original_text: string;
                hasAnswers: boolean;
              }>
            > = {};

            // Agrupar opciones por texto normalizado
            existingOptions.forEach((option) => {
              const normalizedText = option.option_text.toLowerCase().trim();
              if (!existingOptionsGroups[normalizedText]) {
                existingOptionsGroups[normalizedText] = [];
              }

              existingOptionsGroups[normalizedText].push({
                id: option.id,
                is_correct: option.is_correct || false,
                order_index: option.order_index,
                original_text: option.option_text,
                hasAnswers: option.training_attempt_answers.length > 0,
              });
            });

            // Marcar todas las opciones como no procesadas inicialmente
            const processedOptionIds = new Set<string>();

            // Identificar operaciones: actualizar, insertar, eliminar
            const toUpdate: Array<{ id: string; is_correct: boolean; order_index: number; is_active: boolean }> = [];
            const toInsert: Array<{
              question_id: string;
              option_text: string;
              is_correct: boolean;
              order_index: number;
              is_active: boolean;
            }> = [];
            const toMarkInactive: string[] = [];
            const toDelete: string[] = [];

            // Procesamos las nuevas opciones
            options.forEach((optionText, index) => {
              const normalizedOptionText = optionText.toLowerCase().trim();

              const optionGroup = existingOptionsGroups[normalizedOptionText];

              if (optionGroup && optionGroup.length > 0) {
                // Ordenamos el grupo por: 1) opciones sin respuestas primero, 2) opciones activas primero
                optionGroup.sort((a, b) => {
                  // Si una tiene respuestas y otra no, priorizar la que no tiene respuestas
                  if (a.hasAnswers !== b.hasAnswers) {
                    return a.hasAnswers ? 1 : -1;
                  }
                  // Si ambas tienen respuestas, priorizar por orden existente
                  return a.order_index - b.order_index;
                });

                // Tomamos la primera opción del grupo para mantener/actualizar
                // Preferimos usar una sin respuestas si está disponible
                const optionToKeep = optionGroup[0];

                // Marcamos esta opción como procesada
                processedOptionIds.add(optionToKeep.id);

                // Verificamos si necesita actualización
                if (optionToKeep.is_correct !== (index === correctAnswer) || optionToKeep.order_index !== index) {
                  toUpdate.push({
                    id: optionToKeep.id,
                    is_correct: index === correctAnswer,
                    order_index: index,
                    is_active: true,
                  });
                }

                // Para el resto de las opciones duplicadas del grupo, marcarlas para eliminación o inactivación
                if (optionGroup.length > 1) {
                  for (let i = 1; i < optionGroup.length; i++) {
                    const duplicateOption = optionGroup[i];
                    processedOptionIds.add(duplicateOption.id);

                    if (duplicateOption.hasAnswers) {
                      toMarkInactive.push(duplicateOption.id);
                    } else {
                      toDelete.push(duplicateOption.id);
                    }
                  }
                }
              } else {
                // Es una opción nueva, la insertamos
                toInsert.push({
                  question_id: questionId,
                  option_text: optionText,
                  is_correct: index === correctAnswer,
                  order_index: index,
                  is_active: true,
                });
              }
            });

            // Procesar opciones que no fueron procesadas (ya no están en la lista nueva)
            existingOptions.forEach((option) => {
              if (!processedOptionIds.has(option.id)) {
                // Esta opción ya no está en la lista nueva
                if (option.training_attempt_answers.length > 0) {
                  // Si tiene respuestas asociadas, la marcamos como inactiva pero no la eliminamos
                  toMarkInactive.push(option.id);
                } else {
                  // Si no tiene respuestas, la podemos eliminar
                  toDelete.push(option.id);
                }
              }
            });

            // Ejecutar las operaciones de base de datos
            // 1. Actualizar opciones existentes que han cambiado
            for (const option of toUpdate) {
              await tx.training_question_options.update({
                where: { id: option.id },
                data: {
                  is_correct: option.is_correct,
                  order_index: option.order_index,
                  is_active: option.is_active,
                },
              });
            }

            // 2. Insertar nuevas opciones
            if (toInsert.length > 0) {
              await tx.training_question_options.createMany({ data: toInsert });
            }

            // 3. Marcar como inactivas opciones con respuestas pero que ya no se usan
            if (toMarkInactive.length > 0) {
              await tx.training_question_options.updateMany({
                where: { id: { in: toMarkInactive } },
                data: { is_active: false },
              });
            }

            // 4. Eliminar opciones que no tienen respuestas y ya no se usan
            if (toDelete.length > 0) {
              await tx.training_question_options.deleteMany({ where: { id: { in: toDelete } } });
            }

            return true;
          } catch (error: any) {
            console.error(`Error al actualizar opciones para pregunta ${questionId}:`, error);
            throw new Error(`Error al actualizar opciones: ${error.message}`);
          }
        };

        // 3. Identificar preguntas a eliminar (existentes que no están en la lista nueva)
        const questionIdsToKeep = questions.filter((q) => q.id).map((q) => q.id as string);

        const questionsToRemove = existingQuestions.filter((eq) => !questionIdsToKeep.includes(eq.id));

        // 4. Procesar eliminaciones
        for (const questionToRemove of questionsToRemove) {
          // Verificar si tiene intentos de respuesta
          const hasAttempts = questionToRemove.training_attempt_answers.length > 0;

          if (hasAttempts) {
            // Soft delete si tiene intentos
            await withContext('Error al desactivar pregunta', () =>
              tx.training_questions.updateMany({ where: { id: questionToRemove.id }, data: { is_active: false } })
            );
          } else {
            // Eliminar opciones primero
            await withContext('Error al eliminar opciones', () =>
              tx.training_question_options.deleteMany({ where: { question_id: questionToRemove.id } })
            );

            // Eliminar la pregunta físicamente
            await withContext('Error al eliminar pregunta', () =>
              tx.training_questions.deleteMany({ where: { id: questionToRemove.id } })
            );
          }
        }

        // 5. Preparar arrays para inserción
        const questionInserts: Array<{
          id: string;
          training_id: string;
          question_text: string;
          question_type: string;
          points: number;
          order_index: number;
          is_active: boolean;
        }> = [];
        const pendingOptionInserts: Array<{ questionIndex: number; options: string[]; correctAnswer: number }> = [];

        // 6. Procesar cada pregunta
        for (const [index, question] of questions.entries()) {
          // Comprobar si la pregunta tiene un ID y existe en la base de datos
          const existingQuestion = question.id ? existingQuestions.find((eq) => eq.id === question.id) : undefined;

          if (existingQuestion) {
            // Actualizar solo si hay cambios
            if (
              existingQuestion.question_text !== question.question ||
              existingQuestion.order_index !== index ||
              !existingQuestion.is_active
            ) {
              await withContext('Error al actualizar pregunta', () =>
                tx.training_questions.updateMany({
                  where: { id: existingQuestion.id },
                  data: {
                    question_text: question.question,
                    points: question.points || 1,
                    order_index: index,
                    is_active: true, // Asegurarse que esté activa
                  },
                })
              );
            }

            // Actualizar opciones
            await updateQuestionOptions(existingQuestion.id, question.options, question.correctAnswer);
          } else {
            // Es una pregunta nueva, la añadimos al array de inserciones
            questionInserts.push({
              id: crypto.randomUUID(),
              training_id: trainingId,
              question_text: question.question,
              question_type: 'multiple_choice',
              points: question.points || 1,
              order_index: index,
              is_active: true,
            });

            // Guardamos las opciones para insertarlas después
            pendingOptionInserts.push({
              questionIndex: questionInserts.length - 1,
              options: question.options,
              correctAnswer: question.correctAnswer,
            });
          }
        }

        // 7. Insertar las nuevas preguntas si hay
        if (questionInserts.length > 0) {
          await withContext('Error al insertar preguntas', () =>
            tx.training_questions.createMany({ data: questionInserts })
          );

          // 8. Insertar las opciones de las nuevas preguntas
          for (const pending of pendingOptionInserts) {
            await updateQuestionOptions(questionInserts[pending.questionIndex].id, pending.options, pending.correctAnswer);
          }
        }
      },
      { timeout: 60000, maxWait: 10000 }
    );

    // Revalidar la ruta para actualizar la UI
    revalidatePath(`/dashboard/hse/detail/${trainingId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error inesperado al actualizar preguntas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualiza las etiquetas de una capacitación
 */
export const updateTrainingTags = async (trainingId: string, tagIds: string[]) => {
  try {
    const cookiesStore = await cookies();
    const company_id = cookiesStore.get('actualComp')?.value;

    if (!company_id) {
      console.error('No hay company_id en las cookies');
      return { success: false, error: 'No se ha seleccionado una empresa' };
    }

    // Reemplazar las asignaciones de etiquetas existentes
    await prisma.$transaction(async (tx) => {
      await withContext('Error al eliminar etiquetas', () =>
        tx.training_tag_assignments.deleteMany({ where: { training_id: trainingId } })
      );

      // Si no hay nuevas etiquetas, terminar aquí
      if (tagIds.length === 0) return;

      await withContext('Error al asignar etiquetas', () =>
        tx.training_tag_assignments.createMany({
          data: tagIds.map((tag_id) => ({
            training_id: trainingId,
            tag_id,
          })),
        })
      );
    });

    if (tagIds.length === 0) {
      return { success: true, data: [] };
    }

    revalidatePath(`/dashboard/hse/detail/${trainingId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error inesperado al actualizar etiquetas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualiza una capacitación completa (información básica, materiales, preguntas y etiquetas)
 */
/**
 * Actualiza solo la evaluación (preguntas y puntaje mínimo) de una capacitación
 */
export const updateTrainingEvaluation = async (
  trainingId: string,
  data: {
    passingScore: number;
    questions: Array<{
      id?: string;
      question: string;
      options: string[];
      correctAnswer: number;
    }>;
    test_limit_time: number;
  }
) => {
  try {
    // Primero obtenemos los datos actuales de la capacitación
    let trainingData;
    try {
      trainingData = await prisma.trainings.findUnique({
        where: { id: trainingId },
        select: { title: true, description: true, status: true },
      });
      if (!trainingData) throw new Error('No se encontró la capacitación');
    } catch (fetchError: any) {
      console.error('Error al obtener datos de capacitación:', fetchError);
      return {
        success: false,
        error: `Error al obtener datos: ${fetchError.message}`,
      };
    }

    // Actualizar información básica (puntaje mínimo)
    const basicInfoResult = await updateTrainingBasicInfo(trainingId, {
      title: trainingData.title, // Mantenemos el título actual
      description: trainingData.description || '', // Mantenemos la descripción actual
      passing_score: data.passingScore,
      status: trainingData.status as TrainingStatusInput,
      test_limit_time: data.test_limit_time,
    });

    if (!basicInfoResult.success) {
      return basicInfoResult;
    }

    // Actualizar preguntas
    const questionsResult = await updateTrainingQuestions(trainingId, data.questions);
    if (!questionsResult.success) {
      return questionsResult;
    }

    revalidatePath(`/dashboard/hse/detail/${trainingId}`);

    return {
      success: true,
      message: 'Evaluación actualizada exitosamente',
    };
  } catch (error: any) {
    console.error('Error inesperado al actualizar evaluación:', error);
    return {
      success: false,
      error: `Error al actualizar evaluación: ${error.message}`,
    };
  }
};

export const updateTraining = async (
  trainingId: string,
  data: {
    title: string;
    description: string;
    status: 'Borrador' | 'Archivado' | 'Publicado' | null;
    passingScore?: number;
    materials?: Array<{
      id?: string;
      type: string;
      name: string;
      url: string;
      order: number;
      is_required?: boolean;
      file_size?: number;
    }>;
    questions?: Array<{
      id?: string;
      question: string;
      options: string[];
      correctAnswer: number;
    }>;
    tags: string[];
  }
) => {
  try {
    // Actualizar información básica
    if (data.title || data.description || data.status) {
      const basicInfoResult = await updateTrainingBasicInfo(trainingId, {
        title: data.title,
        description: data.description,
        status: data.status,
      });

      if (!basicInfoResult.success) {
        return basicInfoResult;
      }
    }

    if (data.materials) {
      // Actualizar materiales
      const materialsResult = await updateTrainingMaterials(trainingId, data.materials);
      if (!materialsResult.success) {
        return materialsResult;
      }
    }

    if (data.questions) {
      // Actualizar preguntas
      const questionsResult = await updateTrainingQuestions(trainingId, data.questions || []);
      if (!questionsResult.success) {
        return questionsResult;
      }
    }

    if (data.tags) {
      // Actualizar etiquetas
      const tagsResult = await updateTrainingTags(trainingId, data.tags);
      if (!tagsResult.success) {
        return tagsResult;
      }
    }

    revalidatePath('/dashboard/hse');
    revalidatePath(`/dashboard/hse/detail/${trainingId}`);

    return {
      success: true,
      message: 'Capacitación actualizada exitosamente',
    };
  } catch (error: any) {
    console.error('Error inesperado al actualizar capacitación:', error);
    return {
      success: false,
      error: `Error al actualizar capacitación: ${error.message}`,
    };
  }
};

export const updateTrainingStatus = async (trainingId: string, status: 'Borrador' | 'Archivado' | 'Publicado') => {
  try {
    // Publicar exige los datos del acta cargados (tsk-540). La validación vive
    // acá y no solo en el diálogo porque también se publica desde el listado.
    if (status === 'Publicado') {
      const record = await fetchTrainingRecordFields(trainingId);
      const errors = record
        ? validateForPublish(record)
        : ['No se encontró la capacitación'];

      if (errors.length) {
        return {
          success: false,
          error: `No se puede publicar la capacitación: ${errors.join('. ')}`,
        };
      }
    }

    await prisma.trainings.updateMany({ where: { id: trainingId }, data: { status } });

    revalidatePath('/dashboard/hse');
    revalidatePath(`/dashboard/hse/detail/${trainingId}`);

    return { success: true, message: 'Estado de capacitación actualizado exitosamente' };
  } catch (error: any) {
    console.error('Error inesperado al actualizar estado de capacitación:', error);
    return { success: false, error: `Error al actualizar estado: ${error.message}` };
  }
};

/**
 * Elimina una capacitación y todos sus datos relacionados
 * Solo permite eliminar capacitaciones en estado "Borrador"
 */
export const deleteTraining = async (trainingId: string) => {
  try {
    // 4. Eliminar materiales
    let materials;
    try {
      materials = await prisma.training_materials.findMany({ where: { training_id: trainingId } });
    } catch (materialsError) {
      console.error('Error al eliminar materiales:', materialsError);
      return { success: false, error: 'Error al eliminar materiales de la capacitación' };
    }

    const documentsUrl = materials
      .map((material) => material.file_url)
      .filter((url): url is string => Boolean(url));
    // Supabase Storage rechaza un array vacío (body/prefixes must NOT have fewer
    // than 1 items), así que solo intentamos borrar si hay archivos.
    if (documentsUrl.length > 0) {
      await storageServer.remove('documents', documentsUrl);
    }

    // 5. Finalmente eliminar la capacitación
    try {
      await prisma.$transaction([
        prisma.training_materials.deleteMany({ where: { training_id: trainingId } }),
        prisma.trainings.deleteMany({ where: { id: trainingId } }),
      ]);
    } catch (deleteError) {
      console.error('Error al eliminar capacitación:', deleteError);
      return { success: false, error: 'Error al eliminar la capacitación' };
    }

    // Revalidar rutas para actualizar la UI
    revalidatePath('/dashboard/hse');

    return {
      success: true,
      message: 'Capacitación eliminada exitosamente',
    };
  } catch (error: any) {
    console.error('Error inesperado al eliminar capacitación:', error);
    return {
      success: false,
      error: `Error al eliminar capacitación: ${error.message}`,
    };
  }
};

// ============================================================
// Registro de capacitación — datos del acta (tsk-540)
// ============================================================

const getCompanyId = async () => (await cookies()).get('actualComp')?.value ?? null;

/**
 * Capacitadores de la empresa. Antes el capacitador era una imagen pegada en el
 * Word; el cliente anticipó que puede cambiar, así que es un catálogo.
 */
export const fetchTrainingInstructors = async () => {
  const company_id = await getCompanyId();
  if (!company_id) return [];

  return prisma.training_instructors.findMany({
    where: { company_id, is_active: true },
    select: { id: true, full_name: true, position: true, license_numbers: true, signature_path: true },
    orderBy: { full_name: 'asc' },
  });
};

export const createTrainingInstructor = async (data: {
  full_name: string;
  position?: string | null;
  license_numbers?: string | null;
  signature_path?: string | null;
}) => {
  try {
    const company_id = await getCompanyId();
    if (!company_id) return { success: false as const, error: 'No se ha seleccionado una empresa' };

    if (!data.full_name?.trim()) {
      return { success: false as const, error: 'El nombre del capacitador es obligatorio' };
    }

    const instructor = await prisma.training_instructors.create({
      data: {
        company_id,
        full_name: data.full_name.trim(),
        position: data.position?.trim() || null,
        license_numbers: data.license_numbers?.trim() || null,
        signature_path: data.signature_path || null,
      },
    });

    revalidatePath('/dashboard/hse');
    return { success: true as const, data: instructor };
  } catch (error: any) {
    console.error('Error al crear capacitador:', error);
    return { success: false as const, error: `Error al crear el capacitador: ${error.message}` };
  }
};

/**
 * Guarda los campos del acta. Si la capacitación está publicada (o se está
 * publicando), exige los datos que el acta necesita: la planilla en papel aclara
 * que no se deben dejar campos en blanco.
 */
export const updateTrainingRecordFields = async (
  trainingId: string,
  data: TrainingRecordData,
  options: { willBePublished?: boolean } = {}
) => {
  try {
    const company_id = await getCompanyId();
    if (!company_id) return { success: false as const, error: 'No se ha seleccionado una empresa' };

    const current = await prisma.trainings.findFirst({
      where: { id: trainingId, company_id },
      select: { status: true },
    });

    if (!current) return { success: false as const, error: 'No se encontró la capacitación' };

    const isPublished = options.willBePublished ?? current.status === 'Publicado';
    if (isPublished) {
      const errors = validateForPublish(data);
      if (errors.length) {
        return { success: false as const, error: errors.join('. ') };
      }
    }

    await prisma.trainings.update({
      where: { id: trainingId },
      data: {
        dictated_at: data.dictated_at ? new Date(data.dictated_at) : null,
        deadline_at: data.deadline_at ? new Date(data.deadline_at) : null,
        location: data.location,
        instructor_id: data.instructor_id,
        estimated_duration_minutes: data.estimated_duration_minutes,
        topics: data.topics,
        teaching_resources: data.teaching_resources,
        material_delivered: data.material_delivered,
        // Si no se entregó material, el detalle no aplica.
        material_delivered_detail: data.material_delivered ? data.material_delivered_detail : null,
        evaluation_methods: data.evaluation_methods,
        effectiveness_method: data.effectiveness_method,
        requires_new_actions: data.requires_new_actions,
        new_actions_detail: data.requires_new_actions ? data.new_actions_detail : null,
        validity_months: data.validity_months,
        updated_at: new Date(),
      },
    });

    revalidatePath('/dashboard/hse');
    revalidatePath(`/dashboard/hse/detail/${trainingId}`);

    return { success: true as const };
  } catch (error: any) {
    console.error('Error al guardar los datos del acta:', error);
    return { success: false as const, error: `Error al guardar los datos del acta: ${error.message}` };
  }
};

/**
 * Datos completos del registro grupal (tsk-540).
 *
 * Lista únicamente a los empleados que aprobaron hasta el momento de la
 * consulta: el registro es "vivo" hasta que se cierra. Toma el intento aprobado
 * (el definitivo); los intentos previos quedan solo para consulta administrativa.
 *
 * Nombre y puesto salen del snapshot tomado al firmar y caen al dato actual del
 * empleado solo si no hay firma (capacitaciones anteriores a la implementación).
 */
export const fetchTrainingRecord = async (trainingId: string) => {
  const company_id = await getCompanyId();
  if (!company_id) return null;

  const training = await prisma.trainings.findFirst({
    where: { id: trainingId, company_id },
    include: {
      instructor: true,
      company: { select: { company_name: true, company_cuit: true } },
    },
  });

  if (!training) return null;

  const attempts = await prisma.training_attempts.findMany({
    where: { training_id: trainingId, passed: true },
    include: {
      employee: {
        select: {
          firstname: true,
          lastname: true,
          document_number: true,
          hierarchy_rel: { select: { name: true } },
        },
      },
    },
    orderBy: [{ completed_at: 'asc' }],
  });

  // Un empleado puede tener más de un intento aprobado si rehizo la
  // capacitación: nos quedamos con el último.
  const latestByEmployee = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    const previous = latestByEmployee.get(attempt.employee_id);
    if (!previous || (attempt.attempt_number ?? 0) >= (previous.attempt_number ?? 0)) {
      latestByEmployee.set(attempt.employee_id, attempt);
    }
  }

  const rows = [...latestByEmployee.values()].map((attempt, index) => ({
    number: index + 1,
    full_name:
      attempt.signer_full_name ?? `${attempt.employee.lastname ?? ''} ${attempt.employee.firstname ?? ''}`.trim(),
    position: attempt.signer_position ?? attempt.employee.hierarchy_rel?.name ?? '',
    signature_path: attempt.signature_path,
    // El cliente pidió este formato exacto: "8/10 – Aprobado".
    result: `${attempt.score ?? 0}/${attempt.max_score} – Aprobado`,
    completed_at: attempt.completed_at,
    // Dato secundario: no va en la planilla, sí en los reportes internos.
    time_spent_seconds: attempt.time_spent_seconds,
  }));

  return { training, rows };
};

/**
 * Cierre formal de la capacitación (tsk-540). Exige la fecha límite cumplida y
 * los campos de HSE completos; a partir de acá el registro grupal queda
 * definitivo y deja de incorporar empleados.
 */
export const closeTraining = async (trainingId: string) => {
  try {
    const company_id = await getCompanyId();
    if (!company_id) return { success: false as const, error: 'No se ha seleccionado una empresa' };

    const training = await prisma.trainings.findFirst({
      where: { id: trainingId, company_id },
      select: { status: true, deadline_at: true },
    });

    if (!training) return { success: false as const, error: 'No se encontró la capacitación' };
    if (training.status === 'Cerrada') return { success: false as const, error: 'La capacitación ya está cerrada' };
    if (training.status !== 'Publicado') {
      return { success: false as const, error: 'Solo se pueden cerrar capacitaciones publicadas' };
    }

    const record = await fetchTrainingRecordFields(trainingId);
    const errors = record ? validateForClose(record) : ['No se encontró la capacitación'];
    if (errors.length) {
      return { success: false as const, error: `No se puede cerrar la capacitación: ${errors.join('. ')}` };
    }

    const user = await fetchCurrentUser();

    await prisma.trainings.update({
      where: { id: trainingId },
      data: {
        status: 'Cerrada',
        closed_at: new Date(),
        closed_by: user?.id ?? null,
        updated_at: new Date(),
      },
    });

    revalidatePath('/dashboard/hse');
    revalidatePath(`/dashboard/hse/detail/${trainingId}`);

    return { success: true as const };
  } catch (error: any) {
    console.error('Error al cerrar la capacitación:', error);
    return { success: false as const, error: `Error al cerrar la capacitación: ${error.message}` };
  }
};

/**
 * Datos del acta de una capacitación, para hidratar el formulario de edición.
 */
export const fetchTrainingRecordFields = async (trainingId: string): Promise<TrainingRecordData | null> => {
  const company_id = await getCompanyId();
  if (!company_id) return null;

  const training = await prisma.trainings.findFirst({
    where: { id: trainingId, company_id },
    select: {
      dictated_at: true,
      deadline_at: true,
      location: true,
      instructor_id: true,
      estimated_duration_minutes: true,
      topics: true,
      teaching_resources: true,
      material_delivered: true,
      material_delivered_detail: true,
      evaluation_methods: true,
      effectiveness_method: true,
      requires_new_actions: true,
      new_actions_detail: true,
      validity_months: true,
    },
  });

  if (!training) return null;

  return {
    ...training,
    // El input date del formulario espera yyyy-MM-dd.
    dictated_at: training.dictated_at ? training.dictated_at.toISOString().split('T')[0] : null,
    deadline_at: training.deadline_at ? training.deadline_at.toISOString().split('T')[0] : null,
  };
};
