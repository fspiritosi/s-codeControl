import { supabaseServer } from './../../../../lib/supabase/server';
import { NextRequest } from 'next/server';
import { supabase } from '../../../../../supabase/supabase';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  try {
    let { data: dailyreportequipmentrelations, error } = await supabase
      .from('dailyreportequipmentrelations')
      .select(`*`)
      
    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ dailyreportequipmentrelations });
  } catch (error) {}
}

export async function POST (request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('actual');
  const {daily_report_row_id, equipment_id } = await request.json();
  try {
    let { data, error } = await supabase
      .from('dailyreportequipmentrelations')
      .insert([
        {
            daily_report_row_id,
            equipment_id
        }
      ]);
    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ data });
  } catch (error) {}
}

export async function PUT(request: NextRequest){
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('actual');
    const { id, ...updateData } = await request.json(); 
  
    try {
      let { data, error } = await supabase
        .from('dailyreportequipmentrelations')
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
        .from('dailyreportequipmentrelations')
        .delete()
        .eq('id', id);
      if (error) {
        throw new Error(JSON.stringify(error));
      }
      return Response.json({ data });
    } catch (error) {}
}