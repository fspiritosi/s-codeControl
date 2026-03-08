import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();

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