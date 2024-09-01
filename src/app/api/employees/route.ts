import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  const user_id = searchParams.get('user');
  // console.log(user_id); //AQUI ME QUEDE
  if (!company_id) {
    return Response.json({ error: 'company_id is required' });
  }
  try {
    let { data: employees, error } = await supabase
      .from('employees')
      // .select(
      //   `*,guild(name),covenants(name),category(name), city (
      //   name
      // ),
      // province(
      //   name
      // ),
      // workflow_diagram(
      //   name
      // ),
      // hierarchical_position(
      //   name
      // ),
      // birthplace(
      //   name
      // ),
      // contractor_employee(
      //   customers(
      //     *
      //   )
      // )`
      // )
      .select('*')
      // Filters
      .eq('company_id', company_id);
    //console.log(employees)
    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ employees });
  } catch (error) {
    console.log(error);
    return Response.json({ error });
  }
}
