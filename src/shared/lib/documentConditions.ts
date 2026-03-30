/**
 * Lógica de evaluación de condiciones para tipos de documento.
 *
 * Formato JSON almacenado en document_types.conditions:
 * [{ field: string, values: string[], type: 'enum' | 'relation' }]
 *
 * Lógica:
 * - Si isConditional es false → siempre aplica (return true)
 * - Cada condición es un grupo (por campo)
 * - DENTRO del grupo: OR (el recurso cumple si su valor está en values)
 * - ENTRE grupos: AND (debe cumplir al menos uno de cada grupo no vacío)
 * - Grupos con values vacío no restringen
 * - Para campos BigInt (brand, type_of_vehicle): se convierte a string para comparar
 */

// ============================================
// TIPOS
// ============================================

export interface DocumentCondition {
  field: string; // 'gender', 'guild_id', 'brand', etc.
  values: string[]; // valores seleccionados (strings, BigInt se convierte)
  type: 'enum' | 'relation';
}

// Campos de vehicles que usan BigInt como FK
const BIGINT_FIELDS = ['brand', 'type_of_vehicle'];

// ============================================
// FUNCIONES INTERNAS
// ============================================

/**
 * Obtiene el valor de un campo del recurso como string para comparación.
 * Maneja BigInt, number, null/undefined.
 */
function getFieldValueAsString(resource: Record<string, any>, field: string): string | null {
  const value = resource[field];
  if (value === null || value === undefined) {
    return null;
  }
  // BigInt y number se convierten a string
  if (typeof value === 'bigint' || typeof value === 'number') {
    return String(value);
  }
  return String(value);
}

/**
 * Evalúa si un recurso cumple un array de condiciones.
 * Lógica: AND entre grupos, OR dentro de cada grupo.
 */
function evaluateConditions(
  conditions: DocumentCondition[],
  isConditional: boolean,
  resource: Record<string, any>
): boolean {
  // Si no es condicional, siempre aplica
  if (!isConditional) {
    return true;
  }

  // Filtrar solo condiciones con valores (los vacíos no restringen)
  const activeConditions = conditions.filter((c) => c.values.length > 0);

  // Sin condiciones activas = aplica a todos
  if (activeConditions.length === 0) {
    return true;
  }

  // AND entre todos los grupos: todos deben pasar
  return activeConditions.every((condition) => {
    const fieldValue = getFieldValueAsString(resource, condition.field);

    // Si el recurso no tiene valor en este campo, no cumple la condición
    if (fieldValue === null) {
      return false;
    }

    // OR: el valor del recurso debe estar en el array de values
    return condition.values.includes(fieldValue);
  });
}

// ============================================
// FUNCIONES PÚBLICAS
// ============================================

/**
 * Verifica si un tipo de documento aplica a un empleado específico.
 *
 * @param conditions - Array de condiciones del tipo de documento
 * @param isConditional - Si el tipo es condicional (campo special)
 * @param employee - Datos del empleado (Record con campos como gender, guild_id, etc.)
 * @returns true si el documento aplica al empleado
 *
 * @example
 * ```ts
 * const conditions = [
 *   { field: 'gender', values: ['Masculino'], type: 'enum' },
 *   { field: 'guild_id', values: ['uuid-1'], type: 'relation' },
 * ];
 * checkDocumentAppliesToEmployee(conditions, true, employee); // true si es masculino Y del gremio uuid-1
 * ```
 */
export function checkDocumentAppliesToEmployee(
  conditions: DocumentCondition[],
  isConditional: boolean,
  employee: Record<string, any>
): boolean {
  return evaluateConditions(conditions, isConditional, employee);
}

/**
 * Verifica si un tipo de documento aplica a un equipo específico.
 *
 * @param conditions - Array de condiciones del tipo de documento
 * @param isConditional - Si el tipo es condicional (campo special)
 * @param vehicle - Datos del vehículo (Record con campos como brand, type_of_vehicle)
 * @returns true si el documento aplica al equipo
 */
export function checkDocumentAppliesToEquipment(
  conditions: DocumentCondition[],
  isConditional: boolean,
  vehicle: Record<string, any>
): boolean {
  return evaluateConditions(conditions, isConditional, vehicle);
}

/**
 * Filtra tipos de documento que aplican a un empleado específico.
 *
 * @param documentTypes - Lista de tipos de documento
 * @param employee - Datos del empleado
 * @param getConditions - Función que extrae conditions e isConditional de cada tipo
 * @returns Lista filtrada de tipos de documento que aplican
 */
export function filterDocumentTypesForEmployee<T>(
  documentTypes: T[],
  employee: Record<string, any>,
  getConditions: (dt: T) => { conditions: DocumentCondition[]; isConditional: boolean }
): T[] {
  return documentTypes.filter((dt) => {
    const { conditions, isConditional } = getConditions(dt);
    return checkDocumentAppliesToEmployee(conditions, isConditional, employee);
  });
}

/**
 * Filtra tipos de documento que aplican a un equipo específico.
 *
 * @param documentTypes - Lista de tipos de documento
 * @param vehicle - Datos del vehículo
 * @param getConditions - Función que extrae conditions e isConditional de cada tipo
 * @returns Lista filtrada de tipos de documento que aplican
 */
export function filterDocumentTypesForEquipment<T>(
  documentTypes: T[],
  vehicle: Record<string, any>,
  getConditions: (dt: T) => { conditions: DocumentCondition[]; isConditional: boolean }
): T[] {
  return documentTypes.filter((dt) => {
    const { conditions, isConditional } = getConditions(dt);
    return checkDocumentAppliesToEquipment(conditions, isConditional, vehicle);
  });
}
