import {
  filterEmployeesByConditions,
  filterVehiclesByConditions,
} from '@/app/server/GET/actions';

export type RpcFilter = {
  property: string;
  values: string[];
};

export async function fetchEmployeesWithFilters(companyId: string, filters: RpcFilter[]) {
  const data = await filterEmployeesByConditions(companyId, filters);
  return data ?? [];
}

export async function fetchVehiclesWithFilters(companyId: string, filters: RpcFilter[]) {
  const data = await filterVehiclesByConditions(companyId, filters);
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
