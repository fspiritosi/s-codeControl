import { Employee } from '@/types/types';
import { supabase } from '../../supabase/supabase';
import { useEdgeFunctions } from './useEdgeFunctions';
import { useLoggedUserStore } from '@/store/loggedUser';


export const useEmployeesData = () => {
    const {errorTranslate} = useEdgeFunctions()
    const company = useLoggedUserStore(state => state.actualCompany)
    
return{
    createEmployee: async (employee: Employee) => {
        const { data, error } = await supabase
        .from('employees')
        .insert({...employee,
            company_id: company?.id,
        })

        if (error) {
            const message = await errorTranslate(error.message)
            throw new Error(String(message).replaceAll('"', ''))
          }
        return data
    }
}
};
