import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest){
    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const company_id = searchParams.get('actual');
    const user_id = searchParams.get('user');

    try {
        let { data: diagram_type, error } = await supabase
        .from('diagram_type')
        .select("*")
        .eq('company_id', company_id)
        
        const data = diagram_type;
        // console.log(data)
        if (error) {
          throw new Error(JSON.stringify(error));
        }
        
        return Response.json({ data });      
    } catch (error) { 
        console.log(error);
    }
   

}