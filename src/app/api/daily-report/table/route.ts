import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  //console.log('company_id', company_id);
  try {
    let { data: dailyReports, error } = await supabase
      .from('dailyreport')
      .select(
        `
        id,
        date,
        company_id,
        status,
        dailyreportrows (
          id,
          item_id(id,item_name),
          customer_id(id, name),
          service_id(id,service_name),
          start_time,
          end_time,
          status,
          working_day,
          description,
          document_path,
          dailyreportemployeerelations (employee_id(id,firstname,lastname)),
          dailyreportequipmentrelations (equipment_id(id,intern_number))
          )
          `
      )
      .eq('company_id', company_id || '');

    if (error) {
      //console.log('Error fetching daily reports:', error);
      throw new Error(JSON.stringify(error));
    }

    return NextResponse.json({ dailyReports });
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    return NextResponse.json({ error: 'Failed to fetch daily reports' }, { status: 500 });
  }
}
