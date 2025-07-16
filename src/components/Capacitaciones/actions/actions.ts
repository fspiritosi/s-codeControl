'use server';

import { supabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * Crea una nueva capacitación
 */
export const createTraining = async (data: { title: string; description: string; passing_score?: number }) => {
  try {
    const supabase = supabaseServer();
    const user = await supabase.auth.getUser();
    const cookiesStore = cookies();
    const company_id = cookiesStore.get('actualComp')?.value;

    console.log('User:', user.data.user?.id);
    console.log('Company ID:', company_id);
    console.log('Training data:', data);

    if (!company_id) {
      console.error('No hay company_id en las cookies');
      return { success: false, error: 'No se ha seleccionado una empresa' };
    }

    if (!user.data.user) {
      console.error('No hay usuario autenticado');
      return { success: false, error: 'No se ha iniciado sesión' };
    }

    // Verificar la estructura de la tabla trainings
    const { data: tableInfo, error: tableError } = await supabase.from('trainings').select('*').limit(1);

    console.log('Table info:', tableInfo);
    console.log('Table error:', tableError);

    // Crear la capacitación
    const trainingPayload = {
      title: data.title,
      description: data.description || '',
      passing_score: data.passing_score || 0, // 0 indica que no hay requisito mínimo si no hay evaluación
      company_id: company_id,
    };

    console.log('Payload a insertar:', trainingPayload);

    const { data: trainingData, error } = await supabase.from('trainings').insert(trainingPayload).select();

    console.log('Response data:', trainingData);

    if (error) {
      console.error('Error al crear la capacitación:', error);
      console.error('Error details:', JSON.stringify(error));
      return {
        success: false,
        error: `Error en la base de datos: ${error.message || 'Error desconocido'}. Código: ${error.code || 'Sin código'}.`,
      };
    }

    if (!trainingData || trainingData.length === 0) {
      console.error('No se recibieron datos de la capacitación creada');
      return {
        success: false,
        error: 'La capacitación se creó pero no se recibieron los datos',
      };
    }

    revalidatePath('/dashboard/hse');

    return { success: true, data: trainingData[0] };
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
    const supabase = supabaseServer();

    // Añadir los materiales
    const { data: materialsData, error: materialsError } = await supabase
      .from('training_materials')
      .insert(
        materials.map((material) => ({
          training_id: trainingId,
          name: material.name,
          type: material.type,
          file_url: material.file_url,
          file_size: material.file_size || 0,
          order_index: material.order_index,
          is_required: material.is_required !== undefined ? material.is_required : true,
        }))
      )
      .select();

    if (materialsError) {
      console.error('Error al añadir materiales:', materialsError);
      throw new Error(`Error al añadir materiales: ${materialsError.message}`);
    }

    return { success: true, data: materialsData };
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
    const supabase = supabaseServer();

    // Añadir las preguntas una por una para poder obtener el ID y asociarlo a las opciones
    for (const question of questions) {
      // Añadir la pregunta
      const { data: questionData, error: questionError } = await supabase
        .from('training_questions')
        .insert({
          training_id: trainingId,
          question_text: question.question_text,
          question_type: question.question_type,
          points: question.points,
          order_index: question.order_index,
        })
        .select()
        .single();

      if (questionError) {
        console.error('Error al añadir pregunta:', questionError);
        throw new Error(`Error al añadir pregunta: ${questionError.message}`);
      }

      // Añadir las opciones
      if (question.options && question.options.length > 0) {
        const { error: optionsError } = await supabase.from('training_question_options').insert(
          question.options.map((option) => ({
            question_id: questionData.id,
            option_text: option.option_text,
            is_correct: option.is_correct,
            order_index: option.order_index,
          }))
        );

        if (optionsError) {
          console.error('Error al añadir opciones:', optionsError);
          throw new Error(`Error al añadir opciones: ${optionsError.message}`);
        }
      }
    }

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
    const supabase = supabaseServer();

    // Asociar las etiquetas
    const { error: tagsError } = await supabase.from('training_tag_assignments').insert(
      tagIds.map((tagId) => ({
        training_id: trainingId,
        tag_id: tagId,
      }))
    );

    if (tagsError) {
      console.error('Error al asignar etiquetas:', tagsError);
      throw new Error(`Error al asignar etiquetas: ${tagsError.message}`);
    }

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
    const supabase = supabaseServer();
    const { data, error } = await supabase.from('training_tags').select('*').eq('is_active', true);

    if (error) {
      console.error('Error al obtener etiquetas:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error inesperado al obtener etiquetas:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const updateTag = async (dataToUpdate: { id: string; name: string; color: string; is_active: boolean }) => {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('training_tags')
      .update({ name: dataToUpdate.name, color: dataToUpdate.color, is_active: dataToUpdate.is_active })
      .eq('id', dataToUpdate.id);

    if (error) {
      console.error('Error al actualizar etiqueta:', error);
      throw new Error(`Error al actualizar etiqueta: ${error.message}`);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error inesperado al actualizar etiqueta:', error);
    return { success: false, error: error.message };
  }
};

export const createArea = async (dataToCreate: { name: string; color: string }) => {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('training_tags')
      .insert({ name: dataToCreate.name, color: dataToCreate.color });

    if (error) {
      console.error('Error al crear etiqueta:', error);
      throw new Error(`Error al crear etiqueta: ${error.message}`);
    }

    return { success: true, data };
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
    const supabase = supabaseServer();
    const { data, error } = await supabase.from('training_tags').select('*');

    if (error) {
      console.error('Error al obtener etiquetas:', error);
      return [];
    }

    return data;
  } catch (error: any) {
    console.error('Error inesperado al obtener etiquetas:', error);
    return [];
  }
};
export const fetchTrainings = async () => {
  try {
    const supabase = supabaseServer();
    const cookiesStore = cookies();
    const company_id = cookiesStore.get('actualComp')?.value;

    if (!company_id) {
      console.error('No hay company_id en las cookies');
      return [];
    }

    // Obtener capacitaciones con sus etiquetas, materiales y preguntas
    const { data, error } = await supabase
      .from('trainings')
      .select(
        `
        *,
        training_tag_assignments(
          training_tags(*)
        ),
        training_materials(*),
        training_attempts(*),
        training_questions(*, training_question_options(*))
      `
      )
      .eq('company_id', company_id)
      .order('created_at', { ascending: false });

    // console.log('Datos de capacitaciones recibidos:', data);

    if (error) {
      console.error('Error al obtener capacitaciones:', error);
      return [];
    }

    // Obtener el total de empleados activos en la empresa
    const { count: totalEmployees, error: employeesError } = await supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .eq('company_id', company_id)
      .eq('is_active', true);

    console.log('Total de empleados:', totalEmployees);
    console.log('Error de empleados:', employeesError);

    // Contadores de intentos completados por training_id
    const { data: completedData, error: completedError } = await supabase
      .from('training_attempts')
      .select('training_id, count(*)', { count: 'exact' })
      .eq('status', 'completed');

    console.log('Contadores de intentos completados:', completedData);

    // Procesar los datos para el formato que espera el componente TrainingSection
    const formattedTrainings = data.map((training) => {
      // Por defecto, todas las capacitaciones se aplican a todos los empleados
      const totalEmployeesCount = totalEmployees || 0;

      // Contar cuántos empleados han completado esta capacitación específica
      const completedCount = completedData?.find((c) => c.training_id === training.id)?.count || 0;

      // Extraer las etiquetas
      const tags =
        training.training_tag_assignments?.map((tagAssignment) => tagAssignment.training_tags).filter(Boolean) || [];

      // Extraer los materiales
      const materials =
        training.training_materials?.map((material) => ({
          type: material.type || 'pdf',
          name: material.name,
          url: material.file_url,
        })) || [];

      // Extraer preguntas y opciones y ordenarlas por order_index
      const questions =
        training.training_questions
          ?.map((question) => ({
            id: question.id,
            question: question.question_text,
            options: question.training_question_options?.map((option) => option.option_text) || [],
            correctAnswer: question.training_question_options?.findIndex((option) => option.is_correct) || 0,
            order_index: question.order_index || 0, // Añadir order_index para ordenar
          }))
          .sort((a, b) => a.order_index - b.order_index) || []; // Ordenar por order_index

      return {
        id: training.id,
        title: training.title,
        description: training.description || '',
        createdDate: training.created_at ? new Date(training.created_at).toISOString().split('T')[0] : '',
        tags,
        materials,
        attempts: training.training_attempts,
        evaluation: {
          questions,
          passingScore: training.passing_score || 0,
        },
        completedCount: Number(completedCount) || 0,
        totalEmployees: Number(totalEmployeesCount) || 0,
        status: training.status || 'draft',
      };
    });

    console.log('Datos formateados:', formattedTrainings);

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
    const supabase = supabaseServer();
    const cookiesStore = cookies();
    const company_id = cookiesStore.get('actualComp')?.value;

    if (!company_id) {
      console.error('No hay company_id en las cookies');
      return 0;
    }

    // Obtener la capacitación específica con todos sus datos relacionados
    const { data, error } = await supabase
      .from('employees')
      .select('count', { count: 'exact' })
      .eq('company_id', company_id)
      .eq('is_active', true);

    if (error) {
      console.error('Error al obtener empleados:', error);
      return 0;
    }

    return data?.[0].count || 0;
  } catch (error: any) {
    console.error('Error inesperado al obtener empleados:', error);
    return 0;
  }
};

export const fetchTrainingById = async (id: string) => {
  try {
    const supabase = supabaseServer();
    const cookiesStore = cookies();
    const company_id = cookiesStore.get('actualComp')?.value;

    if (!company_id) {
      console.error('No hay company_id en las cookies');
      return null;
    }

    // Obtener la capacitación específica con todos sus datos relacionados
    const { data: trainingData, error: trainingError } = await supabase
      .from('trainings')
      .select(
        `
        *,
        training_tag_assignments(
          training_tags(*)
        ),
        training_materials(*),
        training_attempts(*),
        training_questions(*, training_question_options(*))
      `
      )
      .eq('id', id)
      .eq('company_id', company_id)
      .single();

    if (trainingError) {
      console.error('Error al obtener detalles de la capacitación:', trainingError);
      return null;
    }

    if (!trainingData) {
      console.error('No se encontró la capacitación con ID:', id);
      return null;
    }

    // 1. Obtener TODOS los empleados activos de la empresa
    const { data: activeEmployees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', company_id)
      .eq('is_active', true);

    if (employeesError) {
      console.error('Error al obtener empleados:', employeesError);
      return null;
    }

    // 2. Obtener todos los intentos COMPLETADOS para esta capacitación
    const { data: completedAttempts, error: completedError } = await supabase
      .from('training_attempts')
      .select('*')
      .eq('training_id', id)
      .gte('score', trainingData.passing_score);

    if (completedError) {
      console.error('Error al obtener intentos completados:', completedError);
      return null;
    }

    // 3. Crear un conjunto de IDs de empleados que completaron la capacitación
    const completedEmployeeIds = new Set<string>();
    const attemptsByEmployeeId: (typeof completedAttempts)[number] | {} = {};

    if (completedAttempts && completedAttempts.length > 0) {
      completedAttempts.forEach((attempt) => {
        if (attempt.employee_id) {
          completedEmployeeIds.add(attempt.employee_id);
          (attemptsByEmployeeId as any)[attempt.employee_id as string] = attempt;
        }
      });
    }

    // 4. Separar empleados en "completados" y "pendientes"
    const completedEmployees: {
      id: string;
      name: string;
      cuil: string;
      department: string | null;
      status: string;
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

    if (activeEmployees && activeEmployees.length > 0) {
      activeEmployees.forEach((employee) => {
        // Si el ID del empleado está en el conjunto de completados
        if (completedEmployeeIds.has(employee.id)) {
          const attempt = (attemptsByEmployeeId as any)[employee.id as string];
          completedEmployees.push({
            id: employee.id,
            name: `${employee.firstname} ${employee.lastname}`,
            cuil: employee.cuil || '',
            department: employee.company_position || null, // Campo correcto según Employee
            status: 'completed',
            lastAttempt: attempt
              ? {
                  date: attempt.completed_at,
                  score: `${attempt.score}/${trainingData.training_questions.length}`,
                  result: attempt.score >= trainingData.passing_score ? 'passed' : 'failed',
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
    }

    // Extraer las etiquetas
    const tags =
      trainingData.training_tag_assignments
        ?.map((tagAssignment) => tagAssignment.training_tags?.name || '')
        .filter(Boolean) || [];

    // Extraer los materiales
    const materials =
      trainingData.training_materials
        ?.map((material) => ({
          id: material.id,
          type: material.type || 'pdf',
          name: material.name,
          url: material.file_url,
          order: material.order_index,
          is_required: material.is_required,
          file_size: material.file_size,
        }))
        .sort((a, b) => a.order - b.order) || [];

    // Extraer preguntas y opciones y ordenarlas por order_index
    const questions =
      trainingData.training_questions
        ?.map((question) => ({
          id: question.id,
          question: question.question_text,
          options:
            question.training_question_options
              ?.filter((option) => option.is_active)
              .map((option) => option.option_text) || [],
          correctAnswer: question.training_question_options?.findIndex((option) => option.is_correct) || 0,
          points: question.points || 1,
          order_index: question.order_index || 0, // Añadir order_index para ordenar
        }))
        .sort((a, b) => a.order_index - b.order_index) || []; // Ordenar por order_index

    // Formato final para la respuesta
    const formattedTraining = {
      id: trainingData.id,
      title: trainingData.title,
      test_limit_time: trainingData.test_limit_time,
      description: trainingData.description,
      createdDate: trainingData.created_at ? new Date(trainingData.created_at).toISOString().split('T')[0] : '',
      tags,
      materials,
      attempts: trainingData.training_attempts,
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
      status: trainingData.status,
    };
    console.log(formattedTraining);

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
    status: 'Borrador' | 'Archivado' | 'Publicado' | null;
    passing_score?: number;
    test_limit_time?: number;
  }
) => {
  try {
    const supabase = supabaseServer();
    const cookiesStore = cookies();
    const company_id = cookiesStore.get('actualComp')?.value;

    if (!company_id) {
      console.error('No hay company_id en las cookies');
      return { success: false, error: 'No se ha seleccionado una empresa' };
    }

    // Actualizar la capacitación
    const { data: updatedTraining, error } = await supabase
      .from('trainings')
      .update({
        title: data.title,
        description: data.description,
        updated_at: new Date().toISOString(),
        status: data.status,
        passing_score: data.passing_score,
        test_limit_time: data.test_limit_time,
      })
      .eq('id', trainingId)
      .eq('company_id', company_id)
      .select();

    if (error) {
      console.error('Error al actualizar la capacitación:', error);
      return { success: false, error: `Error en la base de datos: ${error.message}` };
    }

    revalidatePath('/dashboard/hse');
    revalidatePath(`/dashboard/hse/detail/${trainingId}`);

    return { success: true, data: updatedTraining[0] };
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
    const supabase = supabaseServer();

    // Primero obtener todos los materiales existentes para eliminar sus archivos
    const { data: existingMaterials, error: fetchError } = await supabase
      .from('training_materials')
      .select('file_url') // Solo necesitamos la URL del archivo
      .eq('training_id', trainingId);

    if (fetchError) {
      console.error('Error al obtener materiales existentes:', fetchError);
      return { success: false, error: `Error al obtener materiales: ${fetchError.message}` };
    }

    // Eliminar los archivos del storage si existen
    if (existingMaterials && existingMaterials.length > 0) {
      const filePathsToDelete = existingMaterials
        .map((material) => {
          // Extraer la ruta del archivo del final de la URL pública
          const parts = material.file_url.split('training-materials/');
          return parts.length > 1 ? parts[1] : null;
        })
        .filter((path): path is string => path !== null && path.trim() !== ''); // Filtrar nulos y vacíos

      if (filePathsToDelete.length > 0) {
        console.log('Archivos a eliminar del storage:', filePathsToDelete);
        const { error: storageError } = await supabase.storage.from('training-materials').remove(filePathsToDelete);

        if (storageError) {
          console.error('Error al eliminar archivos del storage:', storageError);
          // No interrumpimos el proceso si falla la eliminación del storage
          // pero registramos el error para depuración
        } else {
          console.log('Archivos eliminados del storage correctamente.');
        }
      }
    }

    // Ahora eliminar los registros de materiales de la base de datos
    const { error: deleteError } = await supabase.from('training_materials').delete().eq('training_id', trainingId);

    if (deleteError) {
      console.error('Error al eliminar materiales existentes de la DB:', deleteError);
      return { success: false, error: `Error al eliminar materiales de la DB: ${deleteError.message}` };
    } else {
      console.log('Registros de materiales eliminados de la DB correctamente.');
    }

    // Si no hay nuevos materiales para insertar, terminar aquí
    if (!materials || materials.length === 0) {
      revalidatePath(`/training/${trainingId}/detail`);
      return { success: true, data: [] };
    }

    // Añadir los nuevos materiales
    const { data: newMaterials, error: insertError } = await supabase
      .from('training_materials')
      .insert(
        materials.map((material) => ({
          training_id: trainingId,
          name: material.name,
          type: material.type || 'pdf',
          file_url: material.url,
          file_size: material.file_size || 0,
          order_index: material.order,
          is_required: material.is_required !== undefined ? material.is_required : true,
        }))
      )
      .select();

    if (insertError) {
      console.error('Error al añadir nuevos materiales:', insertError);
      return { success: false, error: `Error al añadir materiales: ${insertError.message}` };
    }

    revalidatePath(`/training/${trainingId}/detail`); // Revalidar la ruta para mostrar los cambios

    return { success: true, data: newMaterials };
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
  const supabase = supabaseServer();

  try {
    // 1. Obtener todas las preguntas actuales para este training
    const { data: existingQuestions, error: getQuestionsError } = await supabase
      .from('training_questions')
      .select('*,training_attempt_answers(*)')
      .eq('training_id', trainingId);

    if (getQuestionsError) {
      console.error('Error al obtener preguntas existentes:', getQuestionsError);
      return {
        success: false,
        error: `Error al obtener preguntas existentes: ${getQuestionsError.message}`,
      };
    }

    // 2. Función para actualizar opciones de una pregunta
    const updateQuestionOptions = async (questionId: string, options: string[], correctAnswer: number) => {
      try {
        console.log(`[DEBUG] Actualizando opciones para pregunta ${questionId}`);
        console.log(`[DEBUG] Opciones recibidas (${options.length}):`, options);
        console.log(`[DEBUG] Respuesta correcta índice:`, correctAnswer);

        // Primero obtenemos las opciones existentes y sus posibles respuestas
        const { data: existingOptions, error: getOptionsError } = await supabase
          .from('training_question_options')
          .select('id, option_text, is_correct, order_index, training_attempt_answers(id)')
          .eq('question_id', questionId);

        if (getOptionsError) {
          console.error(`Error al obtener opciones existentes para pregunta ${questionId}:`, getOptionsError);
          throw getOptionsError;
        }

        console.log(`[DEBUG] Opciones existentes encontradas (${existingOptions?.length || 0}):`, existingOptions);

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
        existingOptions?.forEach((option) => {
          const normalizedText = option.option_text.toLowerCase().trim();
          if (!existingOptionsGroups[normalizedText]) {
            existingOptionsGroups[normalizedText] = [];
          }

          existingOptionsGroups[normalizedText].push({
            id: option.id,
            is_correct: option.is_correct || false,
            order_index: option.order_index,
            original_text: option.option_text,
            hasAnswers: option.training_attempt_answers && option.training_attempt_answers.length > 0,
          });
        });

        // Marcar todas las opciones como no procesadas inicialmente
        const processedOptionIds = new Set<string>();

        // Identificar operaciones: actualizar, insertar, eliminar
        const toUpdate: any[] = [];
        const toInsert: any[] = [];
        const toMarkInactive: string[] = [];
        const toDelete: string[] = [];

        // Procesamos las nuevas opciones
        options.forEach((optionText, index) => {
          const normalizedOptionText = optionText.toLowerCase().trim();
          console.log(`[DEBUG] Procesando opción ${index}: "${optionText}" (normalizada: "${normalizedOptionText}")`);

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
            console.log(`[DEBUG] Opción "${optionText}" ya existe, se usará la ID: ${optionToKeep.id}`);

            // Marcamos esta opción como procesada
            processedOptionIds.add(optionToKeep.id);

            // Verificamos si necesita actualización
            if (optionToKeep.is_correct !== (index === correctAnswer) || optionToKeep.order_index !== index) {
              console.log(
                `[DEBUG] Opción "${optionText}" (ID: ${optionToKeep.id}) necesita actualización. Cambios: `,
                `is_correct: ${optionToKeep.is_correct} -> ${index === correctAnswer}, `,
                `order_index: ${optionToKeep.order_index} -> ${index}`
              );

              toUpdate.push({
                id: optionToKeep.id,
                is_correct: index === correctAnswer,
                order_index: index,
                is_active: true,
              });
            } else {
              console.log(`[DEBUG] Opción "${optionText}" (ID: ${optionToKeep.id}) no necesita actualización.`);
            }

            // Para el resto de las opciones duplicadas del grupo, marcarlas para eliminación o inactivación
            if (optionGroup.length > 1) {
              console.log(`[DEBUG] Hay ${optionGroup.length - 1} opciones duplicadas adicionales para "${optionText}"`);

              for (let i = 1; i < optionGroup.length; i++) {
                const duplicateOption = optionGroup[i];
                processedOptionIds.add(duplicateOption.id);

                if (duplicateOption.hasAnswers) {
                  console.log(
                    `[DEBUG] Opción duplicada "${duplicateOption.original_text}" (ID: ${duplicateOption.id}) tiene respuestas, se marcará como inactiva.`
                  );
                  toMarkInactive.push(duplicateOption.id);
                } else {
                  console.log(
                    `[DEBUG] Opción duplicada "${duplicateOption.original_text}" (ID: ${duplicateOption.id}) no tiene respuestas, se eliminará.`
                  );
                  toDelete.push(duplicateOption.id);
                }
              }
            }
          } else {
            // Es una opción nueva, la insertamos
            console.log(`[DEBUG] Opción "${optionText}" es nueva, se insertará.`);
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
        console.log(`[DEBUG] Verificando opciones no procesadas que ya no están en la lista nueva`);

        existingOptions?.forEach((option) => {
          if (!processedOptionIds.has(option.id)) {
            // Esta opción ya no está en la lista nueva
            const hasAnswers = option.training_attempt_answers && option.training_attempt_answers.length > 0;

            if (hasAnswers) {
              // Si tiene respuestas asociadas, la marcamos como inactiva pero no la eliminamos
              console.log(
                `[DEBUG] Opción "${option.option_text}" (ID: ${option.id}) ya no se usa y tiene respuestas asociadas, se marcará como inactiva.`
              );
              toMarkInactive.push(option.id);
            } else {
              // Si no tiene respuestas, la podemos eliminar
              console.log(
                `[DEBUG] Opción "${option.option_text}" (ID: ${option.id}) ya no se usa y no tiene respuestas asociadas, se eliminará.`
              );
              toDelete.push(option.id);
            }
          }
        });

        // Resumen de operaciones
        console.log(`[DEBUG] RESUMEN DE OPERACIONES:`);
        console.log(`[DEBUG] - A actualizar: ${toUpdate.length}`, toUpdate);
        console.log(`[DEBUG] - A insertar: ${toInsert.length}`, toInsert);
        console.log(`[DEBUG] - A marcar inactivas: ${toMarkInactive.length}`, toMarkInactive);
        console.log(`[DEBUG] - A eliminar: ${toDelete.length}`, toDelete);

        // Ejecutar las operaciones de base de datos
        // 1. Actualizar opciones existentes que han cambiado
        if (toUpdate.length > 0) {
          console.log(`[DEBUG] Ejecutando ${toUpdate.length} actualizaciones...`);
          for (const option of toUpdate) {
            console.log(`[DEBUG] Actualizando opción ID: ${option.id}`, option);
            const { error: updateError } = await supabase
              .from('training_question_options')
              .update({
                is_correct: option.is_correct,
                order_index: option.order_index,
                is_active: option.is_active,
              })
              .eq('id', option.id);

            if (updateError) {
              console.error(`Error al actualizar opción ${option.id}:`, updateError);
              throw updateError;
            }
            console.log(`[DEBUG] Actualización exitosa para opción ID: ${option.id}`);
          }
        }

        // 2. Insertar nuevas opciones
        if (toInsert.length > 0) {
          console.log(`[DEBUG] Insertando ${toInsert.length} nuevas opciones...`);
          const { data: insertedData, error: insertError } = await supabase
            .from('training_question_options')
            .insert(toInsert)
            .select();

          if (insertError) {
            console.error(`Error al insertar nuevas opciones para pregunta ${questionId}:`, insertError);
            throw insertError;
          }

          console.log(`[DEBUG] Opciones insertadas exitosamente:`, insertedData);
        }

        // 3. Marcar como inactivas opciones con respuestas pero que ya no se usan
        if (toMarkInactive.length > 0) {
          console.log(`[DEBUG] Marcando ${toMarkInactive.length} opciones como inactivas...`);
          for (const optionId of toMarkInactive) {
            console.log(`[DEBUG] Marcando como inactiva la opción ID: ${optionId}`);
            const { error: inactiveError } = await supabase
              .from('training_question_options')
              .update({ is_active: false })
              .eq('id', optionId);

            if (inactiveError) {
              console.error(`Error al marcar opción ${optionId} como inactiva:`, inactiveError);
              throw inactiveError;
            }
            console.log(`[DEBUG] Opción ${optionId} marcada como inactiva exitosamente`);
          }
        }

        // 4. Eliminar opciones que no tienen respuestas y ya no se usan
        if (toDelete.length > 0) {
          console.log(`[DEBUG] Eliminando ${toDelete.length} opciones...`);
          for (const optionId of toDelete) {
            console.log(`[DEBUG] Eliminando opción ID: ${optionId}`);
            const { error: deleteError } = await supabase.from('training_question_options').delete().eq('id', optionId);

            if (deleteError) {
              console.error(`Error al eliminar opción ${optionId}:`, deleteError);
              throw deleteError;
            }
            console.log(`[DEBUG] Opción ${optionId} eliminada exitosamente`);
          }
        }

        console.log(`[DEBUG] Actualización de opciones para pregunta ${questionId} completada con éxito`);
        return true;
      } catch (error: any) {
        console.error(`Error al actualizar opciones para pregunta ${questionId}:`, error);
        throw new Error(`Error al actualizar opciones: ${error.message}`);
      }
    };

    // 3. Identificar preguntas a eliminar (existentes que no están en la lista nueva)
    const questionIdsToKeep = questions.filter((q) => q.id).map((q) => q.id as string);

    const questionsToRemove = existingQuestions?.filter((eq) => !questionIdsToKeep.includes(eq.id)) || [];

    // 4. Procesar eliminaciones
    for (const questionToRemove of questionsToRemove) {
      // Verificar si tiene intentos de respuesta
      const hasAttempts =
        questionToRemove.training_attempt_answers && questionToRemove.training_attempt_answers.length > 0;

      if (hasAttempts) {
        // Soft delete si tiene intentos
        const { error: softDeleteError } = await supabase
          .from('training_questions')
          .update({ is_active: false })
          .eq('id', questionToRemove.id);

        if (softDeleteError) {
          console.error(`Error al desactivar pregunta ${questionToRemove.id}:`, softDeleteError);
          return {
            success: false,
            error: `Error al desactivar pregunta: ${softDeleteError.message}`,
          };
        }
      } else {
        // Eliminar opciones primero
        const { error: deleteOptionsError } = await supabase
          .from('training_question_options')
          .delete()
          .eq('question_id', questionToRemove.id);

        if (deleteOptionsError) {
          console.error(`Error al eliminar opciones de pregunta ${questionToRemove.id}:`, deleteOptionsError);
          return {
            success: false,
            error: `Error al eliminar opciones: ${deleteOptionsError.message}`,
          };
        }

        // Eliminar la pregunta físicamente
        const { error: deleteQuestionError } = await supabase
          .from('training_questions')
          .delete()
          .eq('id', questionToRemove.id);

        if (deleteQuestionError) {
          console.error(`Error al eliminar pregunta ${questionToRemove.id}:`, deleteQuestionError);
          return {
            success: false,
            error: `Error al eliminar pregunta: ${deleteQuestionError.message}`,
          };
        }
      }
    }

    // 5. Preparar arrays para inserción
    const questionInserts: any[] = [];
    const pendingOptionInserts: any[] = [];

    // 6. Procesar cada pregunta
    for (const [index, question] of questions.entries()) {
      // Comprobar si la pregunta tiene un ID y existe en la base de datos
      if (question.id && existingQuestions?.some((eq) => eq.id === question.id)) {
        const existingQuestion = existingQuestions.find((eq) => eq.id === question.id);

        if (existingQuestion) {
          // Actualizar solo si hay cambios
          if (
            existingQuestion.question_text !== question.question ||
            existingQuestion.order_index !== index ||
            !existingQuestion.is_active
          ) {
            const { error: updateError } = await supabase
              .from('training_questions')
              .update({
                question_text: question.question,
                points: question.points || 1,
                order_index: index,
                is_active: true, // Asegurarse que esté activa
              })
              .eq('id', existingQuestion.id);

            if (updateError) {
              console.error(`Error al actualizar pregunta ${existingQuestion.id}:`, updateError);
              return {
                success: false,
                error: `Error al actualizar pregunta: ${updateError.message}`,
              };
            }
          }

          // Actualizar opciones
          try {
            await updateQuestionOptions(existingQuestion.id, question.options, question.correctAnswer);
          } catch (error: any) {
            return {
              success: false,
              error: error.message,
            };
          }
        }
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
      const { data: insertedQuestions, error: insertQuestionsError } = await supabase
        .from('training_questions')
        .insert(questionInserts)
        .select();

      if (insertQuestionsError) {
        console.error('Error al insertar preguntas:', insertQuestionsError);
        return {
          success: false,
          error: `Error al insertar preguntas: ${insertQuestionsError.message}`,
        };
      }

      // 8. Insertar las opciones de las nuevas preguntas
      if (insertedQuestions && insertedQuestions.length > 0) {
        for (const pending of pendingOptionInserts) {
          const questionId = insertedQuestions[pending.questionIndex].id;

          try {
            await updateQuestionOptions(questionId, pending.options, pending.correctAnswer);
          } catch (error: any) {
            return {
              success: false,
              error: error.message,
            };
          }
        }
      }
    }

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
    const supabase = supabaseServer();
    const cookiesStore = cookies();
    const company_id = cookiesStore.get('actualComp')?.value;

    if (!company_id) {
      console.error('No hay company_id en las cookies');
      return { success: false, error: 'No se ha seleccionado una empresa' };
    }

    // Primero eliminar todas las asignaciones de etiquetas existentes
    const { error: deleteError } = await supabase
      .from('training_tag_assignments')
      .delete()
      .eq('training_id', trainingId);

    if (deleteError) {
      console.error('Error al eliminar asignaciones de etiquetas:', deleteError);
      return { success: false, error: `Error al eliminar etiquetas: ${deleteError.message}` };
    }

    // Si no hay nuevas etiquetas, terminar aquí
    if (tagIds.length === 0) {
      return { success: true, data: [] };
    }

    const assignments = tagIds.map((tag_id) => ({
      training_id: trainingId,
      tag_id,
    }));

    const { error: assignError } = await supabase.from('training_tag_assignments').insert(assignments);

    if (assignError) {
      console.error('Error al asignar etiquetas:', assignError);
      return { success: false, error: `Error al asignar etiquetas: ${assignError.message}` };
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
    const supabase = supabaseServer();

    // Primero obtenemos los datos actuales de la capacitación
    const { data: trainingData, error: fetchError } = await supabase
      .from('trainings')
      .select('title, description, status')
      .eq('id', trainingId)
      .single();

    if (fetchError) {
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
      status: trainingData.status,
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
    const supabase = supabaseServer();

    const { error: updateError } = await supabase.from('trainings').update({ status }).eq('id', trainingId);

    if (updateError) {
      console.error('Error al actualizar estado de capacitación:', updateError);
      return { success: false, error: `Error al actualizar estado: ${updateError.message}` };
    }

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
    const supabase = supabaseServer();

    // 4. Eliminar materiales
    const { data: materials, error: materialsError } = await supabase
      .from('training_materials')
      .select()
      .eq('training_id', trainingId);

    if (materialsError) {
      console.error('Error al eliminar materiales:', materialsError);
      return { success: false, error: 'Error al eliminar materiales de la capacitación' };
    }

    const documentsUrl = materials.map((material) => material.file_url);
    await supabase.storage.from('documents').remove(documentsUrl);
    await supabase.from('training_materials').delete().eq('training_id', trainingId);

    // 5. Finalmente eliminar la capacitación
    const { error: deleteError } = await supabase.from('trainings').delete().eq('id', trainingId);

    if (deleteError) {
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
