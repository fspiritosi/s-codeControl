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
      .select(`*`)
      .eq('company_id', company_id || '');

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return NextResponse.json({ dailyReports });
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    return NextResponse.json({ error: 'Failed to fetch daily reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('actual');
  const { date, company_id } = await request.json();

  try {
    // if (company_id !== companyId) {
    //   throw new Error('Company ID mismatch');
    // }

    let { data, error } = await supabase
      .from('dailyreport')
      .insert([
        {
          date,
          company_id,
        },
      ])
      .select();

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error inserting daily report:', error);
    return NextResponse.json({ error: 'Failed to insert daily report' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  // const companyId = searchParams.get('actual');
  const id = searchParams.get('id');
  //console.log('id', id);
  const { date, status } = await request.json();
  const statusPayload = status === 'cerrado' ? false : status;
  try {
    let { data, error } = await supabase
      .from('dailyreport')
      .update({ status: statusPayload })
      .eq('id', id || '');
    {
      upsert: true;
    }

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating daily report:', error);
    return NextResponse.json({ error: 'Failed to update daily report' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('actual');
  const { id } = await request.json();

  if (!companyId) {
    return new Response(JSON.stringify({ error: 'Company ID is required' }), { status: 400 });
  }

  try {
    const { data: dailyReport, error: fetchError } = await supabase
      .from('dailyreport')
      .select('company_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(JSON.stringify(fetchError));
    }

    if (!dailyReport) {
      return new Response(JSON.stringify({ error: 'Daily report not found' }), { status: 404 });
    }

    if (dailyReport.company_id !== companyId) {
      return new Response(JSON.stringify({ error: 'Company ID mismatch' }), { status: 403 });
    }

    const { data, error } = await supabase.from('dailyreport').delete().eq('id', id);

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
}
