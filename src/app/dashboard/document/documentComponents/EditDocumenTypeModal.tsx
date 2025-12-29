'use client';
import {
  fetchAllCategories,
  fetchallResources,
  // fetchCompanyPositions,
  fetchCovenants,
  fetchCustomers,
  fetchGuilds,
  fetchHierrarchicalPositions,
  fetchProvinces,
  // fetchTypeOfContracts,
  fetchTypesOfVehicles,
  fetchTypeVehicles,
  fetchVehicleBrands,
  fetchVehicleModels,
  fetchWorkDiagrams,
  fettchExistingEntries,
  updateDocumentType,
} from '@/app/server/GET/actions';
import {
  baseEmployeePropertiesConfig,
  baseVehiclePropertiesConfig,
  Condition,
  getEmployeePropertyValue,
  getVehiclePropertyValue,
  relationMeta,
} from '@/components/NewDocumentType';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select-combobox-condition';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { fetchEmployeesWithFilters, fetchVehiclesWithFilters, RpcFilter } from '@/lib/documentFilters';
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useCountriesStore } from '@/store/countries';
import { Equipo } from '@/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import Cookies from 'js-cookie';
import { PlusCircle, Truck, User, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
type OptionItem = { value: string; label: string };

type EmployeeDetailed = {
  id: string;
  firstname: string;
  lastname: string;
  picture?: string;
  // otras propiedades que vienen del RPC
  [key: string]: any;
};

type VehicleWithBrand = {
  id: string;
  brand_name?: string;
  model_name?: string;
  brand?: { name: string };
  model?: { name: string };
  picture?: string;
  // otras propiedades que vienen del RPC
  [key: string]: any;
};

type Props = {
  Equipo: Equipo[0];
};
export function EditModal({ Equipo }: Props) {
  const [isCalculatingCount, setIsCalculatingCount] = useState(false);
  const [optionsCache, setOptionsCache] = useState<Record<string, OptionItem[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});
  // AbortController para cancelar requests en curso
  const abortControllerRef = useRef<AbortController | null>(null);

  // ========== Contadores con RPC (IMPLEMENTACIÓN PRINCIPAL) ==========
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [vehicleCount, setVehicleCount] = useState<number | null>(null);
  const [previewEmployees, setPreviewEmployees] = useState<any[]>([]);
  const [previewVehicles, setPreviewVehicles] = useState<any[]>([]);

  const supabase = supabaseBrowser();
  const [special, setSpecial] = useState(false || Equipo.special);
  const [allResources, setAllResources] = useState<any[]>([]);
  const router = useRouter();
  const fetchDocumentTypes = useCountriesStore((state) => state.documentTypes);
  const actualCompany = Cookies.get('actualComp');
  const [showEmployeePreview, setShowEmployeePreview] = useState(false);
  const [showVehiclePreview, setShowVehiclePreview] = useState(false);
  const [showAlertsUpdateModal, setShowAlertsUpdateModal] = useState(false);
  const [resourcesNeedingAlerts, setResourcesNeedingAlerts] = useState<any[]>([]);
  const [resourcesNeedingDeletion, setResourcesNeedingDeletion] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>(() => {
    return (
      Equipo?.conditions?.map((c) => ({
        id: crypto.randomUUID(),
        property:
          c.property_label || baseVehiclePropertiesConfig.find((p) => p.accessor_key === c.property_key)?.label || '',
        values: c.reference_values?.length
          ? c.is_relation
            ? c.reference_values?.map((v) => v.id)
            : c.reference_values?.map((v) => v.value)
          : c.values || c.ids || [],
      })) || []
    );
  });

  const [matchingEmployees, setMatchingEmployees] = useState<EmployeeDetailed[]>([]);
  const [matchingVehicles, setMatchingVehicles] = useState<VehicleWithBrand[]>([]);
  // Estado para mantener las propiedades con sus valores dinámicos

  const employeePropertiesConfig = baseEmployeePropertiesConfig;

  // Líneas 315-325:
  const vehiclePropertiesConfig = baseVehiclePropertiesConfig;
  const FormSchema = z.object({
    name: z
      .string({ required_error: 'Este campo es requerido' })
      .min(3, { message: 'El nombre debe contener mas de 3 caracteres' })
      .max(50, { message: 'El nombre debe contener menos de 50 caracteres' }),
    applies: z.enum(['Persona', 'Equipos', 'Empresa'], {
      required_error: 'Este campo es requerido',
    }),
    multiresource: z.boolean({
      required_error: 'Se debe seleccionar una opcion',
    }),
    mandatory: z.boolean({ required_error: 'Se debe seleccionar una opcion' }),
    explired: z.boolean({ required_error: 'Se debe seleccionar una opcion' }),
    special: z.boolean({ required_error: 'Este campo es requerido' }),
    description: special ? z.string({ required_error: 'Este campo es requerido' }) : z.string().optional(),
    is_it_montlhy: z.boolean({ required_error: 'Se debe seleccionar una opcion' }).optional(),
    private: z.boolean({ required_error: 'Se debe seleccionar una opcion' }).optional(),
    down_document: z.boolean({ required_error: 'Este campo es requerido' }),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: Equipo.name,
      multiresource: Equipo.multiresource,
      mandatory: Equipo.mandatory,
      explired: Equipo.explired,
      special: Equipo.special,
      applies: Equipo.applies as 'Persona' | 'Equipos' | 'Empresa' | undefined,
      description: Equipo.description || '',
      is_it_montlhy: Equipo.is_it_montlhy as boolean,
      private: Equipo.private as boolean,
      down_document: Equipo.down_document as boolean,
    },
  });

  const itemsTotales = [
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
  const [items] = useState(() => {
    return Equipo.applies !== 'Empresa'
      ? itemsTotales
      : itemsTotales.filter((e) => e.id === 'is_it_montlhy' || e.id === 'private' || e.id === 'explired');
  });

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

  async function checkAlertsStatus() {
    setIsCheckingAlerts(true);

    if (!Equipo.special) {
      // Si no es un documento especial, simplemente actualizamos sin revisar alertas
      await performUpdate(false);
      setIsCheckingAlerts(false);
      return;
    }

    // Para documentos especiales, verificamos si hay cambios en las alertas
    let newResourcesToAlert: any[] = [];
    let resourcesToRemoveAlert: any[] = [];

    // Obtenemos las entradas existentes
    const existingEntries: any = await fettchExistingEntries(Equipo.applies, Equipo.id);

    if (Equipo.applies === 'Persona') {
      // Determinar qué empleados necesitan alertas y cuáles necesitan eliminarlas
      if (matchingEmployees.length > 0) {
        // Empleados que cumplen condiciones pero no tienen alertas (necesitan alertas nuevas)
        newResourcesToAlert = matchingEmployees.filter(
          (employee) => !existingEntries.some((entry: any) => entry.applies.id === employee.id)
        );

        // Empleados con alertas que ya no cumplen condiciones (necesitan eliminar alertas)
        resourcesToRemoveAlert = existingEntries
          .filter((entry: any) => !matchingEmployees.some((employee) => employee.id === entry.applies.id))
          .map((entry: any) => entry.applies);
      } else {
        // Si no hay empleados que cumplan, todos los que tienen alertas necesitan eliminarlas
        resourcesToRemoveAlert = existingEntries.map((entry: any) => entry.applies);
      }
    } else if (Equipo.applies === 'Equipos') {
      // Determinar qué vehículos necesitan alertas y cuáles necesitan eliminarlas
      if (matchingVehicles.length > 0) {
        // Vehículos que cumplen condiciones pero no tienen alertas (necesitan alertas nuevas)
        newResourcesToAlert = matchingVehicles.filter(
          (vehicle) => !existingEntries.some((entry: any) => entry.applies.id === vehicle.id)
        );

        // Vehículos con alertas que ya no cumplen condiciones (necesitan eliminar alertas)
        resourcesToRemoveAlert = existingEntries
          .filter((entry: any) => !matchingVehicles.some((vehicle) => vehicle.id === entry.applies.id))
          .map((entry: any) => entry.applies);
      } else {
        // Si no hay vehículos que cumplan, todos los que tienen alertas necesitan eliminarlas
        resourcesToRemoveAlert = existingEntries.map((entry: any) => entry.applies);
      }
    }

    // Verificamos si hay cambios en las alertas
    if (newResourcesToAlert.length > 0 || resourcesToRemoveAlert.length > 0) {
      // Guardamos los recursos que necesitan cambios
      setResourcesNeedingAlerts(newResourcesToAlert);
      setResourcesNeedingDeletion(resourcesToRemoveAlert);
      // Abrimos el modal de confirmación
      setShowAlertsUpdateModal(true);
      setIsCheckingAlerts(false);
    } else {
      // Si no hay cambios en las alertas, simplemente actualizamos
      await performUpdate(false);
      setIsCheckingAlerts(false);
    }
  }

  async function handleAlertsUpdate(manageAlerts: boolean) {
    setShowAlertsUpdateModal(false);
    await performUpdate(manageAlerts);
  }

  async function performUpdate(manageAlerts: boolean) {
    setIsLoading(true);

    // 1. Preparar valores para actualizar el documento
    // Convertir las condiciones a formato serializable
    const serializedConditions =
      form.getValues('applies') === 'Equipos' ? prepareVehicleConditionsForStorage() : prepareConditionsForStorage();
    const formattedValues = {
      ...form.getValues(),
      name: formatName(form.getValues('name')),
      description: formatDescription(form.getValues('description')),
      conditions: serializedConditions,
    };

    try {
      // 2. Actualizar el documento
      // const { error: updateError } = await supabase.from('document_types').update(formattedValues).eq('id', Equipo.id);
      const updateError = await updateDocumentType(Equipo.id, formattedValues);

      if (updateError) {
        console.error(updateError);
        throw new Error(handleSupabaseError(updateError.message));
      }

      // 3. Manejar alertas si es necesario
      if (manageAlerts && Equipo.special) {
        const tableNames = {
          Equipos: 'documents_equipment',
          Persona: 'documents_employees',
          Empresa: 'documents_company',
        };
        const table = tableNames[Equipo.applies as 'Equipos' | 'Persona' | 'Empresa'];

        // 3.1 Eliminar alertas que ya no aplican (solo si document_path es null)
        if (resourcesNeedingDeletion.length > 0) {
          // Obtenemos todos los IDs de recursos que necesitan eliminación
          const resourceIds = resourcesNeedingDeletion.map((resource) => resource.id);

          // Primero obtenemos los IDs de las alertas con document_path null
          const { data: alertsToDelete } = await supabase
            .from(table as 'documents_equipment' | 'documents_employees' | 'documents_company')
            .select('id')
            .eq('id_document_types', Equipo.id)
            .in('applies', resourceIds)
            .is('document_path', null);

          if (alertsToDelete && alertsToDelete.length > 0) {
            // Extraemos los IDs de las alertas a eliminar
            const alertIds = alertsToDelete.map((alert) => alert.id);

            // Eliminamos todas las alertas en una sola operación
            const { error: deleteError } = await supabase
              .from(table as 'documents_equipment' | 'documents_employees' | 'documents_company')
              .delete()
              .in('id', alertIds);

            if (deleteError) {
              console.error('Error al eliminar alertas en bulk:', deleteError);
            }
          }
        }

        // 3.2 Generar nuevas alertas
        if (resourcesNeedingAlerts.length > 0) {
          // Obtenemos los IDs de recursos que necesitan alertas
          const resourceIds = resourcesNeedingAlerts.map((resource) => resource.id);

          // Verificamos qué recursos ya tienen alertas para no duplicar
          const { data: existingAlerts } = await supabase
            .from(table as 'documents_equipment' | 'documents_employees' | 'documents_company')
            .select('applies')
            .eq('id_document_types', Equipo.id)
            .in('applies', resourceIds);

          const existingAlertIds = existingAlerts?.map((alert) => alert.applies) || [];

          // Filtramos solo recursos que no tengan alertas ya existentes
          const resourcesToInsert = resourcesNeedingAlerts.filter(
            (resource) => !existingAlertIds.includes(resource.id)
          );

          if (resourcesToInsert.length > 0) {
            const user = await supabase.auth.getUser();
            // Preparamos los datos para inserción masiva
            const newEntries = resourcesToInsert.map((resource) => ({
              id_document_types: Equipo.id,
              applies: resource.id,
              is_active: true,
              // insertedAt: new Date().toISOString(),
              document_path: null,
              user_id: user?.data.user?.id,
            }));

            // Insertamos todas las alertas nuevas en una sola operación
            const { error: insertError } = await supabase
              .from(table as 'documents_equipment' | 'documents_employees' | 'documents_company')
              .insert(newEntries);

            if (insertError) {
              console.error('Error al generar alertas en bulk:', insertError);
            }
          }
        }
      }

      // 4. Actualizar la interfaz
      fetchDocumentTypes(actualCompany);
      toast.success('Documento actualizado correctamente');
      document.getElementById('cerrar-editor-modal')?.click();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el documento');
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    // Este método se mantiene por compatibilidad, pero ahora usamos performUpdate
    toast.promise(
      async () => {
        const error = await updateDocumentType(Equipo.id, values);

        if (error) {
          throw new Error(error.message);
        }
        fetchDocumentTypes(actualCompany);
      },
      {
        loading: 'Actualizando...',
        success: (data) => {
          document.getElementById('close_document_modal')?.click();
          return 'El documento se ha actualizado correctamente';
        },
        error: (error) => {
          return error;
        },
      }
    );
    fetchDocumentTypes(actualCompany);
    router.refresh();
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

  async function handleDeleteDocumentType() {
    toast.promise(
      async () => {
        // const { error } = await supabase.from('document_types').update({ is_active: false }).eq('id', Equipo.id);

        const error = await updateDocumentType(Equipo.id, { is_active: false });

        await handleDeleteAlerts(); //!probar

        if (error) {
          throw new Error(handleSupabaseError(error.message));
        }
      },
      {
        loading: 'Eliminando...',
        success: (data) => {
          document.getElementById('close_document_modal')?.click();
          fetchDocumentTypes(actualCompany);

          return 'El documento se ha eliminado correctamente';
        },
        error: (error) => {
          return error;
        },
      }
    );
  }

  // async function fetchallResources() {
  //   if (Equipo.applies === 'Persona') {
  //     const { data, error } = await supabase
  //       .from('employees')
  //       .select('firstname,lastname, cuil,id')
  //       .eq('company_id', actualCompany || '');

  //     if (error) {
  //       console.error('Error al obtener datos adicionales:', error);
  //     } else {
  //       setAllResources(data);
  //     }
  //   } else if (Equipo.applies === 'Equipos') {
  //     const { data, error } = await supabase
  //       .from('vehicles')
  //       .select('domain, serie, intern_number,id')
  //       .eq('company_id', actualCompany || '');

  //     if (error) {
  //       console.error('Error al obtener datos adicionales:', error);
  //     } else {
  //       setAllResources(data);
  //     }
  //   }
  // }
  const [existingEntries, setExistingEntries] = useState<any[]>([]);
  const [selectedDeleteMode, setSelectedDeleteMode] = useState<'all' | 'nonMatching'>('all');
  const [isCheckingAlerts, setIsCheckingAlerts] = useState(false);

  // async function fettchExistingEntries() {
  //   const tableNames = {
  //     Equipos: 'documents_equipment',
  //     Persona: 'documents_employees',
  //   };
  //   const table = tableNames[Equipo.applies as 'Equipos' | 'Persona'];

  //   const { data: existingEntries, error: existingEntriesError } = await supabase
  //     .from(table as 'documents_equipment' | 'documents_employees')
  //     .select('applies(*),id')
  //     .eq('id_document_types', Equipo.id)
  //     .eq('applies.company_id', actualCompany || '')
  //     .not('applies', 'is', null);

  //   if (existingEntriesError) {
  //     console.error('Error al obtener los recursos con documentos:', existingEntriesError);
  //     return;
  //   }
  //   setExistingEntries(existingEntries);
  // }
  // Filtrar los recursos que no tienen una entrada en la tabla correspondiente
  const existingResourceIds = existingEntries.map((entry: any) => entry.applies.id);
  let filteredResources: any[] = allResources;
  if (Equipo.special) {
    if (Equipo.applies === 'Persona') {
      filteredResources = matchingEmployees;
    } else if (Equipo.applies === 'Equipos') {
      filteredResources = matchingVehicles;
    }
  }
  const resourcesToInsert = filteredResources.filter(
    (resource: { id: string }) => !existingResourceIds.includes(resource.id)
  );

  async function handleGenerateAlerts() {
    toast.promise(
      async () => {
        const tableNames = {
          Equipos: 'documents_equipment',
          Persona: 'documents_employees',
        };
        const table = tableNames[Equipo.applies as 'Equipos' | 'Persona'];

        // Si es especial, solo generar alertas para matchingEmployees/vehicles
        let alertResources = resourcesToInsert;
        if (Equipo.special) {
          if (Equipo.applies === 'Persona') {
            alertResources = resourcesToInsert.filter((r: any) => matchingEmployees.some((m) => m.id === r.id));
          } else if (Equipo.applies === 'Equipos') {
            alertResources = resourcesToInsert.filter((r: any) => matchingVehicles.some((m) => m.id === r.id));
          }
        }

        if (alertResources.length > 0) {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            return;
          }

          const alerts = alertResources.map((resource: { id: string }) => ({
            id_document_types: Equipo.id,
            user_id: user.id,
            applies: resource.id,
          }));

          const { error: insertError } = await supabase.from(table as any).insert(alerts);

          if (insertError) {
            throw new Error(handleSupabaseError(insertError.message));
          }
        } else {
          throw new Error('No hay recursos a los que se les deba generar una alerta');
        }
      },
      {
        loading: 'Generando alertas...',
        success: (data) => {
          fetchDocumentTypes(actualCompany);
          return 'Se han generado las alertas!';
        },
        error: (error) => {
          return error;
        },
      }
    );
    router.refresh();
  }
  // Referencia para cerrar el modal de eliminación de alertas
  const closeAlertModalRef = useRef<HTMLButtonElement>(null);

  async function handleDeleteAlerts() {
    const tableNames = {
      Equipos: 'documents_equipment',
      Persona: 'documents_employees',
      Empresa: 'documents_company',
    };
    const table = tableNames[Equipo.applies as 'Equipos' | 'Persona' | 'Empresa'];

    try {
      // Si es un documento especial y el modo es 'nonMatching', solo eliminar las alertas que no cumplen con las condiciones
      if (Equipo.special && selectedDeleteMode === 'nonMatching') {
        // Identificar recursos que no cumplen con las condiciones actuales
        const matchingIds =
          Equipo.applies === 'Persona' ? matchingEmployees.map((e) => e.id) : matchingVehicles.map((v) => v.id);

        // Obtener IDs de recursos con alertas que NO están en la lista de matching
        const nonMatchingEntries = existingEntries.filter((entry) => !matchingIds.includes(entry.applies.id));

        if (nonMatchingEntries.length === 0) {
          toast.error('No hay alertas para eliminar que no cumplan con las condiciones actuales');
          return;
        }

        // Obtenemos los IDs de las alertas a eliminar
        const nonMatchingResourceIds = nonMatchingEntries.map((entry) => entry.id);

        // Eliminar solo las alertas de recursos que no cumplen con las condiciones actuales
        const { error } = await supabase
          .from(table as any)
          .delete()
          .in('id', nonMatchingResourceIds)
          .is('document_path', null);

        if (error) {
          throw new Error(handleSupabaseError(error.message));
        }
      } else {
        const { error } = await supabase
          .from(table as any)
          .delete()
          .eq('id_document_types', Equipo.id)
          .is('document_path', null);

        if (error) {
          throw new Error(handleSupabaseError(error.message));
        }
      }

      // Si llegamos aquí, la operación fue exitosa
      fetchDocumentTypes(actualCompany);
      router.refresh();

      // Cerrar el modal de eliminación de alertas
      closeAlertModalRef.current?.click();

      // Mostrar mensaje de éxito
      toast.success(
        selectedDeleteMode === 'nonMatching'
          ? 'Se han eliminado las alertas que no cumplen con las condiciones actuales!'
          : 'Se han eliminado todas las alertas!'
      );

      // Actualizar la lista de entradas existentes después de eliminar
      const existingEntries2 = await fettchExistingEntries(Equipo.applies, Equipo.id);
      if (existingEntries2) {
        setExistingEntries(existingEntries2);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar alertas');
    }
  }

  const addCondition = () => {
    const newCondition = { property: '', values: [], id: Date.now().toString() };
    const updatedConditions = [...conditions, newCondition];
    setConditions(updatedConditions);

    // No recalcular al agregar condición vacía
    // computeCountWithRPC(updatedConditions);
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
      setIsCalculatingCount(false); // ← Resetear estado cuando no hay condiciones
      setEmployeeCount(null);
      setVehicleCount(null);
      setPreviewEmployees([]);
      setPreviewVehicles([]);
      setMatchingEmployees([]); // ← Resetear matchingEmployees
      setMatchingVehicles([]); // ← Resetear matchingVehicles
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
        console.log(conditionsToUse, 'conditionsToUse');
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
          setIsCalculatingCount(false); // ← Resetear estado cuando se aborta
          return;
        }

        console.log('[RPC COUNT] ✅ Encontrados:', filtered.length, 'empleados');

        setEmployeeCount(filtered.length);
        setPreviewEmployees(filtered);
        setMatchingEmployees(filtered); // ← Actualizar matchingEmployees con los empleados filtrados
        setIsCalculatingCount(false); // ← Resetear estado de cálculo
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
          setIsCalculatingCount(false); // ← Resetear estado cuando se aborta
          return;
        }

        console.log('[RPC COUNT] ✅ Encontrados:', filtered.length, 'vehículos');

        setVehicleCount(filtered.length);
        setPreviewVehicles(filtered);
        setMatchingVehicles(filtered); // ← Actualizar matchingVehicles con los vehículos filtrados
        setIsCalculatingCount(false); // ← Resetear estado de cálculo
        abortControllerRef.current = null;
      }
    } catch (error: any) {
      // Si el error es por abort, no hacer nada (ya se manejó arriba)
      if (error?.name === 'AbortError' || signal.aborted) {
        console.log('[RPC COUNT] 🔄 Request cancelada, continuando con la siguiente');
        setIsCalculatingCount(false); // ← Resetear estado cuando se aborta en el catch
        return;
      }

      console.error('[RPC COUNT] ❌ Error:', error);
      setIsCalculatingCount(false);
      setMatchingEmployees([]); // ← Resetear en caso de error
      setMatchingVehicles([]); // ← Resetear en caso de error
    }
  };

  // ========== Función para pre-cargar opciones de condiciones existentes ==========
  const preloadExistingConditionsOptions = async () => {
    if (!Equipo?.conditions?.length) return;

    console.log('[PRELOAD] Pre-cargando opciones para condiciones existentes');

    for (const condition of Equipo.conditions) {
      if (!condition.property_key || !condition.values?.length) continue;

      const applies = form.getValues('applies');
      const accessorKey = condition.property_key;

      console.log(`[PRELOAD] Cargando opciones para propiedad: ${accessorKey}`);

      // Solo cargar opciones si aplica a Persona o Equipos (no Empresa)
      if (applies === 'Persona' || applies === 'Equipos') {
        // Usar la función existente ensureOptionsLoaded
        await ensureOptionsLoaded(accessorKey, applies);
      }
    }

    console.log('[PRELOAD] Pre-carga de opciones completada');
  };
  const [modalOpen, setModalOpen] = useState(false);

  // ========== Ejecutar conteos iniciales si documento tiene condiciones especiales ==========
  useEffect(() => {
    if (Equipo?.special && conditions.length > 0 && modalOpen) {
      // Primero pre-cargar las opciones necesarias
      preloadExistingConditionsOptions().then(() => {
        // Luego ejecutar conteos iniciales cuando el documento tiene condiciones especiales
        console.log(conditions, 'conditions');
        console.log(Equipo?.conditions, 'Equipo?.conditions');
        computeCountWithRPC(conditions);
      });
    }
  }, [Equipo, modalOpen]);

  // ========== Monitorear cambios en campo 'special' del formulario ==========
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'special' && value.special === true && conditions.length > 0) {
        console.log('[WATCH] Campo special cambió a true con condiciones existentes, ejecutando conteos');
        // Ejecutar conteos cuando se activa 'special' desde el formulario y hay condiciones existentes
        computeCountWithRPC(conditions);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, conditions, computeCountWithRPC]);
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
            console.log(`[LAZY LOAD] ✅ ${options.length} opciones estáticas`);
            break;
          case 'type_of_contract':
            options = [
              { value: 'Período de prueba', label: 'Período de prueba' },
              { value: 'A tiempo indeterminado', label: 'A tiempo indeterminado' },
              { value: 'Plazo fijo', label: 'Plazo fijo' }
            ];
            break;

          default:
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

  // Cerca de la línea 587, donde están los otros estados
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [confirmDeleteMessage, setConfirmDeleteMessage] = useState('');

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

  return (
    <Sheet open={modalOpen} onOpenChange={setModalOpen}>
      <SheetTrigger asChild>
        <Button
          onClick={async () => {
            const data = await fetchallResources(Equipo.applies);
            setAllResources(data as any[]);
            const existingEntries = await fettchExistingEntries(Equipo.applies, Equipo.id);
            if (existingEntries) {
              setExistingEntries(existingEntries);
            }
          }}
          id="close-edit-modal-documentypes"
          variant="outline"
        >
          Editar
        </Button>
      </SheetTrigger>
      <SheetContent className="border-l-4 border-l-muted flex flex-col justify-between overflow-y-auto sm:max-w-screen-md">
        <AlertDialog open={showConfirmDeleteModal} onOpenChange={setShowConfirmDeleteModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
              <AlertDialogDescription>{confirmDeleteMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: 'destructive' })}
                onClick={() => handleDeleteAlerts()}
              >
                Confirmar eliminación
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div>
          <SheetHeader>
            <SheetTitle>Editar tipo de documento</SheetTitle>
            <SheetDescription>
              Puedes editar el tipo de documento seleccionado, los documentos creados por defecto no son editables
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="w-full rounded-md border p-4 shadow"
                          placeholder="Nombre del documento"
                        />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Personas, Equipos o Empresa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Persona">Persona</SelectItem>
                            <SelectItem value="Equipos">Equipos</SelectItem>
                            <SelectItem value="Empresa">Empresa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 grid-cols-1 gap-6 items-stretch justify-between">
                  <TooltipProvider delayDuration={150}>
                    {items?.map((item) => (
                      <FormField
                        key={crypto.randomUUID()}
                        control={form.control}
                        name={item.id as 'name' | 'applies' | 'multiresource' | 'mandatory' | 'explired' | 'special'}
                        render={({ field }) => (
                          <FormItem>
                            <div className="">
                              <FormLabel className="flex gap-1 items-center mb-2">{item.label}</FormLabel>
                              <FormControl>
                                <div className="flex flex-col space-x-2">
                                  <div className="flex gap-3">
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        checked={field.value === true}
                                        onCheckedChange={(value) => {
                                          field.onChange(value ? true : false);
                                          if (item.id === 'special') {
                                            setSpecial(true);
                                          }
                                          if (item.id === 'is_it_montlhy') {
                                            form.setValue('explired', value ? false : true);
                                          }
                                          if (item.id === 'explired') {
                                            form.setValue('is_it_montlhy', value ? false : true);
                                          }
                                        }}
                                      />
                                      <span>Sí</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        checked={field.value === false}
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
                                        }}
                                      />
                                      <span>No</span>
                                    </div>
                                  </div>
                                  <FormMessage />
                                </div>
                              </FormControl>
                              <div className="space-y-1 leading-none"></div>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
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
                                        const option = options.find((opt) => opt.value == value);
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
                                  No hay {form.getValues('applies') === 'Persona' ? 'empleados' : 'equipos'} que cumplan
                                  todas las condiciones seleccionadas
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {/* Renderizado de empleados que cumplen con las condiciones */}
                                  {(form.getValues('applies') === 'Persona' ? previewEmployees : previewVehicles).map(
                                    (employee: any) => {
                                      return (
                                        <div
                                          key={crypto.randomUUID()}
                                          className="flex items-center gap-2 p-2 rounded-md"
                                        >
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
                                                      <Badge
                                                        key={crypto.randomUUID()}
                                                        variant="outline"
                                                        className="text-xs"
                                                      >
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
                <SheetFooter className="flex justify-between flex-wrap">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant={'destructive'}>Eliminar tipo de documento</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Estas seguro que deseas eliminar el tipo de documento {Equipo.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta accion no puede revertirse, y eliminara todos los documentos asociados a este tipo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} asChild>
                          <Button onClick={() => handleDeleteDocumentType()} variant={'destructive'}>
                            Eliminar tipo de documento
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    onClick={async () => {
                      if (Equipo.special) {
                        await checkAlertsStatus();
                      } else {
                        // Si no es especial, se actualiza directamente
                        await performUpdate(false);
                      }
                    }}
                    disabled={isLoading || isCheckingAlerts}
                    type="button"
                  >
                    {isLoading ? 'Procesando...' : isCheckingAlerts ? 'Verificando alertas...' : 'Guardar cambios'}
                  </Button>
                  <SheetClose id="cerrar-editor-modal" />
                </SheetFooter>
              </form>
            </Form>
          </div>
        </div>
        <Separator className="mb-2 mt-0" />
        <div className="flex justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant={'destructive'} className="self-end">
                Eliminar alertas
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminación de alertas</AlertDialogTitle>
                {!Equipo.special ? (
                  // Modal para documentos NO especiales (funcionalidad original)
                  <>
                    <AlertDialogDescription>
                      Esta acción eliminará la alerta de todos los recursos a los que no se les haya subido el
                      documento. Los documentos ya subidos y vinculados a este tipo de documento permanecerán intactos.
                    </AlertDialogDescription>
                    <div className="mt-4">
                      {existingEntries.length > 0 ? (
                        <ScrollArea className="h-48">
                          <div className="p-4 border rounded-md">
                            <CardTitle className="text-md mb-3">Recursos con alertas pendientes:</CardTitle>
                            {existingEntries.map((entry) => {
                              const resource = entry.applies;
                              if (Equipo.applies === 'Equipos') {
                                return (
                                  <div key={crypto.randomUUID()} className="py-1 flex items-center gap-2">
                                    <Truck className="size-5" /> {resource.domain} {resource.serie} -{' '}
                                    {resource.intern_number}
                                  </div>
                                );
                              }
                              if (Equipo.applies === 'Persona') {
                                return (
                                  <div key={crypto.randomUUID()} className="py-1 flex items-center gap-2">
                                    <User className="size-5" /> {resource.lastname} {resource.firstname} -{' '}
                                    {resource.cuil}
                                  </div>
                                );
                              }
                            })}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="p-4 border rounded-md text-center">No hay alertas pendientes para eliminar</div>
                      )}
                    </div>
                  </>
                ) : (
                  // Modal para documentos especiales (nuevo diseño de dos columnas)
                  <>
                    <AlertDialogDescription className="mb-4">
                      Seleccione qué alertas desea eliminar. Puede ver el listado completo o solo los recursos que ya no
                      cumplen con las condiciones definidas.
                    </AlertDialogDescription>

                    {/* Botones para ejecutar acciones directamente */}
                    <div className="flex gap-4 mb-4 justify-center">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedDeleteMode('all');
                          setConfirmDeleteMessage(
                            `¿Estás seguro de que deseas eliminar todas las alertas (${existingEntries.length})?`
                          );
                          setShowConfirmDeleteModal(true);
                        }}
                        disabled={existingEntries.length === 0}
                        className="flex-1"
                      >
                        Eliminar todas ({existingEntries.length})
                      </Button>

                      {(() => {
                        const matchingIds =
                          Equipo.applies === 'Persona'
                            ? matchingEmployees.map((e) => e.id)
                            : matchingVehicles.map((v) => v.id);

                        const nonMatchingEntries = existingEntries.filter(
                          (entry) => !matchingIds.includes(entry.applies.id)
                        );

                        return (
                          <Button
                            variant="destructive"
                            onClick={() => {
                              setSelectedDeleteMode('nonMatching');
                              setConfirmDeleteMessage(
                                `¿Estás seguro de que deseas eliminar las alertas fuera de condiciones (${nonMatchingEntries.length})?`
                              );
                              setShowConfirmDeleteModal(true);
                            }}
                            disabled={nonMatchingEntries.length === 0}
                            className="flex-1"
                          >
                            Eliminar fuera de condiciones ({nonMatchingEntries.length})
                          </Button>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Columna 1: Todos los recursos con alertas */}
                      <div>
                        <Accordion type="single" collapsible className="w-full" defaultValue="all-resources">
                          <AccordionItem value="all-resources">
                            <AccordionTrigger className="font-semibold">
                              Todos los recursos ({existingEntries.length})
                            </AccordionTrigger>
                            <AccordionContent>
                              <ScrollArea className="h-48 mt-2">
                                <DialogDescription className="px-2">
                                  {existingEntries.length > 0 ? (
                                    existingEntries.map((entry) => {
                                      const resource = entry.applies;
                                      if (Equipo.applies === 'Equipos') {
                                        return (
                                          <div key={crypto.randomUUID()} className="py-1 flex items-center gap-2">
                                            <Truck className="size-5" /> {resource.domain} {resource.serie} -{' '}
                                            {resource.intern_number}
                                          </div>
                                        );
                                      }
                                      if (Equipo.applies === 'Persona') {
                                        return (
                                          <div key={crypto.randomUUID()} className="py-1 flex items-center gap-2">
                                            <User className="size-5" />
                                            {resource.lastname} {resource.firstname} - {resource.cuil}
                                          </div>
                                        );
                                      }
                                    })
                                  ) : (
                                    <div className="text-center py-4">No hay alertas para mostrar</div>
                                  )}
                                </DialogDescription>
                              </ScrollArea>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>

                      {/* Columna 2: Recursos que no cumplen con las condiciones actuales */}
                      <div>
                        {(() => {
                          const matchingIds =
                            Equipo.applies === 'Persona'
                              ? matchingEmployees.map((e) => e.id)
                              : matchingVehicles.map((v) => v.id);

                          const nonMatchingEntries = existingEntries.filter(
                            (entry) => !matchingIds.includes(entry.applies.id)
                          );

                          return (
                            <Accordion type="single" collapsible className="w-full" defaultValue="non-matching">
                              <AccordionItem value="non-matching">
                                <AccordionTrigger className="font-semibold">
                                  Recursos fuera de condiciones ({nonMatchingEntries.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                  <ScrollArea className="h-48 mt-2">
                                    <DialogDescription className="px-2">
                                      {nonMatchingEntries.length > 0 ? (
                                        nonMatchingEntries.map((entry) => {
                                          const resource = entry.applies;
                                          if (Equipo.applies === 'Equipos') {
                                            return (
                                              <div key={crypto.randomUUID()} className="py-1 flex items-center gap-2">
                                                <Truck className="size-5" /> {resource.domain} {resource.serie} -{' '}
                                                {resource.intern_number}
                                              </div>
                                            );
                                          }
                                          if (Equipo.applies === 'Persona') {
                                            return (
                                              <div key={crypto.randomUUID()} className="py-1 flex items-center gap-2">
                                                <User className="size-5" /> {resource.lastname} {resource.firstname} -{' '}
                                                {resource.cuil}
                                              </div>
                                            );
                                          }
                                        })
                                      ) : (
                                        <div className="text-center py-4">
                                          Todos los recursos con alertas cumplen las condiciones actuales
                                        </div>
                                      )}
                                    </DialogDescription>
                                  </ScrollArea>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel ref={closeAlertModalRef}>Cancelar</AlertDialogCancel>
                {!Equipo.special && (
                  <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} asChild>
                    <Button variant={'destructive'} onClick={() => handleDeleteAlerts()}>
                      Eliminar todas las alertas
                    </Button>
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger disabled={!(resourcesToInsert.length > 0) || Equipo.applies === 'Empresa'} asChild>
              <Button className="self-end">
                {!(resourcesToInsert.length > 0) || Equipo.applies === 'Empresa'
                  ? 'Todos los recursos ya tienen alerta'
                  : 'Generar Alertas'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Estas totalmente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción generara una alerta en todos los recursos que no las tengan generadas.
                </AlertDialogDescription>
                <AlertDialogDescription>
                  {resourcesToInsert.length > 0 ? (
                    <>
                      <CardTitle className="text-md underline mb-1">
                        Los siguientes recursos no tienen la alerta generada:
                      </CardTitle>
                      {resourcesToInsert.map((resource) => {
                        if (Equipo.applies === 'Equipos') {
                          return (
                            <div key={crypto.randomUUID()} className="py-1 flex items-center gap-2">
                              <Truck className="size-5" /> {resource.domain} {resource.serie} - {resource.intern_number}
                            </div>
                          );
                        }
                        if (Equipo.applies === 'Persona') {
                          return (
                            <div key={crypto.randomUUID()}>
                              {resource.lastname} {resource.firstname} - {resource.cuil}
                            </div>
                          );
                        }
                      })}
                    </>
                  ) : (
                    <CardTitle className="text-md underline mb-1">
                      Todos los recursos tienen la alerta generada
                    </CardTitle>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button onClick={() => handleGenerateAlerts()}>Generar alertas</Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Modal para confirmar actualización con manejo de alertas */}
          <AlertDialog open={showAlertsUpdateModal} onOpenChange={setShowAlertsUpdateModal}>
            <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Actualizar documento y gestionar alertas</AlertDialogTitle>
                <AlertDialogDescription>
                  Al modificar las condiciones del documento, se han detectado cambios en las alertas. Por favor,
                  seleccione cómo desea proceder:
                </AlertDialogDescription>

                {/* Contenido del modal */}
                <DialogDescription className="mt-4 space-y-4">
                  {/* Recursos que necesitan alertas nuevas */}
                  {resourcesNeedingAlerts.length > 0 && (
                    <div className="border p-4 rounded-md">
                      <CardTitle className="text-md underline mb-1">
                        Recursos que necesitan alertas nuevas ({resourcesNeedingAlerts.length}):
                      </CardTitle>
                      <div className="max-h-[200px] overflow-y-auto">
                        {resourcesNeedingAlerts.map((resource) => {
                          if (Equipo.applies === 'Equipos') {
                            return (
                              <div
                                key={crypto.randomUUID()}
                                className="py-1 px-2 border-b last:border-b-0 flex items-center gap-2"
                              >
                                <Truck className="size-5" /> {resource.domain} {resource.serie} -{' '}
                                {resource.intern_number}
                              </div>
                            );
                          }
                          if (Equipo.applies === 'Persona') {
                            return (
                              <div
                                key={crypto.randomUUID()}
                                className="py-1 px-2 border-b last:border-b-0 flex items-center gap-2"
                              >
                                <User className="size-5" /> {resource.lastname} {resource.firstname} - {resource.cuil}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recursos que necesitan eliminar alertas */}
                  {resourcesNeedingDeletion.length > 0 && (
                    <div className="border p-4 rounded-md">
                      <CardTitle className="text-md mb-2">
                        Recursos que perderán alertas ({resourcesNeedingDeletion.length}):
                      </CardTitle>
                      <div className="max-h-[200px] overflow-y-auto">
                        {resourcesNeedingDeletion.map((resource) => {
                          if (Equipo.applies === 'Equipos') {
                            return (
                              <div
                                key={crypto.randomUUID()}
                                className="py-1 px-2 border-b last:border-b-0 flex items-center gap-2"
                              >
                                <Truck className="size-5" /> {resource.domain} {resource.serie} -{' '}
                                {resource.intern_number}
                              </div>
                            );
                          }
                          if (Equipo.applies === 'Persona') {
                            return (
                              <div
                                key={crypto.randomUUID()}
                                className="py-1 px-2 border-b last:border-b-0 flex items-center gap-2"
                              >
                                <User className="size-5" /> {resource.lastname} {resource.firstname} - {resource.cuil}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                </DialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <Button variant="outline" onClick={() => handleAlertsUpdate(false)}>
                  {resourcesNeedingAlerts.length > 0 && resourcesNeedingDeletion.length > 0
                    ? 'Modificar sin manejar alertas'
                    : resourcesNeedingDeletion.length > 0
                      ? 'Modificar sin eliminar alertas'
                      : resourcesNeedingAlerts.length > 0
                        ? 'Modificar sin crear alertas'
                        : 'Modificar'}
                </Button>
                <Button variant="destructive" onClick={() => handleAlertsUpdate(true)}>
                  {resourcesNeedingAlerts.length > 0 && resourcesNeedingDeletion.length > 0
                    ? 'Modificar y manejar alertas'
                    : resourcesNeedingDeletion.length > 0
                      ? 'Modificar y eliminar alertas'
                      : resourcesNeedingAlerts.length > 0
                        ? 'Modificar y crear alertas'
                        : 'Modificar'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
