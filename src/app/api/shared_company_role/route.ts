import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('company_id');
  const profile_id = searchParams.get('profile_id');

  // console.log('company_id', company_id);
  // console.log('profile_id', profile_id);

  if (!company_id) {
    return NextResponse.json({ error: ['Company not found'] });
  }

  try {
    let { data: shared_user, error } = await supabase
      .from('share_company_users')
      .select('*')
      .eq('company_id', company_id || '')
      .eq('profile_id', profile_id || '');

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return NextResponse.json({ shared_user });
  } catch (error) {
    console.error('Error fetching equipments:', error);
    return NextResponse.json({ error: ['An error occurred while fetching equipments'] });
  }
}
