import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  const user_id = searchParams.get('user');
  const customer_service_id = searchParams.get('service');

  try {
    let { data: items, error } = await supabase
      .from('service_items')
      .select('*,item_measure_units(id,unit),customer_service_id(customer_id(id,name))')
      // Filters
      // .eq('customer_service_id', customer_service_id)
      .eq('company_id', company_id || '');

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ items });
  } catch (error) {
    console.log(error);
  }
}

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  let company_id = searchParams.get('actual');

  const user_id = searchParams.get('user');
  const sercices_id = searchParams.get('service');
  const body = await request.json();
  const { customer_service_id, item_name, item_description, item_measure_units, item_price, customer_id } = body;
  company_id = company_id ? company_id.replace(/['"]/g, '') : null;

  try {
    let { data: items, error } = await supabase.from('service_items').insert({
      customer_service_id: customer_service_id,
      // customer_id: customer_id,
      item_name: item_name,
      item_description: item_description,
      item_measure_units: item_measure_units,
      item_price: item_price,
      company_id: company_id,
    } as any);

    if (error) {
      console.error('Supabase Error:', error);
      throw new Error(JSON.stringify(error));
    }
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Catch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  const user_id = searchParams.get('user');
  const id = searchParams.get('id');
  const body = await request.json();
  const { item_name, item_description, item_measure_units, item_price, is_active, costumer_id } = body;

  try {
    let { data: items, error } = await supabase
      .from('service_items')
      .update({
        item_name: item_name,
        item_description: item_description,
        item_measure_units: item_measure_units,
        item_price: item_price,
        is_active: is_active,
        // costumer_id: costumer_id,
        // company_id: company_id
      })
      .eq('id', id || '');

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ items });
  } catch (error) {
    console.log(error);
  }
}
