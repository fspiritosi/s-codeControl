import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    let { data: diagram_type, error } = await supabase
      .from('diagram_type')
      .select('*')
      .eq('company_id', company_id || '');

    const data = diagram_type;

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return Response.json({ data });
  } catch (error) {
    console.log(error);
  }
}

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const { name, color, short_description, work_active } = await request.json();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const { data, error } = await supabase
      .from('diagram_type')
      .insert([{ name, company_id, color, short_description, work_active }] as any);

    if (!error) {
      return Response.json(data);
    }
    console.log(error);
  } catch (error) {
    console.log(error);
  }
}

export async function PUT(request: NextRequest) {
  const supabase = supabaseServer();
  const { id, name, color, short_description, work_active } = await request.json();
  const searchParams = request.nextUrl.searchParams;

  try {
    const { data, error } = await supabase
      .from('diagram_type')
      .update({ name, color, short_description, work_active })
      .eq('id', id);

    if (!error) {
      return Response.json(data);
    }
    console.log(error);
  } catch (error) {
    console.log(error);
  }
}
