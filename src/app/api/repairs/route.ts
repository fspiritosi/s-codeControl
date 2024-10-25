import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    let { data: types_of_repairs, error } = await supabase
      .from('types_of_repairs')
      .select('*')
      .eq('company_id', company_id || '');

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
  const id = searchParams.get('id');
  const body = await request.json();

  try {
    const { data: types_of_repairs, error } = await supabase
      .from('types_of_repairs')
      .update(body)
      .eq('id', id || '');

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ types_of_repairs });
  } catch (error) {
    console.log(error);
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  // console.log('keloke', id);

  try {
    const { data: types_of_repairs, error } = await supabase
      .from('types_of_repairs')
      .delete()
      .eq('id', id || '');

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ types_of_repairs });
  } catch (error) {
    console.log(error);
  }
}
