// Configuración base de propiedades disponibles para filtrar
export const baseEmployeePropertiesConfig = [
  // Propiedades simples
  { label: 'Sexo', accessor_key: 'gender' },
  { label: 'Estado Civil', accessor_key: 'marital_status' },
  { label: 'Nacionalidad', accessor_key: 'nationality' },
  { label: 'Tipo de DNI', accessor_key: 'document_type' },
  { label: 'Nivel de Educación', accessor_key: 'level_of_education' },
  { label: 'Estado', accessor_key: 'status' },
  { label: 'Tipo de Contrato', accessor_key: 'type_of_contract' },
  // Propiedades de objetos anidados
  { label: 'País de Nacimiento', accessor_key: 'province' },
  { label: 'Provincia', accessor_key: 'province' },
  { label: 'Posición Jerárquica', accessor_key: 'hierarchical_position' },
  { label: 'Diagrama de Flujo de Trabajo', accessor_key: 'workflow_diagram' },
  { label: 'Gremio', accessor_key: 'guild' },
  { label: 'Convenio', accessor_key: 'covenant' },
  { label: 'Categoría', accessor_key: 'category' },
  { label: 'Posición en la Empresa', accessor_key: 'company_position' },
  // Array de objetos anidados
  { label: 'Clientes', accessor_key: 'contractor_employee' },
];

// Configuración base de propiedades disponibles para filtrar vehículos
export const baseVehiclePropertiesConfig = [
  { label: 'Marca', accessor_key: 'brand' },
  { label: 'Modelo', accessor_key: 'model' },
  { label: 'Tipo', accessor_key: 'type' },
  { label: 'Categoría Vehículo', accessor_key: 'types_of_vehicles' },
  { label: 'Cliente', accessor_key: 'contractor_equipment' },
];

//  Mapeo entre accessor_key y metadatos de relación para futura construcción de SQL
export const relationMeta: Record<string, any> = {
  contractor_employee: {
    relation_type: 'many_to_many',
    relation_table: 'contractor_employee',
    column_on_employees: 'id',
    column_on_relation: 'employee_id',
    filter_column: 'contractor_id',
  },
  guild: {
    relation_type: 'one_to_many',
    filter_column: 'guild_id',
  },
  covenant: {
    relation_type: 'one_to_many',
    filter_column: 'covenants_id',
  },
  category: {
    relation_type: 'one_to_many',
    filter_column: 'category_id',
  },
  province: {
    relation_type: 'one_to_many',
    filter_column: 'province',
  },
  city: {
    relation_type: 'one_to_many',
    filter_column: 'city',
  },
  hierarchical_position: {
    relation_type: 'one_to_many',
    filter_column: 'hierarchical_position',
  },
  workflow_diagram: {
    relation_type: 'one_to_many',
    filter_column: 'workflow_diagram',
  },
  company_position: {
    relation_type: 'one_to_many',
    filter_column: 'company_position',
  },
  birthplace: {
    relation_type: 'one_to_many',
    filter_column: 'birthplace',
  },
  //EQUIPOS
  contractor_equipment: {
    relation_type: 'many_to_many',
    relation_table: 'contractor_equipment',
    column_on_vehicles: 'id',
    column_on_relation: 'equipment_id',
    filter_column: 'contractor_id',
  },
  type: {
    relation_type: 'one_to_many',
    filter_column: 'type',
  },
  brand: {
    relation_type: 'one_to_many',
    filter_column: 'brand',
  },
  model: {
    relation_type: 'one_to_many',
    filter_column: 'model',
  },
  types_of_vehicles: {
    relation_type: 'one_to_many',
    filter_column: 'types_of_vehicles',
  },
};

export const defaultValues = [
  {
    id: 'multiresource',
    label: 'Es multirecurso?',
    tooltip: 'Si el documento aplica a mas de una persona o equipo',
  },
  {
    id: 'mandatory',
    label: 'Es mandatorio?',
    tooltip: 'Si el documento es obligatorio, se crearan alertas para su cumplimiento',
  },
  { id: 'explired', label: 'Expira?', tooltip: 'Si el documento expira' },
  {
    id: 'special',
    label: 'Es especial?',
    tooltip: 'Si el documento requiere documentacion especial',
  },
  {
    id: 'is_it_montlhy',
    label: 'Es mensual?',
    tooltip: 'Si el documento vence mensualmente',
  },
  {
    id: 'private',
    label: 'Es privado?',
    tooltip: 'Si el documento es privado no sera visible para los usuarios con el rol invitado',
  },
  {
    id: 'down_document',
    label: 'Es un documento de baja?',
    tooltip: 'Si el documento es de baja solo se pedira cuando el empleado este dado de baja',
  },
];
