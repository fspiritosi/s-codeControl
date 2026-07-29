/**
 * Datos del acta de registro de capacitación (tsk-540).
 *
 * Los temas y los métodos de evaluación son conjuntos fijos que vienen del
 * formulario en papel que usa la empresa, no etiquetas libres: por eso son
 * enums en la base y no `training_tags`.
 */

export const TRAINING_TOPICS = [
  { value: 'SEGURIDAD_VIAL', label: 'Seguridad vial' },
  { value: 'SEGURIDAD_HIGIENE', label: 'Seguridad e higiene' },
  { value: 'SALUD', label: 'Salud' },
  { value: 'MEDIO_AMBIENTE', label: 'Medio ambiente' },
] as const;

export const TRAINING_EVALUATION_METHODS = [
  { value: 'ESCRITA_ORAL', label: 'Escrita / Oral' },
  { value: 'ENCUESTA_AUDITORIA', label: 'Encuesta / Auditoría' },
  { value: 'SUPERVISION_INSPECCION', label: 'Supervisión / Inspecciones' },
  { value: 'EVALUACION_DESEMPENO', label: 'Evaluación de desempeño' },
] as const;

export type TrainingTopic = (typeof TRAINING_TOPICS)[number]['value'];
export type TrainingEvaluationMethod = (typeof TRAINING_EVALUATION_METHODS)[number]['value'];

export const DEFAULT_TRAINING_LOCATION = 'Capacitación Online';

export type TrainingRecordData = {
  dictated_at: string | null;
  location: string | null;
  instructor_id: string | null;
  estimated_duration_minutes: number | null;
  topics: TrainingTopic[];
  teaching_resources: string | null;
  material_delivered: boolean | null;
  material_delivered_detail: string | null;
  evaluation_methods: TrainingEvaluationMethod[];
  effectiveness_method: string | null;
  requires_new_actions: boolean | null;
  new_actions_detail: string | null;
  validity_months: number | null;
};

export const EMPTY_TRAINING_RECORD: TrainingRecordData = {
  dictated_at: null,
  location: DEFAULT_TRAINING_LOCATION,
  instructor_id: null,
  estimated_duration_minutes: null,
  topics: [],
  teaching_resources: null,
  material_delivered: null,
  material_delivered_detail: null,
  evaluation_methods: [],
  effectiveness_method: null,
  requires_new_actions: null,
  new_actions_detail: null,
  validity_months: null,
};

export function topicLabel(value: string): string {
  return TRAINING_TOPICS.find((t) => t.value === value)?.label ?? value;
}

export function evaluationMethodLabel(value: string): string {
  return TRAINING_EVALUATION_METHODS.find((m) => m.value === value)?.label ?? value;
}

/**
 * Campos que exige el acta para poder publicar la capacitación.
 *
 * "Método de evaluación de la eficacia" y "¿Se requieren nuevas acciones?" NO
 * entran acá: el referente de HSE los carga después de dictada la capacitación,
 * así que exigirlos al publicar impediría dictarla. Se validan al descargar la
 * planilla (ver validateForRecordDownload).
 */
export function validateForPublish(data: TrainingRecordData): string[] {
  const errors: string[] = [];

  if (!data.dictated_at) errors.push('Falta la fecha en que se dicta la capacitación');
  if (!data.location?.trim()) errors.push('Falta el lugar');
  if (!data.instructor_id) errors.push('Falta seleccionar el capacitador');
  if (!data.estimated_duration_minutes || data.estimated_duration_minutes <= 0) {
    errors.push('Falta la duración estimada');
  }
  if (!data.topics.length) errors.push('Falta seleccionar al menos un tema incluido');
  if (!data.teaching_resources?.trim()) errors.push('Faltan los recursos didácticos utilizados');
  if (data.material_delivered === null) errors.push('Falta indicar si se entregó material');
  if (data.material_delivered && !data.material_delivered_detail?.trim()) {
    errors.push('Falta detallar qué material se entregó');
  }
  if (!data.evaluation_methods.length) errors.push('Falta seleccionar el tipo de evaluación');

  return errors;
}

/**
 * Campos que carga el referente de HSE una vez dictada la capacitación. La
 * planilla en papel aclara que no se deben dejar campos en blanco, así que se
 * avisa antes de descargarla.
 */
export function validateForRecordDownload(data: TrainingRecordData): string[] {
  const errors: string[] = [...validateForPublish(data)];

  if (!data.effectiveness_method?.trim()) errors.push('Falta el método de evaluación de la eficacia');
  if (data.requires_new_actions === null) errors.push('Falta indicar si se requieren nuevas acciones');
  if (data.requires_new_actions && !data.new_actions_detail?.trim()) {
    errors.push('Falta indicar cuáles son las nuevas acciones');
  }

  return errors;
}
