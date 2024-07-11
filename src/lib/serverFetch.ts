import { cookies } from 'next/headers';
import { supabase } from '../../supabase/supabase';

export async function getCompany() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data } = await supabase.from('profile').select('*').eq('email', session?.user.email);

  const { data: Companies, error } = await supabase.from('company').select(`*`).eq('owner_id', data?.[0]?.id);

  const companiesId = Companies?.filter((company) => company.by_defect === true)[0]?.id;

  return companiesId;
}

export async function getDocumentsEmployees() {
  const actualCompany = cookies().get('actualCompanyId')?.value;
  let { data, error } = await supabase
    .from('documents_employees')
    .select(
      `*,
  employees:employees(*,contractor_employee(
    customers(
      *
    )
  )),
  document_types:document_types(*)
`
    )
    .not('employees', 'is', null)
    .eq('employees.company_id', actualCompany);

  return data;
}

export async function getDocumentsEquipment() {
  const actualCompany = cookies().get('actualCompanyId')?.value;
  let { data, error } = await supabase
    .from('documents_equipment')
    .select(
      `*,
    document_types:document_types(*),
    applies(*,type(*),type_of_vehicle(*),model(*),brand(*))
    `
    )
    .eq('applies.company_id', actualCompany)
    .not('applies', 'is', null);

  return data;
}

export async function getEmployees() {
  const fisrtId = cookies().get('actualCompanyId')?.value;
  const secobndId = await getCompany();

  const actualCompany = cookies().get('actualCompanyId')?.value;
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
    .eq('company_id', actualCompany)
    .eq('is_active', true);

  return data;
}
