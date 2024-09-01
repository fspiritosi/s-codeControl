import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../supabase/supabase';
import { supabaseServer } from '@/lib/supabase/server';


export async function GET(request: NextRequest, context: any) {
    const { params } = context

    try {
        let { data: vehicles, error } = await supabase
        .from('vehicles')
        .select("*")
        .eq('company_id', params.id)
    
        const info = vehicles 

        return Response.json({ info })
    
        
    } catch (error) {
        throw new Error('No hay respuesta')
    }
}

