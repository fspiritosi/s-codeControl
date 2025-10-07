'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  fetchAllCategories,
  // fetchCompanyPositions,
  fetchCovenants,
  fetchCustomers,
  fetchGuilds,
  fetchHierrarchicalPositions,
  fetchProvinces,
  // fetchTypeOfContracts,
  fetchTypeVehicles,
  fetchTypesOfVehicles,
  fetchVehicleBrands,
  fetchVehicleModels,
  fetchWorkDiagrams,
} from '@/app/server/GET/actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RpcFilter, fetchEmployeesWithFilters, fetchVehiclesWithFilters } from '@/lib/documentFilters';
import { handleSupabaseError } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import Cookies from 'js-cookie';
import { PlusCircle, Truck, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../supabase/supabase';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { MultiSelect } from './ui/multi-select-combobox-condition';
import { ScrollArea } from './ui/scroll-area';

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
  // Propiedades de objetos anidados - Se manejarán especialmente en getUniqueValues
  { label: 'País de Nacimiento', accessor_key: 'province' }, // Es un objeto con propiedad name
  { label: 'Provincia', accessor_key: 'province' }, // Es un objeto con propiedad name
  { label: 'Posición Jerárquica', accessor_key: 'hierarchical_position' }, // Es un objeto con propiedad name
  { label: 'Diagrama de Flujo de Trabajo', accessor_key: 'workflow_diagram' }, // Es un objeto con propiedad name
  { label: 'Gremio', accessor_key: 'guild' }, // Puede ser null o un objeto con propiedad name
  { label: 'Convenio', accessor_key: 'covenant' }, // Puede ser null o un objeto con propiedad name
  { label: 'Categoría', accessor_key: 'category' }, // Puede ser null o un objeto con propiedad name
  { label: 'Posición en la Empresa', accessor_key: 'company_position' }, // Puede ser null o un objeto con propiedad name

  // Array de objetos anidados
  { label: 'Clientes', accessor_key: 'contractor_employee' }, // Array de objetos donde cada uno tiene customers.name
];

// Configuración base de propiedades disponibles para filtrar vehículos
export const baseVehiclePropertiesConfig = [
  { label: 'Marca', accessor_key: 'brand' },
  { label: 'Modelo', accessor_key: 'model' },
  { label: 'Tipo', accessor_key: 'type' },
  { label: 'Categoría Vehículo', accessor_key: 'types_of_vehicles' },
  { label: 'Cliente', accessor_key: 'contractor_equipment' },
];

