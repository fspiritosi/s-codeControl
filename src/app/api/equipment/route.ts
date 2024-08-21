import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  console.log(company_id);
  try {
    let { data: equipments, error } = await supabase
      .from('vehicles')
      .select(
        `*,
      types_of_vehicles(name),
      brand_vehicles(name),
      model_vehicles(name)`
      )
      .eq('company_id', company_id);

    const data = equipments;
    
    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ data });
  } catch (error) {}
}
