import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  const company_id = searchParams.get('company_id');
  //console.log('date', date);
  //console.log('company_id', company_id);

  try {
    let { data: existingReport, error } = await supabase
      .from('dailyreport' as any)
      .select('*')
      .eq('date', date)
      .eq('company_id', company_id)
      .single(); // Asumimos que solo debería haber un reporte diario por fecha y compañía

    if (error && error.code !== 'PGRST116') {
      // PGRST116 es el código de error para "no rows found"
      throw new Error(JSON.stringify(error));
    }

    const exists = !!existingReport;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking daily report date:', error);
    return NextResponse.json({ error: 'Failed to check daily report date' }, { status: 500 });
  }
}
