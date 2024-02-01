import { Employee } from '@/types/types';
import { supabase } from '../../supabase/supabase';
import { useEdgeFunctions } from './useEdgeFunctions';
import { useLoggedUserStore } from '@/store/loggedUser';


export const useEmployeesData = () => {
    const {errorTranslate} = useEdgeFunctions()
    const company = useLoggedUserStore(state => state.actualCompany)
    
return{
    createEmployee: async (employee: Employee) => {
        // console.log(employee)
        const { data, error } = await supabase
        .from('companies_employees')
        .insert({...employee,
            company_id: company?.id,
        })
        console.log(data)

        if (error) {
            console.log(error)
            const message = await errorTranslate(error.message)
            throw new Error(String(message).replaceAll('"', ''))
          }
        return data
    }
}
};
