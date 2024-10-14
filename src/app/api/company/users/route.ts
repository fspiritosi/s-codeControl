import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    let { data: company_users, error } = await supabase
      .from('share_company_users')
      .select('*,  profile_id(*)')
      .eq('company_id', company_id || '');

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ company_users });
  } catch (error) {
    console.log(error);
  }
}
