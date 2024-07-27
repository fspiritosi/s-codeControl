import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  const user_id = searchParams.get('user');
  console.log(user_id); //AQUI ME QUEDE
  try {
    let { data: employees, error } = await supabase
      .from('employees')
      .select('*,guild(name),covenants(name),category(name)')
      // Filters
      .eq('company_id', company_id);

    const data = employees;

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ data });
  } catch (error) {
    console.log(error);
  }
}
