import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const { rowId, employees } = await request.json();

  try {
    let { data: dailyreportemployeerelations, error } = await supabase
      .from('dailyreportemployeerelations' as any)
      .select(`*`)
      .eq('daily_report_row_id', rowId)
      .in('employee_id', employees);

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    const exists = dailyreportemployeerelations && dailyreportemployeerelations.length > 0;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking relation employee:', error);
    return NextResponse.json({ error: 'Failed to check relation employee' }, { status: 500 });
  }
}
