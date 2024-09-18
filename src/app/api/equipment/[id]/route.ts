import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: any) {
  const supabase = supabaseServer();
  const { params } = context;
  //   const searchParams = request.nextUrl.searchParams;
  //   const company_id = searchParams.get('actual');

  try {
    let { data: equipments, error } = await supabase
      .from('vehicles')
      .select(
        `*,
          types_of_vehicles(name),
          brand_vehicles(name),
          model_vehicles(name)`
      )
      .eq('id', params.id);

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return NextResponse.json({ equipments });
  } catch (error) {
    console.error('Error fetching equipments:', error);
    return NextResponse.json({ error: ['An error occurred while fetching equipments'] });
  }
}
