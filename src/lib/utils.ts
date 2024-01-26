import { useEdgeFunctions } from '@/hooks/useEdgeFunctions'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { supabase } from '../../supabase/supabase'
// eslint-disable-next-line react-hooks/rules-of-hooks
const {errorTranslate} = useEdgeFunctions()

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
