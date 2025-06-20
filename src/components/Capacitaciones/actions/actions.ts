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
    const { data, error } = await supabase.from('training_tags').select('*');

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

/**
 * Obtiene todas las capacitaciones
 */
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
        training_questions(*, training_question_options(*))
      `
      )
      .eq('company_id', company_id)
      .order('created_at', { ascending: false });

    console.log('Datos de capacitaciones recibidos:', data);

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
        training.training_tag_assignments
          ?.map((tagAssignment) => tagAssignment.training_tags?.name || '')
          .filter(Boolean) || [];

      // Extraer los materiales
      const materials =
        training.training_materials?.map((material) => ({
          type: material.type || 'pdf',
          name: material.name,
          url: material.file_url,
        })) || [];

      // Extraer preguntas y opciones
      const questions =
        training.training_questions?.map((question) => ({
          id: question.id,
          question: question.question_text,
          options: question.training_question_options?.map((option) => option.option_text) || [],
          correctAnswer: question.training_question_options?.findIndex((option) => option.is_correct) || 0,
        })) || [];

      return {
        id: training.id,
        title: training.title,
        description: training.description || '',
        createdDate: training.created_at ? new Date(training.created_at).toISOString().split('T')[0] : '',
        tags,
        materials,
        evaluation: {
          questions,
          passingScore: training.passing_score || 70,
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
    const attemptsByEmployeeId: typeof completedAttempts[number] |{} = {};

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
                  score: `${attempt.score}/${attempt.total_score}`,
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

    // Extraer preguntas y opciones
    const questions =
      trainingData.training_questions?.map((question) => ({
        id: question.id,
        question: question.question_text,
        options: question.training_question_options?.map((option) => option.option_text) || [],
        correctAnswer: question.training_question_options?.findIndex((option) => option.is_correct) || 0,
        points: question.points || 1,
      })) || [];

    // Formato final para la respuesta
    const formattedTraining = {
      id: trainingData.id,
      title: trainingData.title,
      description: trainingData.description,
      createdDate: trainingData.created_at ? new Date(trainingData.created_at).toISOString().split('T')[0] : '',
      tags,
      materials,
      evaluation: {
        questions,
        passingScore: trainingData.passing_score || 70,
      },
      employees: {
        completed: completedEmployees,
        pending: pendingEmployees,
        total: {
          completedCount: completedEmployees.length,
          totalEmployees: activeEmployees?.length || 0,
        },
      },
      status: trainingData.status ,
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
  data: { title: string; description: string; passing_score: number; status: "Borrador" | "Archivado" | "Publicado" | null }
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
        passing_score: data.passing_score,
        updated_at: new Date().toISOString(),
        status: data.status,
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
 * Elimina los materiales existentes y añade los nuevos
 */
export const updateTrainingMaterials = async (
  trainingId: string,
  materials: Array<{
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

    // Primero eliminar todos los materiales existentes
    const { error: deleteError } = await supabase.from('training_materials').delete().eq('training_id', trainingId);

    if (deleteError) {
      console.error('Error al eliminar materiales existentes:', deleteError);
      return { success: false, error: `Error al eliminar materiales: ${deleteError.message}` };
    }

    // Si no hay nuevos materiales, terminar aquí
    if (materials.length === 0) {
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

    revalidatePath(`/dashboard/hse/detail/${trainingId}`);

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
      .select('*')
      .eq('training_id', trainingId);

    if (getQuestionsError) {
      console.error('Error al obtener preguntas existentes:', getQuestionsError);
      return {
        success: false,
        error: `Error al obtener preguntas existentes: ${getQuestionsError.message}`,
      };
    }

    // 2. Desactivar todas las preguntas (luego activaremos solo las que mantengamos o creemos nuevas)
    const { error: deactivateError } = await supabase
      .from('training_questions')
      .update({ is_active: false })
      .eq('training_id', trainingId);

    if (deactivateError) {
      console.error('Error al desactivar preguntas:', deactivateError);
      return {
        success: false,
        error: `Error al desactivar preguntas: ${deactivateError.message}`,
      };
    }

    // 3. Función para actualizar opciones de una pregunta
    const updateQuestionOptions = async (questionId: string, options: string[], correctAnswer: number) => {
      try {
        // Eliminar todas las opciones existentes para esta pregunta
        const { error: deleteOptionsError } = await supabase
          .from('training_question_options')
          .delete()
          .eq('question_id', questionId);

        if (deleteOptionsError) {
          console.error(`Error al eliminar opciones antiguas para pregunta ${questionId}:`, deleteOptionsError);
          throw deleteOptionsError;
        }

        // Insertar las nuevas opciones
        const optionsInsert = options.map((option: string, index: number) => ({
          question_id: questionId,
          option_text: option,
          is_correct: index === correctAnswer,
          order_index: index,
        }));

        const { error: insertOptionsError } = await supabase.from('training_question_options').insert(optionsInsert);

        if (insertOptionsError) {
          console.error(`Error al insertar nuevas opciones para pregunta ${questionId}:`, insertOptionsError);
          throw insertOptionsError;
        }

        return true;
      } catch (error: any) {
        console.error(`Error al actualizar opciones para pregunta ${questionId}:`, error);
        throw new Error(`Error al actualizar opciones: ${error.message}`);
      }
    };

    // 4. Preparar arrays para inserción
    const questionInserts: any[] = [];
    const pendingOptionInserts: any[] = [];

    // 5. Procesar cada pregunta
    for (const [index, question] of questions.entries()) {
      // Comprobar si la pregunta tiene un ID y existe en la base de datos
      if (question.id && existingQuestions?.some((eq) => eq.id === question.id)) {
        const existingQuestion = existingQuestions.find((eq) => eq.id === question.id);

        if (existingQuestion) {
          // Reactivar la pregunta si estaba inactiva
          if (!existingQuestion.is_active) {
            const { error: reactivateError } = await supabase
              .from('training_questions')
              .update({ is_active: true })
              .eq('id', existingQuestion.id);

            if (reactivateError) {
              console.error(`Error al reactivar pregunta ${existingQuestion.id}:`, reactivateError);
              return {
                success: false,
                error: `Error al reactivar pregunta: ${reactivateError.message}`,
              };
            }
          }

          // Actualizar la pregunta si hay cambios
          if (existingQuestion.question_text !== question.question) {
            const { error: updateError } = await supabase
              .from('training_questions')
              .update({
                question_text: question.question,
                points: 1,
                order_index: index,
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
          id: crypto.randomUUID(), // Dejamos que la BD genere el UUID
          training_id: trainingId,
          question_text: question.question,
          question_type: 'multiple_choice',
          points: 1,
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

    // 6. Insertar las nuevas preguntas si hay
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

      // 7. Insertar las opciones de las nuevas preguntas
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
export const updateTrainingTags = async (trainingId: string, tagNames: string[]) => {
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
    if (tagNames.length === 0) {
      return { success: true, data: [] };
    }

    // Para cada nombre de etiqueta, buscarla o crearla
    const tagIds = [];
    for (const tagName of tagNames) {
      // Buscar si la etiqueta ya existe
      const { data: existingTags } = await supabase
        .from('training_tags')
        .select('id')
        .eq('name', tagName)
        .eq('company_id', company_id);

      let tagId;

      // Si existe, usar su ID
      if (existingTags && existingTags.length > 0) {
        tagId = existingTags[0].id;
      } else {
        // Si no existe, crear una nueva etiqueta
        const { data: newTag, error: createError } = await supabase
          .from('training_tags')
          .insert({ name: tagName, company_id })
          .select('id');

        if (createError) {
          console.error(`Error al crear etiqueta "${tagName}":`, createError);
          continue;
        }

        tagId = newTag?.[0]?.id;
      }

      if (tagId) {
        tagIds.push(tagId);
      }
    }

    // Crear asignaciones para todas las etiquetas encontradas/creadas
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
    status: "Borrador" | "Archivado" | "Publicado" | null;
    passingScore: number;
    materials: Array<{
      id?: string;
      type: string;
      name: string;
      url: string;
      order: number;
      is_required?: boolean;
      file_size?: number;
    }>;
    questions: Array<{
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
    const basicInfoResult = await updateTrainingBasicInfo(trainingId, {
      title: data.title,
      description: data.description,
      passing_score: data.passingScore,
      status: data.status,
    });

    if (!basicInfoResult.success) {
      return basicInfoResult;
    }

    // Actualizar materiales
    const materialsResult = await updateTrainingMaterials(trainingId, data.materials);
    if (!materialsResult.success) {
      return materialsResult;
    }

    // Actualizar preguntas
    const questionsResult = await updateTrainingQuestions(trainingId, data.questions);
    if (!questionsResult.success) {
      return questionsResult;
    }

    // Actualizar etiquetas
    const tagsResult = await updateTrainingTags(trainingId, data.tags);
    if (!tagsResult.success) {
      return tagsResult;
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
