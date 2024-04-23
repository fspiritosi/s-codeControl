
import { cookies } from 'next/headers'
import { supabase } from '../../supabase/supabase'


export async function getDocumentsEmployees() {
  const actualCompany = cookies().get('actualCompanyId')?.value
  let { data, error } = await supabase
    .from('documents_employees')
    .select(
      `*,
  employees:employees(*,contractor_employee(
    contractors(
      *
    )
  )),
  document_types:document_types(*)
`,
    )
    .not('employees', 'is', null)
    .eq('employees.company_id', actualCompany)

  return data
}

export async function getDocumentsEquipment() {
  const actualCompany = cookies().get('actualCompanyId')?.value
  let { data, error } = await supabase
    .from('documents_equipment')
    .select(
      `
    *,
    document_types:document_types(*),
    applies(*,type(*),type_of_vehicle(*),model(*),brand(*))
    `,
    )
    .eq('applies.company_id', actualCompany)
    .not('applies', 'is', null)

  return data
}

export async function getEmployees() {
  const actualCompany = cookies().get('actualCompanyId')?.value
  let { data, error } = await supabase
    .from('employees')
    .select(
      `*, city (
        nam
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
        contractors(
          *
        )
      )`,
    )
    .eq('company_id', actualCompany)
    .eq('is_active', true)

  return data
}

export async function getEquipment() {
  const actualCompany = cookies().get('actualCompanyId')?.value
  const { data, error: error2 } = await supabase
  .from('vehicles')
  .select('*')
  .eq('company_id', actualCompany)
  .eq('is_active', true)

  return data
}