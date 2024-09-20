import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  const user_id = searchParams.get('user');
  const employee_id = searchParams.get('employee_id'); 
  if(employee_id){
    try {
      let { data: employees_diagram, error } = await supabase
      .from('employees_diagram')
      .select(`*, diagram_type(
        *)`)  // Filters
      .eq('employee_id', employee_id)
      

      const data = employees_diagram;

      if (error) {
        throw new Error(JSON.stringify(error));
      }
      return Response.json({ data });
    } catch (error) {
      console.log(error);
    }
  }

  try {
    let { data: employees_diagram, error } = await supabase
    .from('employees_diagram')
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
  const supabase = supabaseServer();
  const bodyData = await request.json()

  try {
    const { data, error } = await supabase
    .from('employees_diagram')
    .insert([
       { employee_id: bodyData.employee, diagram_type: bodyData.event_diagram, day: bodyData.day, month: bodyData.month, year: bodyData.year },
     ])


    if(!error){ return Response.json(data)}
    console.log(error)

  } catch (error) {
    console.log(error)
  }

}

export async function PUT(request:NextRequest) {
  const supabase = supabaseServer();
  const bodyData = await request.json()
  try {
    const { data, error } = await supabase
    .from('employees_diagram')
    .update({ diagram_type: bodyData.event_diagram })
    .eq('id', bodyData.id)
    
    if(!error){ return Response.json(data)}
    console.log(error)
  } catch (error) {
    console.log(error)
  }
  
}