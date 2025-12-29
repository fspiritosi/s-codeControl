import { supabaseBrowser } from './supabase/browser';

export type RpcFilter = {
  property: string;
  values: string[];
};

export async function fetchEmployeesWithFilters(companyId: string, filters: RpcFilter[]) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.rpc('filter_employees_by_conditions', {
    p_company_id: companyId,
    p_filters: filters,
  });
  if (error) throw error;
  return data ?? [];
}

export async function fetchVehiclesWithFilters(companyId: string, filters: RpcFilter[]) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.rpc('filter_vehicles_by_conditions', {
    p_company_id: companyId,
    p_filters: filters,
  });
  if (error) throw error;
  return data ?? [];
}

export async function countEmployeesWithFilters(companyId: string, filters: RpcFilter[]) {
  const result = await fetchEmployeesWithFilters(companyId, filters);
  return result.length;
}

export async function countVehiclesWithFilters(companyId: string, filters: RpcFilter[]) {
  const result = await fetchVehiclesWithFilters(companyId, filters);
  return result.length;
}
