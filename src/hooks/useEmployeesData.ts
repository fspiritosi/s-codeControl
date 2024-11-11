import { useLoggedUserStore } from '@/store/loggedUser';
import { Employee } from '@/types/types';
import { supabase } from '../../supabase/supabase';
import { useEdgeFunctions } from './useEdgeFunctions';

export const useEmployeesData = () => {
  const { errorTranslate } = useEdgeFunctions();
  const company = useLoggedUserStore((state) => state.actualCompany);

  return {
    createEmployee: async (employee: Employee) => {
      const { data, error } = await supabase
        .from('employees')
        .insert({ ...employee, company_id: company?.id, allocated_to: employee.allocated_to ?? [] })
        .select();

      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
    updateEmployee: async (employee: Employee, id?: string) => {
      if (Array.isArray(employee.allocated_to)) {
        const allocated_to = employee.allocated_to?.map((item: any) => {
          return { contractor_id: item, employee_id: id };
        });

        await supabase.from('contractor_employee').delete().eq('employee_id', id);

        const { data, error } = await supabase.from('contractor_employee').insert(allocated_to).select();
      }

      //console.log(employee);
      const { data, error } = await supabase
        .from('employees')
        .update(employee)
        .eq('document_number', employee.document_number)
        .select();

      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
  };
};
