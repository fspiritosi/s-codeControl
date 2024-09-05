import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  try {
    let { data: dailyreportemployeerelations, error } = await supabase
      .from('dailyreportemployeerelations')
      .select(`*`)
      

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ dailyreportemployeerelations });
  } catch (error) {}
}

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('actual');
  const {daily_report_row_id, employee_id } = await request.json();
  try {
    let { data, error } = await supabase
      .from('dailyreportemployeerelations')
      .insert([
        {
            daily_report_row_id,
            employee_id
        }
      ]);
    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ data });
  } catch (error) {}
}

export async function PUT(request: NextRequest) {
    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('actual');
    const { id, ...updateData } = await request.json(); 
  
    try {
      let { data, error } = await supabase
        .from('dailyreportemployeerelations')
        .update(updateData)
        .eq('id', id);
      if (error) {
        throw new Error(JSON.stringify(error));
      }
      return Response.json({ data });
    } catch (error) {}
  }

export async function DELETE(request: NextRequest) {
    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('actual');
    const { id } = await request.json();
    try {
      let { data, error } = await supabase
        .from('dailyreportemployeerelations')
        .delete()
        .eq('id', id);
      if (error) {
        throw new Error(JSON.stringify(error));
      }
      return Response.json({ data });
    } catch (error) {}
  }