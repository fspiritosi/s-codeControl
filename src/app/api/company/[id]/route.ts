import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  const id = params.id;
  try {
    let { data: companies, error } = await supabase
      .from('company')
      .select('*,city(name)')
      .eq('id', company_id || '');
    const data = companies;
    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ data });
  } catch (error) {
    console.log(error);
  }
}
