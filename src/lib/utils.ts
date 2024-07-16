'use strict';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLoggedUserStore } from '@/store/loggedUser';
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

// export function getState(){
//   const estado = useLoggedUserStore((state) => state )
//   return estado
// } 

