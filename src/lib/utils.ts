'use strict'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
// eslint-disable-next-line react-hooks/rules-of-hooks

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatCompanyName(companyName: string): string {
  // Transforma el nombre de la empresa eliminando los guiones bajos y convirtiendo a mayúsculas
  return companyName.replace(/_/g, ' ').toUpperCase();
}
