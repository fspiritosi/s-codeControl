'use client';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useEffect, useRef } from 'react';
import { useCountriesStore } from './countries';
import { useLoggedUserStore } from './loggedUser';

const formattedEmployees = (employees: any) => {
  const employee = employees?.map((employees: any) => {
    return {
      full_name: employees?.lastname + ' ' + employees?.firstname,
      id: employees?.id,
      email: employees?.email,
      cuil: employees?.cuil,
      document_number: employees?.document_number,
      hierarchical_position: employees?.hierarchical_position?.name,
      company_position: employees?.company_position,
      normal_hours: employees?.normal_hours,
      type_of_contract: employees?.type_of_contract,
      allocated_to: employees?.contractor_employee?.map(({ contractors }: any) => contractors?.name)?.join(', '),
      picture: employees?.picture,
      nationality: employees?.nationality,
      lastname: employees?.lastname,
      firstname: employees?.firstname,
      document_type: employees?.document_type,
      birthplace: employees?.birthplace?.name?.trim(),
      gender: employees?.gender,
      marital_status: employees?.marital_status,
      level_of_education: employees?.level_of_education,
      street: employees?.street,
      street_number: employees?.street_number,
      province: employees?.province?.name?.trim(),
      postal_code: employees?.postal_code,
      phone: employees?.phone,
      file: employees?.file,
      date_of_admission: employees?.date_of_admission,
      affiliate_status: employees?.affiliate_status,
      city: employees?.city?.name?.trim(),
      hierrical_position: employees?.hierarchical_position?.name,
      workflow_diagram: employees?.workflow_diagram?.name,
      contractor_employee: employees?.contractor_employee?.map(({ contractors }: any) => contractors?.id),
      is_active: employees?.is_active,
      reason_for_termination: employees?.reason_for_termination,
      termination_date: employees?.termination_date,
      status: employees?.status,
    };
  });

  return employee;
};

export default function InitEmployees({ active }: { active: boolean }) {
  const supabase = supabaseBrowser();
  const initState = useRef(false);
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);

  const fetchEmployees = async () => {
    let { data, error } = await supabase
      .from('employees')
      .select(
        `*, city (
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
            )`
      )
      .eq('company_id', actualCompany?.id || '')
      .eq('is_active', active);

    const employees = formattedEmployees(data);
    useLoggedUserStore.setState({ employeesToShow: employees });
    useLoggedUserStore.setState({ employees: employees });
  };
  const documentTypes = useCountriesStore((state) => state.documentTypes);
  useEffect(() => {
    if (!initState.current) {
      if (actualCompany?.id) {
        fetchEmployees();
      }
      documentTypes(actualCompany?.id || '');
    }
    initState.current = true;
  }, [actualCompany]);
  return <></>;
}
