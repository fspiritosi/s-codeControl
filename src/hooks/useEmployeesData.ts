import { useLoggedUserStore } from '@/store/loggedUser'
import { Employee } from '@/types/types'
import { supabase } from '../../supabase/supabase'
import { useEdgeFunctions } from './useEdgeFunctions'

export const useEmployeesData = () => {
  const { errorTranslate } = useEdgeFunctions()
  const company = useLoggedUserStore(state => state.actualCompany)

  return {
    createEmployee: async (employee: Employee) => {
      const { data, error } = await supabase
        .from('employees')
        .insert({ ...employee, company_id: company?.id })

      if (error) {
        const message = await errorTranslate(error.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
      return data
    },
    updateEmployee: async (employee: Employee) => {
      console.log(employee, 'employee');
      const { data, error } = await supabase
        .from('employees')
        .update(employee)
        .eq('document_number', employee?.document_number)
        .select()
        
        console.log(data);
        
      if (error) {
        const message = await errorTranslate(error.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
      return data
    },
  }
}
