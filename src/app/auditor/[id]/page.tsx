import React from 'react'
import { supabase } from '../../../../supabase/supabase'

export default async function page({ params }: { params: { id: string } }) {
  let { data: documents_employees } = await supabase
    .from('documents_employees')
    .select(
      `
  *,
  document_types(*),
  applies(*,
    contractor_employee(
      contractors(
        *
        )
        ),
        company_id(*)
        )
        `,
    )
    .eq('id', params.id)
  console.log(documents_employees, 'id')

  return (
    <section>
      <h1>Auditar Documento</h1>
      {params.id}
      {/* <embed
        src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/document_files/12341234-AltaTempranaAFIP.pdf"
        className="w-[70vw] h-[90vh] max-h-[80vh] relative"
      /> */}
    </section>
  )
}
