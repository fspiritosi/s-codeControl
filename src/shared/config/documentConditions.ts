/**
 * Configuración de campos disponibles como condiciones para tipos de documento.
 *
 * Cada condición define un campo del empleado o equipo que puede usarse
 * para restringir a quién aplica un tipo de documento condicional.
 */

// ============================================
// TIPOS
// ============================================

export interface ConditionFieldConfig {
  field: string; // nombre del campo en employees/vehicles
  label: string; // label para la UI
  type: 'enum' | 'relation';
  // Para enum: valores disponibles
  enumValues?: { value: string; label: string }[];
  // Para relation: nombre de la server action para obtener opciones
  catalogAction?: string;
}

// ============================================
// MAPEO DE ENUMS (valores de Prisma)
// ============================================

export const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Femenino', label: 'Femenino' },
  { value: 'No_Declarado', label: 'No Declarado' },
];

export const CONTRACT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Periodo_de_prueba', label: 'Período de prueba' },
  { value: 'A_tiempo_indeterminado', label: 'A tiempo indeterminado' },
  { value: 'Plazo_fijo', label: 'Plazo fijo' },
];

// ============================================
// CONDICIONES POR TIPO
// ============================================

export const EMPLOYEE_CONDITIONS: ConditionFieldConfig[] = [
  {
    field: 'gender',
    label: 'Género',
    type: 'enum',
    enumValues: GENDER_OPTIONS,
  },
  {
    field: 'type_of_contract',
    label: 'Tipo de contrato',
    type: 'enum',
    enumValues: CONTRACT_TYPE_OPTIONS,
  },
  {
    field: 'hierarchical_position',
    label: 'Posición jerárquica',
    type: 'relation',
    catalogAction: 'fetchHierarchy',
  },
  {
    field: 'category_id',
    label: 'Categoría',
    type: 'relation',
    catalogAction: 'fetchAllCategories',
  },
  {
    field: 'covenants_id',
    label: 'Convenio',
    type: 'relation',
    catalogAction: 'fetchAllCovenants',
  },
  {
    field: 'guild_id',
    label: 'Gremio',
    type: 'relation',
    catalogAction: 'fetchAllGuilds',
  },
];

export const EQUIPMENT_CONDITIONS: ConditionFieldConfig[] = [
  {
    field: 'brand',
    label: 'Marca',
    type: 'relation',
    catalogAction: 'fetchAllBrandVehicles',
  },
  {
    field: 'type_of_vehicle',
    label: 'Tipo de vehículo',
    type: 'relation',
    catalogAction: 'fetchAllTypesOfVehicles',
  },
];

// ============================================
// HELPERS
// ============================================

/**
 * Obtiene la configuración de condiciones según el tipo de applies del documento.
 * 'Empresa' no soporta condiciones (retorna array vacío).
 */
export function getConditionsForApplies(
  applies: 'Persona' | 'Equipos' | 'Empresa'
): ConditionFieldConfig[] {
  switch (applies) {
    case 'Persona':
      return EMPLOYEE_CONDITIONS;
    case 'Equipos':
      return EQUIPMENT_CONDITIONS;
    case 'Empresa':
      return [];
    default:
      return [];
  }
}

/**
 * Verifica si un tipo de applies soporta condiciones
 */
export function supportsConditions(applies: 'Persona' | 'Equipos' | 'Empresa'): boolean {
  return applies !== 'Empresa';
}
