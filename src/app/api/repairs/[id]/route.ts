import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest, context: any) {
  const supabase = supabaseServer();
  const { params } = context
  const id = params.id;
  const body = await request.json();

  try {
    const { data: types_of_repairs, error } = await supabase
      .from('types_of_repairs')
      .update(body)
      .eq('id', id);

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ types_of_repairs });
  } catch (error) {
    console.log(error);
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const supabase = supabaseServer();
  const { params } = context
  const id = params.id;

  try {
    const { data: types_of_repairs, error } = await supabase
      .from('types_of_repairs')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ types_of_repairs });
  } catch (error) {
    console.log(error);
  }
}