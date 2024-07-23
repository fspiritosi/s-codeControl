import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  const user_id = searchParams.get('user');
  //console.log(user_id); //AQUI ME QUEDE
  try {
    let { data: employees_diagram, error } = await supabase
    .from('employees_diagram')
    // .select('*')
    .select(`*,
        employee_id,
        employees (
         *
        ),
        diagram_type(
        *)
      `)  // Filters
        

    const data = employees_diagram;

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return Response.json({ data });
  } catch (error) {
    console.log(error);
  }
}


export async function POST(request: NextRequest){
  //const supabase = supabaseServer();
  const data = request.json()
  console.log(data)
}