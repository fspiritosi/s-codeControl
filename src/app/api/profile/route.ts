import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('user');

  try {
    // Verificar si el userId está presente en los parámetros de búsqueda
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Obtener el perfil del usuario
    const { data: ownerUser, error: profileError } = await supabase.from('profile').select('*').eq('id', userId);

    if (profileError) {
      throw new Error(JSON.stringify(profileError));
    }

    return NextResponse.json({ data: ownerUser });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
