import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const { rowId, equipment } = await request.json();

  try {
    let { data: dailyreportequipmentrelations, error } = await supabase
      .from('dailyreportequipmentrelations' as any)
      .select(`*`)
      .eq('daily_report_row_id', rowId)
      .in('equipment_id', equipment);

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    const exists = dailyreportequipmentrelations && dailyreportequipmentrelations.length > 0;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking relation equipment:', error);
    return NextResponse.json({ error: 'Failed to check relation equipment' }, { status: 500 });
  }
}