export function getVehiclePropertyValue(vehicle: any, accessor_key: string): string {
  const parts = accessor_key.split('.');
  let value = parts.reduce((acc, key) => (acc ? acc[key] : undefined), vehicle);
  let result = '';

  if (accessor_key === 'contractor_equipment' && Array.isArray(vehicle.contractor_equipment)) {
    const names = vehicle.contractor_equipment.map((r: any) => r.contractor_id?.name).filter(Boolean);
    return names.join(',');
  }

  if (value && typeof value === 'object' && 'name' in value) {
    result = String(value.name).trim();
  } else {
    result = value != null ? String(value).trim() : '';
  }
  return result;
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .trim();
}

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
    column_on_vehicles: 'id', // este es el id de vehicles
    column_on_relation: 'equipment_id', // este es el campo en contractor_equipment que apunta a vehicles
    filter_column: 'contractor_id', // este es el campo en contractor_equipment que apunta al cliente
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
export function getEmployeePropertyValue(employee: any, accessor_key: string): string {
  let value = employee[accessor_key as keyof typeof employee];
  let result = '';

  // Caso especial: contractor_employee (array de objetos cliente)
  if (accessor_key === 'contractor_employee' && Array.isArray(value)) {
    // Extraer nombres de clientes del array contractor_employee
    const clientNames = value
      .filter((item) => item && item.customers && item.customers.name)
      .map((item) => item.customers.name);

    // Si hay clientes, unirlos en un string; si no, valor vacío
    result = clientNames.length > 0 ? clientNames.join(',') : '';
  }
  // Maneja diferentes tipos de valores de propiedades
  else if (value && typeof value === 'object' && 'name' in value) {
    // Objetos con propiedad name (provincia, ciudad, etc.)
    result = value.name ? String(value.name).trim() : '';
  } else if (typeof value === 'boolean') {
    // Valores booleanos
    result = value ? 'Sí' : 'No';
  } else if (value === null && ['guild', 'covenant', 'category', 'company_position'].includes(accessor_key)) {
    // Propiedades especiales que pueden ser null
    result = 'No asignado';
  } else {
    // Otros tipos de valores
    result = value !== undefined && value !== null ? String(value).trim() : '';
  }

  return result;
}
const defaultValues = [
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
export type Condition = {
  property: string;
  values: string[];
  id: string;
};
export default function NewDocumentType({
  codeControlClient,
  optionChildrenProp,
}: {
  codeControlClient?: boolean;
  optionChildrenProp: string;
}) {
  // const employeeMockValues = use(employeeMockValuesPromise);
  // const vehicleMockValues = use(vehicleMockValuesPromise);
  // const employees = use(employeesPromise);
  // const vehicles = use(vehiclesPromise);
  // const employeeMockValues: any = [];
  // const vehicleMockValues: any = [];
  // const employees: any = [];
  // const vehicles: any = [];

  const [special, setSpecial] = useState(false);
  const router = useRouter();
  const fetchDocumentTypes = useCountriesStore((state) => state.documentTypes);
  const fetchDocuments = useLoggedUserStore((state) => state.documetsFetch);
  const [items, setItems] = useState(defaultValues);

  // Devuelve el valor de la propiedad del vehículo

  // Las configuraciones y listas filtradas ahora se calculan con useMemo para mejor rendimiento

  const [conditions, setConditions] = useState<Condition[]>([]);

  const employeePropertiesConfig = baseEmployeePropertiesConfig;

  // Líneas 315-325:
  const vehiclePropertiesConfig = baseVehiclePropertiesConfig;

  const selectOptions = optionChildrenProp === 'all' ? 'Personas, Equipos o Empresa' : optionChildrenProp;

  const isOptional = items.length < 5;
  const FormSchema = z.object({
    name: z
      .string({ required_error: 'Este campo es requerido' })
      .min(3, { message: 'El nombre debe contener mas de 3 caracteres' })
      .max(50, { message: 'El nombre debe contener menos de 50 caracteres' }),
    applies: z.enum(['Persona', 'Equipos', 'Empresa'], {
      required_error: 'Este campo es requerido',
    }),
    multiresource: isOptional
      ? z.boolean().optional()
      : z.boolean({
        required_error: 'Se debe seleccionar una opcion',
      }),
    mandatory: isOptional ? z.boolean().optional() : z.boolean({ required_error: 'Se debe seleccionar una opcion' }),
    explired: z.boolean({ required_error: 'Se debe seleccionar una opcion' }),
    special: isOptional ? z.boolean().optional() : z.boolean({ required_error: 'Este campo es requerido' }),
    description: z.string().optional(),
    is_it_montlhy: z.boolean({ required_error: 'Este campo es requerido' }),
    private: z.boolean({ required_error: 'Este campo es requerido' }),
    down_document: z.boolean({ required_error: 'Este campo es requerido' }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      multiresource: false,
      mandatory: false,
      explired: false,
      special: false,
      down_document: false,
      private: false,
      is_it_montlhy: false,
      applies: selectOptions === 'all' ? undefined : (selectOptions as 'Empresa' | 'Persona' | 'Equipos' | undefined),
    },
  });

  useEffect(() => {
    if (selectOptions === 'Empresa') {
      setItems(defaultValues.filter((e) => e.id === 'explired' || e.id === 'is_it_montlhy' || e.id === 'private'));
    }
  }, [selectOptions]);

  /**
   * Prepara las condiciones para almacenar en la base de datos
   * Convierte el estado de conditions a un formato serializable
   * e identifica propiedades que son relaciones
   */
  function prepareConditionsForStorage() {
    // Ignorar condiciones vacías
    const validConditions = conditions.filter((c) => c.property && c.values && c.values.length > 0);

    if (validConditions.length === 0) {
      return null;
    }

    return validConditions
      .map((condition) => {
        // Encuentra la configuración de esta propiedad
        const propConfig = employeePropertiesConfig.find((p) => p.label === condition.property);
        if (!propConfig) return null;

        // Determina si es una relación (propiedades que son objetos o arrays)
        const isRelation = [
          'contractor_employee',
          'province',
          'hierarchical_position',
          'category',
          'guild',
          'covenant',
          'city',
          'company_position',
        ].includes(propConfig.accessor_key);

        // Tipo especial para contractor_employee (array de relaciones)
        const relationsColumns = ['contractor_employee'];
        const isArrayRelation = relationsColumns.includes(propConfig.accessor_key);

        let reference_values: { id: string; value: string }[] = [];
        // if (isRelation) {
        //   // Buscar FIRST employee que contenga el valor para obtener su ID (si está presente)
        //   reference_values = condition.values.map((value) => {
        //     const emp = employees.find((e) => {
        //       const empVal = getEmployeePropertyValue(e, propConfig.accessor_key);
        //       return empVal?.toLowerCase() === value.toLowerCase();
        //     });
        //     // Para relaciones 1:N el objeto suele estar directamente en la propiedad
        //     const relatedObj = (emp ? (emp[propConfig.accessor_key as keyof EmployeeDetailed] as any) : null) as any;
        //     const relatedId = relatedObj?.id ?? relatedObj ?? '';

        //     return {
        //       id: relatedId[0]?.customers?.id ? relatedId[0].customers.id : relatedId,
        //       value,
        //     };
        //   });
        // }

        // Añadir metadatos de relación para uso en BD
        const meta = relationMeta[propConfig.accessor_key] || null;

        return {
          property_key: propConfig.accessor_key,
          values: condition.values,
          reference_values: reference_values,
          ids: reference_values.length ? reference_values.map((r) => r.id) : condition.values, // Para direct, usar los valores mismos
          is_relation: isRelation,
          is_array_relation: isArrayRelation,
          relation_type: meta ? meta.relation_type : 'direct',
          relation_table: meta?.relation_table || null,
          column_on_employees: meta?.column_on_employees || null,
          column_on_relation: meta?.column_on_relation || null,
          filter_column: meta?.filter_column || propConfig.accessor_key,
          property_label: condition.property,
        };
      })
      .filter(Boolean); // Eliminar nulls
  }

  // Serializar condiciones de vehículos para almacenamiento
  function prepareVehicleConditionsForStorage() {
    const validConditions = conditions.filter((c) => c.property && c.values.length);
    if (validConditions.length === 0) {
      return null;
    }

    // Definir relaciones (igual que en empleados)
    const relationKeys = ['contractor_equipment', 'brand', 'model', 'type', 'types_of_vehicles'];
    const arrayRelationKeys = ['contractor_equipment'];

    return validConditions
      .map((condition) => {
        const propConfig = vehiclePropertiesConfig.find((p) => p.label === condition.property);
        if (!propConfig) return null;

        const isRelation = relationKeys.includes(propConfig.accessor_key);
        const isArrayRelation = arrayRelationKeys.includes(propConfig.accessor_key);

        let reference_values: { id: string; value: string }[] = [];
        if (isRelation) {
          // reference_values = condition.values.map((value) => {
          //   const veh = vehicles.find((v) => {
          //     const vehVal = getVehiclePropertyValue(v, propConfig.accessor_key);
          //     return vehVal?.toLowerCase() === value.toLowerCase();
          //   }) as any;
          //   // Para contractor_equipment es array, para otros puede ser objeto
          //   if (isArrayRelation && veh && Array.isArray(veh.contractor_equipment)) {
          //     // Busca el contractor_id correspondiente al valor
          //     const contractor = veh.contractor_equipment.find(
          //       (r: any) => r.contractor_id?.name?.toLowerCase() === value.toLowerCase()
          //     );
          //     return { id: contractor?.contractor_id?.id || '', value };
          //   } else if (veh && propConfig.accessor_key.includes('.')) {
          //     // Para relaciones 1:N anidadas (ej: brand.name)
          //     const [main, sub] = propConfig.accessor_key.split('.');
          //     return { id: veh[main as any]?.id || '', value };
          //   } else if (veh && veh[propConfig.accessor_key]) {
          //     return { id: veh[propConfig.accessor_key]?.id || '', value };
          //   }
          //   return { id: '', value };
          // });
        }

        const meta = relationMeta[propConfig.accessor_key] || null;

        return {
          property_key: propConfig.accessor_key,
          values: condition.values,
          ids: reference_values.length ? reference_values.map((r) => r.id) : condition.values,
          is_relation: !!meta,
          is_array_relation: isArrayRelation,
          relation_type: meta?.relation_type || 'direct',
          relation_table: meta?.relation_table || null,
          column_on_vehicles: meta?.column_on_vehicles || null,
          column_on_relation: meta?.column_on_relation || null,
          filter_column: meta?.filter_column || propConfig.accessor_key,
        };
      })
      .filter(Boolean);
  }

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    // Convertir las condiciones a formato serializable
    const serializedConditions =
      form.getValues('applies') === 'Equipos' ? prepareVehicleConditionsForStorage() : prepareConditionsForStorage();

    const company_id = Cookies.get('actualComp');

    const formattedValues = {
      ...values,
      name: formatName(values.name),
      description: formatDescription(values.description),
      company_id: company_id,
      multiresource: isOptional ? false : values.multiresource,
      mandatory: isOptional ? true : values.mandatory,
      special: isOptional ? false : values.special,
      down_document: isOptional ? false : values.down_document,
      private: values.private,
      // Añadir las condiciones serializadas
      conditions: serializedConditions ? serializedConditions : null,
    };

    console.log(formattedValues, 'formattedValues');

    toast.promise(
      async () => {
        const { data, error } = await supabase.from('document_types').insert(formattedValues).select();

        if (error) {
          console.error(error);
          throw new Error(handleSupabaseError(error.message));
        }
      },
      {
        loading: 'Creando documento...',
        success: (data) => {
          fetchDocumentTypes(useLoggedUserStore.getState().actualCompany?.id || '');
          fetchDocuments();
          router.refresh();
          if (codeControlClient) {
            document.getElementById('close_document_modal')?.click();
            return 'El documento se ha creado correctamente';
          } else {
            router.push('/auditor');
            return 'El documento se ha creado correctamente';
          }
        },
        error: (error) => {
          return error;
        },
      }
    );
  }

  function formatName(name: string): string {
    // Capitalize first letter and convert the rest to lowercase
    return name.charAt(0)?.toUpperCase() + name.slice(1).toLowerCase();
  }

  function formatDescription(description: string | undefined): string | undefined {
    if (description) {
      // Capitalize first letter and convert the rest to lowercase
      return description.charAt(0)?.toUpperCase() + description.slice(1).toLowerCase();
    }
    return description;
  }

  const [down, setDown] = useState(false);
  const [showEmployeePreview, setShowEmployeePreview] = useState(false);
  const [showVehiclePreview, setShowVehiclePreview] = useState(false);

  // ========== Contadores con RPC (IMPLEMENTACIÓN PRINCIPAL) ==========
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [vehicleCount, setVehicleCount] = useState<number | null>(null);
  const [previewEmployees, setPreviewEmployees] = useState<any[]>([]);
  const [previewVehicles, setPreviewVehicles] = useState<any[]>([]);

  // ========== Lazy Loading de Opciones (IMPLEMENTACIÓN PRINCIPAL) ==========
  type OptionItem = { value: string; label: string };
  const [optionsCache, setOptionsCache] = useState<Record<string, OptionItem[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});
  const [isCalculatingCount, setIsCalculatingCount] = useState(false);

  // AbortController para cancelar requests en curso
  const abortControllerRef = useRef<AbortController | null>(null);

  // ========== Función para cargar opciones bajo demanda (IMPLEMENTACIÓN PRINCIPAL) ==========
  const ensureOptionsLoaded = async (accessor_key: string, applies: 'Persona' | 'Equipos') => {
    const cacheKey = `${applies}_${accessor_key}`;

    console.log(`[LAZY LOAD] 🔍 Verificando opciones para: ${accessor_key} (${applies})`);

    // Si ya están cargadas en cache, retornarlas
    if (optionsCache[cacheKey]) {
      console.log(`[LAZY LOAD] ✅ Opciones en cache:`, optionsCache[cacheKey].length, 'opciones');
      return optionsCache[cacheKey];
    }

    // Si ya están cargando, esperar
    if (loadingOptions[cacheKey]) {
      console.log(`[LAZY LOAD] ⏳ Cargando...`);
      return [];
    }

    try {
      setLoadingOptions((prev) => ({ ...prev, [cacheKey]: true }));
      console.log(`[LAZY LOAD] 🚀 Cargando ${accessor_key}...`);

      let options: OptionItem[] = [];

      if (applies === 'Persona') {
        console.log(`[LAZY LOAD] 📞 Fetch individual: ${accessor_key}`);

        switch (accessor_key) {
          case 'workflow_diagram': {
            const data = await fetchWorkDiagrams();
            options = data.map((d) => ({ value: String(d.id), label: d.name }));
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
            break;
          }
          case 'guild': {
            const data = await fetchGuilds();
            options = data.filter((g) => g.name).map((g) => ({ value: String(g.id), label: g.name! }));
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
            break;
          }
          case 'covenant': {
            const data = await fetchCovenants();
            options = data.map((c) => ({ value: String(c.id), label: c.name! }));
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
            break;
          }
          case 'category': {
            const data = await fetchAllCategories();
            options = data.map((c) => ({ value: String(c.id), label: c.name! }));
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
            break;
          }
          case 'hierarchical_position': {
            const data = await fetchHierrarchicalPositions();
            options = data.map((h) => ({ value: String(h.id), label: h.name }));
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
            break;
          }
          case 'contractor_employee': {
            const data = await fetchCustomers();
            options = data.map((c) => ({ value: String(c.id), label: c.name }));
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
            break;
          }
          case 'province': {
            const data = await fetchProvinces();
            options = data.map((p) => ({ value: String(p.id), label: p.name.trim() }));
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
            break;
          }
          // case 'company_position': {
          //   const data = await fetchCompanyPositions();
          //   options = data.filter((p) => p.name).map((p) => ({ value: String(p.id), label: p.name! }));
          //   console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
          //   break;
          // }
          // Propiedades con valores estáticos (value = label para estos casos)
          case 'gender':
            options = [
              { value: 'Masculino', label: 'Masculino' },
              { value: 'Femenino', label: 'Femenino' },
              { value: 'No Declarado', label: 'No Declarado' },
            ];
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones estáticas`);
            break;
          case 'marital_status':
            options = [
              { value: 'Soltero', label: 'Soltero' },
              { value: 'Casado', label: 'Casado' },
              { value: 'Viudo', label: 'Viudo' },
              { value: 'Divorciado', label: 'Divorciado' },
              { value: 'Separado', label: 'Separado' },
            ];
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones estáticas`);
            break;
          case 'nationality':
            options = [
              { value: 'Argentina', label: 'Argentina' },
              { value: 'Extranjero', label: 'Extranjero' },
            ];
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones estáticas`);
            break;
          case 'document_type':
            options = [
              { value: 'DNI', label: 'DNI' },
              { value: 'LE', label: 'LE' },
              { value: 'LC', label: 'LC' },
              { value: 'PASAPORTE', label: 'PASAPORTE' },
            ];
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones estáticas`);
            break;
          case 'level_of_education':
            options = [
              { value: 'Primario', label: 'Primario' },
              { value: 'Secundario', label: 'Secundario' },
              { value: 'Terciario', label: 'Terciario' },
              { value: 'Posgrado', label: 'Posgrado' },
              { value: 'Universitario', label: 'Universitario' },
            ];
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones estáticas`);
            break;
          case 'status':
            options = [
              { value: 'Avalado', label: 'Avalado' },
              { value: 'Completo', label: 'Completo' },
              { value: 'Incompleto', label: 'Incompleto' },
              { value: 'No avalado', label: 'No avalado' },
              { value: 'Completo con doc vencida', label: 'Completo con doc vencida' },
            ];
            break;
          case 'type_of_contract':
            options = [
              { value: 'Período de prueba', label: 'Período de prueba' },
              { value: 'A tiempo indeterminado', label: 'A tiempo indeterminado' },
              { value: 'Plazo fijo', label: 'Plazo fijo' }
            ];
            break;
          // case 'type_of_contract': {
          //   const data = await fetchTypeOfContracts();
          //   options = data.map((c) => ({ value: String(c.id), label: c.name }));
          //   console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
          //   break;
          // }
          default:
            console.warn(`[LAZY LOAD] ⚠️ Desconocido: ${accessor_key}`);
        }
      } else if (applies === 'Equipos') {
        // Cargar SOLO la función específica para vehículos
        console.log(`[LAZY LOAD] 📞 Fetch individual: ${accessor_key}`);

        switch (accessor_key) {
          case 'brand': {
            const data = await fetchVehicleBrands();
            options = data.map((b) => ({ value: String(b.id), label: b.name! }));
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
            break;
          }
          case 'model': {
            const data = await fetchVehicleModels();
            options = data.map((m) => ({ value: String(m.id), label: m.name! }));
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
            break;
          }
          case 'type': {
            const data = await fetchTypeVehicles();
            options = data.map((t) => ({ value: String(t.id), label: t.name! }));
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
            break;
          }
          case 'types_of_vehicles': {
            const data = await fetchTypesOfVehicles();
            options = data.map((t) => ({ value: String(t.id), label: t.name! }));
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
            break;
          }
          case 'contractor_equipment': {
            const data = await fetchCustomers();
            options = data.map((c) => ({ value: String(c.id), label: c.name! }));
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones`);
            break;
          }
          default:
            console.warn(`[LAZY LOAD] ⚠️ Desconocido: ${accessor_key}`);
        }
      }

      // Guardar en cache
      setOptionsCache((prev) => ({ ...prev, [cacheKey]: options }));
      console.log(`[LAZY LOAD] 💾 Cache actualizado: ${options.length} opciones`);

      return options;
    } catch (error) {
      console.error(`[LAZY LOAD] ❌ Error:`, error);
      return [];
    } finally {
      setLoadingOptions((prev) => ({ ...prev, [cacheKey]: false }));
    }
  };

  // ========== Obtener opciones del cache (IMPLEMENTACIÓN PRINCIPAL) ==========
  const getPropertyOptions = (propertyLabel: string, applies: 'Persona' | 'Equipos'): OptionItem[] => {
    const config =
      applies === 'Persona'
        ? employeePropertiesConfig.find((p) => p.label === propertyLabel)
        : vehiclePropertiesConfig.find((p) => p.label === propertyLabel);

    if (!config) {
      return [];
    }

    const cacheKey = `${applies}_${config.accessor_key}`;
    const cached = optionsCache[cacheKey];

    if (cached) {
      return cached;
    }

    return [];
  };

  // ========== Calcular contador con RPC (IMPLEMENTACIÓN PRINCIPAL) ==========
  const computeCountWithRPC = async (updatedConditions?: Condition[]) => {
    const conditionsToUse = updatedConditions || conditions;

    console.log('[RPC COUNT] Calculando con', conditionsToUse.length, 'condiciones');

    if (!special || conditionsToUse.length === 0) {
      console.log('[RPC COUNT] Reseteando contadores');
      // Cancelar request en curso si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setEmployeeCount(null);
      setVehicleCount(null);
      setPreviewEmployees([]);
      setPreviewVehicles([]);
      setIsCalculatingCount(false);
      return;
    }

    const companyId = Cookies.get('actualComp');

    if (!companyId) {
      console.log('[RPC COUNT] Sin company ID');
      return;
    }

    const applies = form.getValues('applies');

    // Cancelar la request anterior si existe
    if (abortControllerRef.current) {
      console.log('[RPC COUNT] ⛔ Abortando request anterior');
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController para esta request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    setIsCalculatingCount(true);

    try {
      if (applies === 'Persona') {
        // Construir filtros RPC usando accessor_key de condiciones
        const rpcFilters: RpcFilter[] = conditionsToUse
          .filter((c) => c.property && c.values.length > 0)
          .map((c) => {
            const config = employeePropertiesConfig?.find((p) => p.label === c.property);
            return config ? { property: config.accessor_key, values: c.values } : null;
          })
          .filter(Boolean) as RpcFilter[];

        console.log('[RPC COUNT] Filtros:', rpcFilters);

        const filtered = await fetchEmployeesWithFilters(companyId, rpcFilters);

        // Verificar si la request fue abortada
        if (signal.aborted) {
          console.log('[RPC COUNT] ⛔ Request abortada (empleados)');
          return;
        }

        console.log('[RPC COUNT] ✅ Encontrados:', filtered.length, 'empleados');

        setEmployeeCount(filtered.length);
        setPreviewEmployees(filtered);
        setIsCalculatingCount(false);
        abortControllerRef.current = null;
      } else if (applies === 'Equipos') {
        const rpcFilters: RpcFilter[] = conditionsToUse
          .filter((c) => c.property && c.values.length > 0)
          .map((c) => {
            const config = vehiclePropertiesConfig?.find((p) => p.label === c.property);
            return config ? { property: config.accessor_key, values: c.values } : null;
          })
          .filter(Boolean) as RpcFilter[];

        console.log('[RPC COUNT] Filtros:', rpcFilters);

        const filtered = await fetchVehiclesWithFilters(companyId, rpcFilters);

        // Verificar si la request fue abortada
        if (signal.aborted) {
          console.log('[RPC COUNT] ⛔ Request abortada (vehículos)');
          return;
        }

        console.log('[RPC COUNT] ✅ Encontrados:', filtered.length, 'vehículos');

        setVehicleCount(filtered.length);
        setPreviewVehicles(filtered);
        setIsCalculatingCount(false);
        abortControllerRef.current = null;
      }
    } catch (error: any) {
      // Si el error es por abort, no hacer nada (es esperado)
      if (error?.name === 'AbortError' || signal.aborted) {
        console.log('[RPC COUNT] 🔄 Request cancelada, continuando con la siguiente');
        return;
      }

      console.error('[RPC COUNT] ❌ Error:', error);
      setIsCalculatingCount(false);
      abortControllerRef.current = null;
    }
  };

  // Actualiza los valores de una condición existente
  const updateConditionValues = (id: string, values: string[]) => {
    const updatedConditions = conditions.map((condition) =>
      condition.id === id ? { ...condition, values } : condition
    );
    setConditions(updatedConditions);

    // Recalcular con RPC cuando cambian los valores
    computeCountWithRPC(updatedConditions);
  };

  // Elimina una condición por su ID
  const removeCondition = (id: string) => {
    const updatedConditions = conditions.filter((condition) => condition.id !== id);
    setConditions(updatedConditions);

    // Recalcular con RPC cuando se elimina una condición
    computeCountWithRPC(updatedConditions);
  };

  const updateCondition = (id: string, field: 'property' | 'value', value: string) => {
    setConditions(
      conditions.map((condition) => {
        if (condition.id === id) {
          return { ...condition, [field]: value };
        }
        return condition;
      })
    );
  };

  // ========== Handler para selección de propiedad (IMPLEMENTACIÓN PRINCIPAL) ==========
  const handlePropertySelect = async (conditionId: string, propertyLabel: string) => {
    console.log(`[LAZY LOAD] 🎯 Propiedad: ${propertyLabel}`);

    // Limpiar valores anteriores de esta condición al cambiar de propiedad
    const updatedConditions = conditions.map((condition) => {
      if (condition.id === conditionId) {
        return { ...condition, property: propertyLabel, values: [] };
      }
      return condition;
    });
    setConditions(updatedConditions);

    // Cargar opciones si no están cargadas
    const applies = form.getValues('applies');
    if (applies === 'Persona' || applies === 'Equipos') {
      const config =
        applies === 'Persona'
          ? employeePropertiesConfig.find((p) => p.label === propertyLabel)
          : vehiclePropertiesConfig.find((p) => p.label === propertyLabel);

      if (config) {
        await ensureOptionsLoaded(config.accessor_key, applies);
      }
    }

    // Recalcular contador (ahora sin valores, por lo que reseteará o ajustará)
    computeCountWithRPC(updatedConditions);
  };

  const addCondition = () => {
    const newCondition = { property: '', values: [], id: Date.now().toString() };
    const updatedConditions = [...conditions, newCondition];
    setConditions(updatedConditions);

    // No recalcular al agregar condición vacía
    // computeCountWithRPC(updatedConditions);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} className="w-full rounded-md border p-4 shadow" placeholder="Nombre del documento" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="applies"
          render={({ field }) => (
            <FormItem>
              <div>
                <FormLabel>Aplica a</FormLabel>
                <Select
                  onValueChange={(value) => {
                    if (value === 'Empresa') {
                      setItems(
                        defaultValues.filter(
                          (e) => e.id === 'explired' || e.id === 'is_it_montlhy' || e.id === 'private'
                        )
                      );
                      if (down) {
                        setDown(false);
                        const name = form.getValues('name');
                        form.reset({ name });
                        form.setValue('applies', 'Empresa');
                      } else {
                        form.setValue('down_document', false);
                      }
                    } else {
                      setItems(defaultValues);
                    }

                    setShowEmployeePreview(false);
                    setShowVehiclePreview(false);

                    field.onChange(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectOptions} />
                    </SelectTrigger>
                  </FormControl>
                  {optionChildrenProp === 'all' ? (
                    <SelectContent>
                      <SelectItem value="Persona">Persona</SelectItem>
                      <SelectItem value="Equipos">Equipos</SelectItem>
                      <SelectItem value="Empresa">Empresa</SelectItem>
                    </SelectContent>
                  ) : (
                    <SelectContent>
                      <SelectItem value={optionChildrenProp || 'All'}>{optionChildrenProp}</SelectItem>
                    </SelectContent>
                  )}
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 grid-cols-1 gap-2 items-stretch justify-between">
          <TooltipProvider delayDuration={150}>
            {items?.map((item) => {
              if (!form.getValues('applies')) return;
              return (
                <FormField
                  key={crypto.randomUUID()}
                  control={form.control}
                  name={item.id as 'name' | 'applies' | 'multiresource' | 'mandatory' | 'explired' | 'special'}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex  space-x-2">
                        <FormControl>
                          <div className="flex flex-col space-x-2">
                            <div className="flex gap-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={field.value === true}
                                  disabled={
                                    down &&
                                    (item.id === 'is_it_montlhy' ||
                                      item.id === 'mandatory' ||
                                      item.id === 'explired' ||
                                      item.id === 'special' ||
                                      item.id === 'multiresource')
                                  }
                                  onCheckedChange={(value) => {
                                    if (value === false) {
                                      if (item.id === 'special') {
                                        setSpecial(false);
                                      }
                                      if (item.id === 'is_it_montlhy') {
                                        form.setValue('explired', false);
                                      }
                                      if (item.id === 'explired') {
                                        form.setValue('is_it_montlhy', false);
                                      }
                                      if (item.id === 'down_document') {
                                        setDown(false);
                                      }
                                    } else {
                                      if (item.id === 'special') {
                                        setSpecial(true);
                                      }
                                      if (item.id === 'is_it_montlhy') {
                                        form.setValue('explired', value ? false : true);
                                      }
                                      if (item.id === 'explired') {
                                        form.setValue('is_it_montlhy', value ? false : true);
                                      }
                                      if (item.id === 'down_document') {
                                        form.setValue('is_it_montlhy', false);
                                        form.setValue('mandatory', true);
                                        form.setValue('explired', false);
                                        form.setValue('special', false);
                                        form.setValue('multiresource', false);
                                        setDown(true);
                                      }
                                    }

                                    field.onChange(value ? true : false);
                                  }}
                                />
                                {/* <span>Sí</span> */}
                              </div>
                              {/* <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={field.value === false}
                                  disabled={
                                    down &&
                                    (item.id === 'is_it_montlhy' ||
                                      item.id === 'mandatory' ||
                                      item.id === 'explired' ||
                                      item.id === 'special' ||
                                      item.id === 'multiresource')
                                  }
                                  onCheckedChange={(value) => {
                                    field.onChange(value ? false : true);
                                    if (item.id === 'special') {
                                      setSpecial(false);
                                    }
                                    if (item.id === 'is_it_montlhy') {
                                      form.setValue('explired', false);
                                    }
                                    if (item.id === 'explired') {
                                      form.setValue('is_it_montlhy', false);
                                    }
                                    if (item.id === 'down_document') {
                                      setDown(false);
                                    }
                                  }}
                                />
                                <span>No</span>
                              </div> */}
                            </div>
                            <FormMessage />
                          </div>
                        </FormControl>
                        <FormLabel className="flex gap-1 items-center mb-2">
                          {item.label}
                          <Tooltip>
                            <TooltipTrigger className="hover:cursor-help" type="button">
                              <InfoCircledIcon className="text-blue-500 size-5" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{item.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <div className="space-y-1 leading-none"></div>
                      </div>
                    </FormItem>
                  )}
                />
              );
            })}
          </TooltipProvider>
        </div>
        {special && (
          <div className="mt-4 border rounded-lg p-4 ">
            <div className="flex justify-between flex-col items-center mb-4">
              <h3 className="font-semibold text-lg mb-2">Condiciones Especiales</h3>
              <div className="flex justify-around w-full">
                {form.getValues('applies') === 'Persona' && (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setShowEmployeePreview(!showEmployeePreview)}
                    disabled={isCalculatingCount}
                  >
                    {isCalculatingCount ? (
                      <>
                        <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-1" />
                        {showEmployeePreview ? 'Ocultar' : 'Ver'} Empleados ({employeeCount ?? 0})
                      </>
                    )}
                  </Button>
                )}
                {form.getValues('applies') === 'Equipos' && (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setShowVehiclePreview(!showVehiclePreview)}
                    disabled={isCalculatingCount}
                  >
                    {isCalculatingCount ? (
                      <>
                        <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4 mr-1" />
                        {showVehiclePreview ? 'Ocultar' : 'Ver'} Equipos ({vehicleCount ?? 0})
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" size="sm" type="button" onClick={addCondition}>
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Añadir Condición
                </Button>
              </div>
            </div>

            {conditions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>Añade condiciones para especificar a qué empleados aplica este documento.</p>
                <Button variant="outline" className="mt-2" type="button" onClick={addCondition}>
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Añadir Primera Condición
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {conditions.map((condition) => (
                  <Card key={crypto.randomUUID()}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Select
                          value={condition.property}
                          onValueChange={(value) => handlePropertySelect(condition.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar propiedad" />
                          </SelectTrigger>
                          <SelectContent>
                            {form.getValues('applies') === 'Equipos'
                              ? vehiclePropertiesConfig.map((prop) => (
                                <SelectItem key={crypto.randomUUID()} value={prop.label}>
                                  {prop.label}
                                </SelectItem>
                              ))
                              : employeePropertiesConfig.map((prop) => (
                                <SelectItem key={crypto.randomUUID()} value={prop.label}>
                                  {prop.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {condition.property &&
                          (() => {
                            const applies = form.getValues('applies');
                            const config =
                              applies === 'Persona'
                                ? employeePropertiesConfig.find((p) => p.label === condition.property)
                                : vehiclePropertiesConfig.find((p) => p.label === condition.property);
                            const cacheKey = config ? `${applies}_${config.accessor_key}` : '';
                            const isLoading = loadingOptions[cacheKey] || false;
                            const cachedOptions = getPropertyOptions(
                              condition.property,
                              applies as 'Persona' | 'Equipos'
                            );

                            return (
                              <div className="flex items-center gap-2 flex-1">
                                {isLoading && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Cargando opciones...
                                  </div>
                                )}
                                {!isLoading && (
                                  <MultiSelect
                                    options={cachedOptions}
                                    selectedValues={condition.values}
                                    setSelectedValues={(values: string[]) =>
                                      updateConditionValues(condition.id, values)
                                    }
                                    emptyMessage="No hay valores disponibles"
                                    placeholder="Seleccionar valores"
                                  />
                                )}
                              </div>
                            );
                          })()}

                        <Button
                          size="icon"
                          type="button"
                          onClick={() => removeCondition(condition.id)}
                          className="ml-auto"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-sm font-medium">Resumen:</span>
                    {conditions.map((condition) => {
                      const propertyLabel = condition.property;
                      const applies = form.getValues('applies');

                      return condition.property && condition.values.length ? (
                        <Badge key={crypto.randomUUID()} variant="outline" className="text-xs">
                          {propertyLabel}:{' '}
                          {(() => {
                            // Buscar configuración de la propiedad
                            const config =
                              applies === 'Persona'
                                ? employeePropertiesConfig.find((p) => p.label === condition.property)
                                : vehiclePropertiesConfig.find((p) => p.label === condition.property);

                            if (!config) return condition.values.join(', ');

                            // Si es una propiedad de relación, convertir IDs a nombres
                            if (
                              [
                                'contractor_employee',
                                'province',
                                'hierarchical_position',
                                'category',
                                'guild',
                                'covenant',
                                'city',
                                'company_position',
                                'brand',
                                'model',
                                'type',
                                'types_of_vehicles',
                                'contractor_equipment',
                                'type_of_contract',
                              ].includes(config.accessor_key)
                            ) {
                              const cacheKey = `${applies}_${config.accessor_key}`;
                              const options = optionsCache[cacheKey] || [];

                              // Convertir cada ID a su nombre correspondiente
                              const displayNames = condition.values.map((value) => {
                                const option = options.find((opt) => opt.value === value);
                                return option ? option.label : value;
                              });

                              return displayNames.join(', ');
                            }

                            // Para propiedades directas, mostrar valores como están
                            return condition.values.join(', ');
                          })()}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}

            {(showEmployeePreview && form.getValues('applies') === 'Persona') ||
              (showVehiclePreview && form.getValues('applies') === 'Equipos') ? (
              <Accordion type="single" collapsible className="mt-4">
                <AccordionItem value="employees">
                  <AccordionTrigger>
                    {form.getValues('applies') === 'Persona'
                      ? `Empleados que cumplen las condiciones (${employeeCount ?? 0})`
                      : `Equipos que cumplen las condiciones (${vehicleCount ?? 0})`}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-[200px] rounded-md border p-2">
                      {(form.getValues('applies') === 'Persona' && (employeeCount ?? 0) === 0) ||
                        (form.getValues('applies') === 'Equipos' && (vehicleCount ?? 0) === 0) ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No hay {form.getValues('applies') === 'Persona' ? 'empleados' : 'equipos'} que cumplan todas
                          las condiciones seleccionadas
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Renderizado de empleados que cumplen con las condiciones */}
                          {(form.getValues('applies') === 'Persona' ? previewEmployees : previewVehicles).map(
                            (employee: any) => {
                              return (
                                <div key={crypto.randomUUID()} className="flex items-center gap-2 p-2 rounded-md">
                                  {form.getValues('applies') === 'Persona' ? (
                                    <Avatar>
                                      <AvatarImage
                                        src={employee.picture || '/placeholder.svg'}
                                        alt={employee.firstname}
                                      />
                                      <AvatarFallback>{employee.firstname.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                  ) : (
                                    <Avatar>
                                      <AvatarImage
                                        src={employee.picture || '/placeholder.svg'}
                                        alt={employee.brand.name}
                                      />
                                      <AvatarFallback>{employee.brand.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                  )}
                                  <div>
                                    <p className="font-medium">
                                      {form.getValues('applies') === 'Persona'
                                        ? `${employee.firstname} ${employee.lastname}`
                                        : `${employee.brand.name} ${employee.model.name}`}
                                    </p>
                                    <div className="flex gap-1 flex-wrap">
                                      {conditions
                                        .filter((condition) => condition.property && condition.values.length)
                                        .flatMap((condition) => {
                                          const propertyConfig =
                                            form.getValues('applies') === 'Persona'
                                              ? employeePropertiesConfig.find(
                                                (config) => config.label === condition.property
                                              )
                                              : vehiclePropertiesConfig.find(
                                                (config) => config.label === condition.property
                                              );
                                          if (!propertyConfig) return [];
                                          const employeeValue =
                                            form.getValues('applies') === 'Persona'
                                              ? getEmployeePropertyValue(employee, propertyConfig.accessor_key)
                                              : getVehiclePropertyValue(employee, propertyConfig.accessor_key);
                                          const badges = condition.values
                                            .filter((v) => employeeValue.toLowerCase() === v.toLowerCase())
                                            .map((v) => (
                                              <Badge key={crypto.randomUUID()} variant="outline" className="text-xs">
                                                {condition.property}: {v}
                                              </Badge>
                                            ));
                                          return badges;
                                        })}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : null}
          </div>
        )}
        <Button type="submit" id="create_new_document" className={cn(codeControlClient ? 'hidden' : '')}>
          Crear tipo de documento
        </Button>
      </form>
    </Form>
  );
}
