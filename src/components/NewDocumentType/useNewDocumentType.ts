'use client';

import {
  fetchAllCategories,
  fetchCovenants,
  fetchCustomers,
  fetchGuilds,
  fetchHierrarchicalPositions,
  fetchProvinces,
  fetchTypeVehicles,
  fetchTypesOfVehicles,
  fetchVehicleBrands,
  fetchVehicleModels,
  fetchWorkDiagrams,
} from '@/app/server/GET/actions';
import { RpcFilter, fetchEmployeesWithFilters, fetchVehiclesWithFilters } from '@/lib/documentFilters';
import { handleSupabaseError } from '@/lib/errorHandler';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { zodResolver } from '@hookform/resolvers/zod';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '../../../supabase/supabase';
import { baseEmployeePropertiesConfig, baseVehiclePropertiesConfig, relationMeta, defaultValues } from './constants';
import { formatName, formatDescription } from './helpers';

export type Condition = {
  property: string;
  values: string[];
  id: string;
};

type OptionItem = { value: string; label: string };

export function useNewDocumentType(codeControlClient?: boolean, optionChildrenProp?: string) {
  const [special, setSpecial] = useState(false);
  const router = useRouter();
  const fetchDocumentTypes = useCountriesStore((state) => state.documentTypes);
  const fetchDocuments = useLoggedUserStore((state) => state.documetsFetch);

  const selectOptions = optionChildrenProp === 'all' ? 'Personas, Equipos o Empresa' : optionChildrenProp;
  const [items, setItems] = useState(defaultValues);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const employeePropertiesConfig = baseEmployeePropertiesConfig;
  const vehiclePropertiesConfig = baseVehiclePropertiesConfig;

  const isOptional = items.length < 5;
  const FormSchema = z.object({
    name: z.string({ required_error: 'Este campo es requerido' })
      .min(3, { message: 'El nombre debe contener mas de 3 caracteres' })
      .max(50, { message: 'El nombre debe contener menos de 50 caracteres' }),
    applies: z.enum(['Persona', 'Equipos', 'Empresa'], { required_error: 'Este campo es requerido' }),
    multiresource: isOptional ? z.boolean().optional() : z.boolean({ required_error: 'Se debe seleccionar una opcion' }),
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

  // State
  const [down, setDown] = useState(false);
  const [showEmployeePreview, setShowEmployeePreview] = useState(false);
  const [showVehiclePreview, setShowVehiclePreview] = useState(false);
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [vehicleCount, setVehicleCount] = useState<number | null>(null);
  const [previewEmployees, setPreviewEmployees] = useState<any[]>([]);
  const [previewVehicles, setPreviewVehicles] = useState<any[]>([]);
  const [optionsCache, setOptionsCache] = useState<Record<string, OptionItem[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});
  const [isCalculatingCount, setIsCalculatingCount] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Prepare conditions for storage
  function prepareConditionsForStorage() {
    const validConditions = conditions.filter((c) => c.property && c.values && c.values.length > 0);
    if (validConditions.length === 0) return null;
    return validConditions.map((condition) => {
      const propConfig = employeePropertiesConfig.find((p) => p.label === condition.property);
      if (!propConfig) return null;
      const isRelation = ['contractor_employee', 'province', 'hierarchical_position', 'category', 'guild', 'covenant', 'city', 'company_position'].includes(propConfig.accessor_key);
      const isArrayRelation = ['contractor_employee'].includes(propConfig.accessor_key);
      let reference_values: { id: string; value: string }[] = [];
      const meta = relationMeta[propConfig.accessor_key] || null;
      return {
        property_key: propConfig.accessor_key,
        values: condition.values,
        reference_values,
        ids: reference_values.length ? reference_values.map((r) => r.id) : condition.values,
        is_relation: isRelation,
        is_array_relation: isArrayRelation,
        relation_type: meta ? meta.relation_type : 'direct',
        relation_table: meta?.relation_table || null,
        column_on_employees: meta?.column_on_employees || null,
        column_on_relation: meta?.column_on_relation || null,
        filter_column: meta?.filter_column || propConfig.accessor_key,
        property_label: condition.property,
      };
    }).filter(Boolean);
  }

  function prepareVehicleConditionsForStorage() {
    const validConditions = conditions.filter((c) => c.property && c.values.length);
    if (validConditions.length === 0) return null;
    const relationKeys = ['contractor_equipment', 'brand', 'model', 'type', 'types_of_vehicles'];
    const arrayRelationKeys = ['contractor_equipment'];
    return validConditions.map((condition) => {
      const propConfig = vehiclePropertiesConfig.find((p) => p.label === condition.property);
      if (!propConfig) return null;
      const isRelation = relationKeys.includes(propConfig.accessor_key);
      const isArrayRelation = arrayRelationKeys.includes(propConfig.accessor_key);
      let reference_values: { id: string; value: string }[] = [];
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
    }).filter(Boolean);
  }

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    const serializedConditions = form.getValues('applies') === 'Equipos'
      ? prepareVehicleConditionsForStorage()
      : prepareConditionsForStorage();
    const company_id = Cookies.get('actualComp');
    const formattedValues = {
      ...values,
      name: formatName(values.name),
      description: formatDescription(values.description),
      company_id,
      multiresource: isOptional ? false : values.multiresource,
      mandatory: isOptional ? true : values.mandatory,
      special: isOptional ? false : values.special,
      down_document: isOptional ? false : values.down_document,
      private: values.private,
      conditions: serializedConditions ? serializedConditions : null,
    };
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
        success: () => {
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
        error: (error) => error,
      }
    );
  }

  // Lazy load options
  const ensureOptionsLoaded = async (accessor_key: string, applies: 'Persona' | 'Equipos') => {
    const cacheKey = `${applies}_${accessor_key}`;
    if (optionsCache[cacheKey]) return optionsCache[cacheKey];
    if (loadingOptions[cacheKey]) return [];
    try {
      setLoadingOptions((prev) => ({ ...prev, [cacheKey]: true }));
      let options: OptionItem[] = [];
      if (applies === 'Persona') {
        switch (accessor_key) {
          case 'workflow_diagram': { const data = await fetchWorkDiagrams(); options = data.map((d: any) => ({ value: String(d.id), label: d.name })); break; }
          case 'guild': { const data = await fetchGuilds(); options = data.filter((g: any) => g.name).map((g: any) => ({ value: String(g.id), label: g.name! })); break; }
          case 'covenant': { const data = await fetchCovenants(); options = data.map((c: any) => ({ value: String(c.id), label: c.name! })); break; }
          case 'category': { const data = await fetchAllCategories(); options = data.map((c: any) => ({ value: String(c.id), label: c.name! })); break; }
          case 'hierarchical_position': { const data = await fetchHierrarchicalPositions(); options = data.map((h: any) => ({ value: String(h.id), label: h.name })); break; }
          case 'contractor_employee': { const data = await fetchCustomers(); options = data.map((c: any) => ({ value: String(c.id), label: c.name })); break; }
          case 'province': { const data = await fetchProvinces(); options = data.map((p: any) => ({ value: String(p.id), label: p.name.trim() })); break; }
          case 'gender': options = [{ value: 'Masculino', label: 'Masculino' }, { value: 'Femenino', label: 'Femenino' }, { value: 'No Declarado', label: 'No Declarado' }]; break;
          case 'marital_status': options = [{ value: 'Soltero', label: 'Soltero' }, { value: 'Casado', label: 'Casado' }, { value: 'Viudo', label: 'Viudo' }, { value: 'Divorciado', label: 'Divorciado' }, { value: 'Separado', label: 'Separado' }]; break;
          case 'nationality': options = [{ value: 'Argentina', label: 'Argentina' }, { value: 'Extranjero', label: 'Extranjero' }]; break;
          case 'document_type': options = [{ value: 'DNI', label: 'DNI' }, { value: 'LE', label: 'LE' }, { value: 'LC', label: 'LC' }, { value: 'PASAPORTE', label: 'PASAPORTE' }]; break;
          case 'level_of_education': options = [{ value: 'Primario', label: 'Primario' }, { value: 'Secundario', label: 'Secundario' }, { value: 'Terciario', label: 'Terciario' }, { value: 'Posgrado', label: 'Posgrado' }, { value: 'Universitario', label: 'Universitario' }]; break;
          case 'status': options = [{ value: 'Avalado', label: 'Avalado' }, { value: 'Completo', label: 'Completo' }, { value: 'Incompleto', label: 'Incompleto' }, { value: 'No avalado', label: 'No avalado' }, { value: 'Completo con doc vencida', label: 'Completo con doc vencida' }]; break;
          case 'type_of_contract': options = [{ value: 'Período de prueba', label: 'Período de prueba' }, { value: 'A tiempo indeterminado', label: 'A tiempo indeterminado' }, { value: 'Plazo fijo', label: 'Plazo fijo' }]; break;
          default: console.warn(`[LAZY LOAD] Unknown: ${accessor_key}`);
        }
      } else if (applies === 'Equipos') {
        switch (accessor_key) {
          case 'brand': { const data = await fetchVehicleBrands(); options = data.map((b: any) => ({ value: String(b.id), label: b.name! })); break; }
          case 'model': { const data = await fetchVehicleModels(); options = data.map((m: any) => ({ value: String(m.id), label: m.name! })); break; }
          case 'type': { const data = await fetchTypeVehicles(); options = data.map((t: any) => ({ value: String(t.id), label: t.name! })); break; }
          case 'types_of_vehicles': { const data = await fetchTypesOfVehicles(); options = data.map((t: any) => ({ value: String(t.id), label: t.name! })); break; }
          case 'contractor_equipment': { const data = await fetchCustomers(); options = data.map((c: any) => ({ value: String(c.id), label: c.name! })); break; }
          default: console.warn(`[LAZY LOAD] Unknown: ${accessor_key}`);
        }
      }
      setOptionsCache((prev) => ({ ...prev, [cacheKey]: options }));
      return options;
    } catch (error) {
      console.error(`[LAZY LOAD] Error:`, error);
      return [];
    } finally {
      setLoadingOptions((prev) => ({ ...prev, [cacheKey]: false }));
    }
  };

  const getPropertyOptions = (propertyLabel: string, applies: 'Persona' | 'Equipos'): OptionItem[] => {
    const config = applies === 'Persona'
      ? employeePropertiesConfig.find((p) => p.label === propertyLabel)
      : vehiclePropertiesConfig.find((p) => p.label === propertyLabel);
    if (!config) return [];
    const cacheKey = `${applies}_${config.accessor_key}`;
    return optionsCache[cacheKey] || [];
  };

  const computeCountWithRPC = async (updatedConditions?: Condition[]) => {
    const conditionsToUse = updatedConditions || conditions;
    if (!special || conditionsToUse.length === 0) {
      if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
      setEmployeeCount(null); setVehicleCount(null); setPreviewEmployees([]); setPreviewVehicles([]); setIsCalculatingCount(false);
      return;
    }
    const companyId = Cookies.get('actualComp');
    if (!companyId) return;
    const applies = form.getValues('applies');
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;
    setIsCalculatingCount(true);
    try {
      if (applies === 'Persona') {
        const rpcFilters: RpcFilter[] = conditionsToUse.filter((c) => c.property && c.values.length > 0)
          .map((c) => { const config = employeePropertiesConfig?.find((p) => p.label === c.property); return config ? { property: config.accessor_key, values: c.values } : null; })
          .filter(Boolean) as RpcFilter[];
        const filtered = await fetchEmployeesWithFilters(companyId, rpcFilters);
        if (signal.aborted) return;
        setEmployeeCount(filtered.length); setPreviewEmployees(filtered); setIsCalculatingCount(false); abortControllerRef.current = null;
      } else if (applies === 'Equipos') {
        const rpcFilters: RpcFilter[] = conditionsToUse.filter((c) => c.property && c.values.length > 0)
          .map((c) => { const config = vehiclePropertiesConfig?.find((p) => p.label === c.property); return config ? { property: config.accessor_key, values: c.values } : null; })
          .filter(Boolean) as RpcFilter[];
        const filtered = await fetchVehiclesWithFilters(companyId, rpcFilters);
        if (signal.aborted) return;
        setVehicleCount(filtered.length); setPreviewVehicles(filtered); setIsCalculatingCount(false); abortControllerRef.current = null;
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || signal.aborted) return;
      console.error('[RPC COUNT] Error:', error);
      setIsCalculatingCount(false); abortControllerRef.current = null;
    }
  };

  const updateConditionValues = (id: string, values: string[]) => {
    const updated = conditions.map((c) => c.id === id ? { ...c, values } : c);
    setConditions(updated);
    computeCountWithRPC(updated);
  };

  const removeCondition = (id: string) => {
    const updated = conditions.filter((c) => c.id !== id);
    setConditions(updated);
    computeCountWithRPC(updated);
  };

  const updateCondition = (id: string, field: 'property' | 'value', value: string) => {
    setConditions(conditions.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const handlePropertySelect = async (conditionId: string, propertyLabel: string) => {
    const updated = conditions.map((c) => c.id === conditionId ? { ...c, property: propertyLabel, values: [] } : c);
    setConditions(updated);
    const applies = form.getValues('applies');
    if (applies === 'Persona' || applies === 'Equipos') {
      const config = applies === 'Persona'
        ? employeePropertiesConfig.find((p) => p.label === propertyLabel)
        : vehiclePropertiesConfig.find((p) => p.label === propertyLabel);
      if (config) await ensureOptionsLoaded(config.accessor_key, applies);
    }
    computeCountWithRPC(updated);
  };

  const addCondition = () => {
    const newCondition = { property: '', values: [], id: Date.now().toString() };
    setConditions([...conditions, newCondition]);
  };

  return {
    form, items, setItems, special, setSpecial, down, setDown, conditions,
    showEmployeePreview, setShowEmployeePreview, showVehiclePreview, setShowVehiclePreview,
    employeeCount, vehicleCount, previewEmployees, previewVehicles,
    optionsCache, loadingOptions, isCalculatingCount,
    employeePropertiesConfig, vehiclePropertiesConfig,
    selectOptions, isOptional, onSubmit,
    getPropertyOptions, updateConditionValues, removeCondition,
    updateCondition, handlePropertySelect, addCondition, ensureOptionsLoaded,
    computeCountWithRPC,
  };
}
