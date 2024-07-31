'use strict';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabaseServer } from './supabase/server';
// eslint-disable-next-line react-hooks/rules-of-hooks
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatCompanyName(companyName: string): string {
  // Transforma el nombre de la empresa eliminando los guiones bajos y convirtiendo a mayúsculas
  return companyName.replace(/_/g, ' ').toUpperCase();
}
export function validarCUIL(cuil: string) {
  // Elimina guiones y espacios
  cuil = cuil.replace(/[-\s]/g, '');

  // Verifica la longitud
  if (cuil.length !== 11) {
    return false;
  }

  // Calcula el dígito verificador
  const coeficientes = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += parseInt(cuil[i]) * coeficientes[i];
  }
  let digitoVerificador = 11 - (suma % 11);
  if (digitoVerificador === 11) {
    digitoVerificador = 0;
  }

  // Compara con el último dígito
  return parseInt(cuil[10]) === digitoVerificador;
}

export const FetchSharedUsers = async (companyId: string) => {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from('share_company_users')
    .select(
      `*,customer_id(*),profile_id(*),company_id(*,
        owner_id(*),
      share_company_users(*,
        profile(*)
      ),
      city (
        name,
        id
      ),
      province_id (
        name,
        id
      ),
      companies_employees (
        employees(
          *,
          city (
            name
          ),
          province(
            name
          ),
          workflow_diagram(
            name
          ),
          hierarchical_position(
            name
          ),
          birthplace(
            name
          ),
          contractor_employee(
            customers(
              *
            )
          )
        )
      )
    )`
    )
    .eq('company_id', companyId);

  if (error) {
    // return error;
    console.log(error);
    return [];
  } else {
    return data;
  }
};

export async function getActualRole(companyId: string, profile: string) {
  const sharedUsers = await FetchSharedUsers(companyId);
  const user = sharedUsers?.find((e) => e.profile_id.id === profile);

  if (user?.role) {
    return user?.role;
  } else {
    return 'Owner';
  }
}
