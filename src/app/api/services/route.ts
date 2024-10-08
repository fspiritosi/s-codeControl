import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  const user_id = searchParams.get('user');

  try {
    let { data: services, error } = await supabase
      .from('customer_services')
      .select('*')
      .eq('company_id', company_id || '');

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ services });
  } catch (error) {
    console.log(error);
  }
}

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  let company_id = searchParams.get('actual');
  const user_id = searchParams.get('user');
  const body = await request.json();
  const { service_name, service_start, service_validity, customer_id } = body;
  company_id = company_id ? company_id.replace(/['"]/g, '') : null;
  const date = new Date(service_validity);
  const date1 = new Date(service_start);
  const year1 = date1.getFullYear();
  const month1 = String(date1.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexados
  const day1 = String(date1.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexados
  const day = String(date.getDate()).padStart(2, '0');
  const formattedDate1 = `${year1}/${month1}/${day1}`;

  const formattedDate = `${year}/${month}/${day}`;

  try {
    let { data: services, error } = await supabase.from('customer_services').insert({
      company_id: company_id,
      customer_id: customer_id,
      service_name: service_name,
      service_start: formattedDate1,
      service_validity: formattedDate,
    });
    // Filters

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ services });
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
  const { service_name, customer_id, service_start, service_validity, is_active } = body;
  // const [day, month, year] = service_validity.split('/');
  // const serviceValidityDate = new Date(`${year}-${month}-${day}`);
  try {
    let { data: services, error } = await supabase
      .from('customer_services')
      .update({
        customer_id: customer_id,
        service_name: service_name,
        service_start: service_start,
        service_validity: service_validity,
        is_active: is_active,
      })
      .eq('id', id || '');

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ services });
  } catch (error) {
    console.log(error);
  }
}
