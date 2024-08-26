import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  const user_id = searchParams.get('user');

  try {
    let { data: types_of_repairs, error } = await supabase
      .from('types_of_repairs')
      .select('*')
      .eq('company_id', company_id);


    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ types_of_repairs });
  } catch (error) {
    console.log(error);
  }
}

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const body = await request.json();


  try {
    const { data: types_of_repairs, error } = await supabase.from('types_of_repairs').insert(body).select();

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ types_of_repairs });
  } catch (error) {
    console.log(error);
  }
}

export async function PUT(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  const user_id = searchParams.get('user');
  const id = searchParams.get('id');
  const body = await request.json();
  //   const { service_name, customer_id, service_start, service_validity, is_active } = body;
  //   // const [day, month, year] = service_validity.split('/');
  //   // const serviceValidityDate = new Date(`${year}-${month}-${day}`);
  //   try {
  //     let { data: services, error } = await supabase
  //       .from('customer_services')
  //       .update({
  //         customer_id: customer_id,
  //         service_name: service_name,
  //         service_start: service_start,
  //         service_validity: service_validity,
  //         is_active: is_active,
  //       })
  //       .eq('id', id);

  //     if (error) {
  //       throw new Error(JSON.stringify(error));
  //     }
  //     return Response.json({ services });
  //   } catch (error) {
  //     console.log(error);
  //   }
}
