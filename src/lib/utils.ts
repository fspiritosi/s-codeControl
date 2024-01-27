'use strict'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
// eslint-disable-next-line react-hooks/rules-of-hooks

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
