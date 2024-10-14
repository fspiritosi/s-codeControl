import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  const user_id = searchParams.get('user');

  try {
    let { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', company_id || '');

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ customers });
  } catch (error) {
    console.log(error);
  }
}
