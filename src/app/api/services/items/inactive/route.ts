import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const customer_service_id = searchParams.get('customer_service_id');
  const body = await request.json();
  const { is_active } = body;

  try {
    // Obtener todos los ítems asociados al customer_service_id
    let { data: items, error: fetchError } = await supabase
      .from('service_items')
      .select('id')
      .eq('customer_service_id', customer_service_id || '');

    if (fetchError) {
      throw new Error(JSON.stringify(fetchError));
    }

    // Actualizar cada ítem individualmente
    if (items) {
      for (const item of items) {
        let { error: updateError } = await supabase
          .from('service_items')
          .update({ is_active: is_active })
          .eq('id', item.id);

        if (updateError) {
          throw new Error(JSON.stringify(updateError));
        }
      }
    }

    return new NextResponse(JSON.stringify({ message: 'Items actualizados correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.log(error);
    return new NextResponse(JSON.stringify({ error: error as any }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
