import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Crear un nuevo registro en la tabla 'guild'
export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const { company_id, ...guildData } = await request.json();

  try {
    const { data, error } = await supabase.from('guild').insert([{ company_id, ...guildData }]);

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return NextResponse.json({ guild: data });
  } catch (error) {
    console.error('Error creating guild:', error);
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

// Leer registros de la tabla 'guild'
export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('company_id');

  //console.log(company_id,'company_id');

  try {
    if (!company_id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching guild:', error);
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

// Actualizar un registro existente en la tabla 'guild'
export async function PUT(request: NextRequest) {
  const supabase = supabaseServer();
  const { id, ...guildData } = await request.json();

  try {
    const { data, error } = await supabase.from('guild').update(guildData).eq('id', id);

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return NextResponse.json({ guild: data });
  } catch (error) {
    console.error('Error updating guild:', error);
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

// Eliminar un registro de la tabla 'guild'
export async function DELETE(request: NextRequest) {
  const supabase = supabaseServer();
  const { id } = await request.json();

  try {
    const { data, error } = await supabase.from('guild').delete().eq('id', id);

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return NextResponse.json({ guild: data });
  } catch (error) {
    console.error('Error deleting guild:', error);
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
