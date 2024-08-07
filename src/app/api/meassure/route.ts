import { supabaseServer } from '@/lib/supabase/server';
import { is, id } from 'date-fns/locale';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const company_id = searchParams.get('actual');
    const user_id = searchParams.get('user');
    
    // console.log(company_id)
    //console.log(user_id); //AQUI ME QUEDE
    try {
        let { data: measure, error } = await supabase
          .from('measure_units')
          .select('*')
          
    
        const data = measure;
    
        if (error) {
          throw new Error(JSON.stringify(error));
        }
        return Response.json({ data });
      } catch (error) {
        console.log(error);
      }
}



