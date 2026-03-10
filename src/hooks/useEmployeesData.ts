import { useLoggedUserStore } from '@/store/loggedUser';
import { Employee } from '@/types/types';
import {
  createEmployee as createEmployeeAction,
  updateEmployeeByDocNumberFull,
  deleteContractorEmployee,
  insertContractorEmployee,
} from '@/app/server/UPDATE/actions';
import { useEdgeFunctions } from './useEdgeFunctions';

export const useEmployeesData = () => {
  const { errorTranslate } = useEdgeFunctions();
  const company = useLoggedUserStore((state) => state.actualCompany);

  return {
    createEmployee: async (employee: Employee) => {
      const { data, error } = await createEmployeeAction({
        ...employee,
        company_id: company?.id,
        allocated_to: employee.allocated_to ?? [],
      });

      if (error) {
        const message = await errorTranslate(error);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
    updateEmployee: async (employee: Employee, id?: string) => {
      if (Array.isArray(employee.allocated_to)) {
        const allocated_to = employee.allocated_to?.map((item: string) => {
          return { contractor_id: item, employee_id: id };
        });

        if (id) {
          // Delete existing allocations and re-insert
          for (const alloc of allocated_to) {
            await deleteContractorEmployee(id, alloc.contractor_id);
          }
          for (const alloc of allocated_to) {
            await insertContractorEmployee(id, alloc.contractor_id);
          }
        }
      }

      const { data, error } = await updateEmployeeByDocNumberFull(employee.document_number, employee);

      if (error) {
        const message = await errorTranslate(error);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
  };
};
