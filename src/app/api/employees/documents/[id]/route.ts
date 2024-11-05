import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  const id = params.id;

  try {
    let { data: documents, error } = await supabase
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
      .eq('employees.company_id', company_id || '')
      .eq('id', id);

    const data = documents;

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ data });
  } catch (error) {
    console.log(error);
  }
}
