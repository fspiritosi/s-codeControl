import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  const user_id = searchParams.get('user');
  const id = params.id;
  // console.log(id); //AQUI ME QUEDE

  try {
    let { data: employee, error } = await supabase
      .from('employees')
      .select(
        `*,guild(id,name),covenant(id,name),category(id, name), city (
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
      .eq('company_id', company_id || '')
      .eq('id', id);

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ employee });
  } catch (error) {
    console.log(error);
  }
}
