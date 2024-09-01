import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  if (!company_id) {
    return Response.json({ error: ['Company not found'] });
  }
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

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ equipments });
  } catch (error) {}
}

export async function PATCH(request: NextRequest, context: any) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  // const { params } = context

  console.log('KKASDASD');

  const body = await request.json();

  try {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .update({ condition: body.condition })
      .eq('id', body.vehicle_id);

    console.log('vehicles', vehicles);
    console.log('error', error);
    console.log('id', body.vehicle_id);

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ vehicles });
  } catch (error) {
    console.log(error);
  }
}
